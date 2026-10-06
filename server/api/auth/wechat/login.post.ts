import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { unlockAchievement } from '../../../utils/game'
import { codeToOpenid, mockOpenid, wechatProvider } from '../../../utils/wechat'

// 微信登录：POST { code, mockOpenid? }
// - 小程序端 wx.login() 取 code 上传，服务端换 openid（AppSecret 只在服务端，不下发）
// - openid 已有账号 → 直接登录
// - 首次微信登录 → 直接创建免手机号的微信账号（name 默认「微信用户+openid尾号」，密码为不可登录占位），
//   手机号事后在「我的」页可选绑定（/api/auth/wechat/bind）
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const code = (body?.code || '').trim()
  if (!code) {
    throw createError({ statusCode: 400, message: '缺少 code' })
  }

  const openid = wechatProvider() === 'wechat'
    ? await codeToOpenid(code)
    : mockOpenid(body?.mockOpenid, code)

  const db = useDb()
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE openid = ? LIMIT 1', [openid])
    let user = (rows as any[])[0]
    let firstLogin = null

    if (!user) {
      const unusable = await bcrypt.hash(randomUUID(), 10)
      const name = '微信用户' + openid.slice(-4)
      const [result] = await db.execute(
        'INSERT INTO users (name, phone, password, openid) VALUES (?, NULL, ?, ?)',
        [name, unusable, openid]
      )
      const id = (result as any).insertId
      const [createdRows] = await db.execute('SELECT * FROM users WHERE id = ?', [id])
      user = (createdRows as any[])[0]
      firstLogin = await unlockAchievement(db, id, 'first_login')
    } else {
      firstLogin = await unlockAchievement(db, user.id, 'first_login')
    }

    return {
      token: signToken(user.id),
      user: {
        id: user.id,
        phone: user.phone || null,
        name: user.name,
        totalAnswered: user.total_answered,
        totalCorrect: user.total_correct,
        streak: user.streak,
        isAdmin: !!user.is_admin
      },
      newlyUnlocked: firstLogin ? [firstLogin] : []
    }
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw createError({ statusCode: 409, message: '微信登录冲突，请重试' })
    }
    throw err
  }
})
