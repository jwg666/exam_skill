import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { signToken } from '../../utils/auth'
import { unlockAchievement } from '../../utils/game'
import { checkSmsCode } from '../../utils/sms'

// 注册：手机号 + 短信验证码；昵称选填，为空默认使用手机号
// 密码不再由用户设置，写入不可登录的随机哈希占位
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const phone = (body?.phone || '').trim()
  const code = (body?.code || '').trim()
  const name = (body?.name || '').trim() || phone

  if (!phone || !code) {
    throw createError({ statusCode: 400, message: '参数不完整' })
  }
  if (!/^1\d{10}$/.test(phone)) {
    throw createError({ statusCode: 400, message: '手机号格式不正确' })
  }
  if (name.length > 20) {
    throw createError({ statusCode: 400, message: '昵称最多 20 个字符' })
  }

  const verify = checkSmsCode(phone, code)
  if (!verify.ok) {
    throw createError({ statusCode: 400, message: verify.message })
  }

  const db = useDb()
  try {
    // 随机哈希占位：任何密码都无法匹配，保证短信注册账号的密码登录通道不可用
    const unusable = await bcrypt.hash(randomUUID(), 10)
    const [result] = await db.execute(
      'INSERT INTO users (name, phone, password) VALUES (?, ?, ?)',
      [name, phone, unusable]
    )
    const id = (result as any).insertId
    // 注册即首次登录：解锁 first_login
    const firstLogin = await unlockAchievement(db, id, 'first_login')

    return {
      token: signToken(id),
      user: { id, name, phone, totalAnswered: 0, totalCorrect: 0, streak: 0 },
      newlyUnlocked: firstLogin ? [firstLogin] : []
    }
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw createError({ statusCode: 409, message: '该手机号已注册，请直接登录' })
    }
    throw createError({ statusCode: 500, message: '服务器错误' })
  }
})
