import bcrypt from 'bcryptjs'
import { signToken } from '../../utils/auth'
import { unlockAchievement } from '../../utils/game'
import { checkSmsCode } from '../../utils/sms'

// 登录：支持两种方式
// 1. { phone, password } 密码登录（存量账号/管理员）
// 2. { phone, code }     短信验证码登录（无密码账号）
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const phone = (body?.phone || '').trim()
  const password = body?.password || ''
  const code = (body?.code || '').trim()

  if (!phone || (!password && !code)) {
    throw createError({ statusCode: 400, message: '参数不完整' })
  }

  const db = useDb()
  const [rows] = await db.execute('SELECT * FROM users WHERE phone = ?', [phone])
  const users = rows as any[]

  if (users.length === 0) {
    throw createError({ statusCode: 401, message: '账号或密码错误' })
  }
  const user = users[0]

  if (code) {
    // 短信验证码登录
    const verify = checkSmsCode(phone, code)
    if (!verify.ok) {
      throw createError({ statusCode: 401, message: verify.message })
    }
  } else {
    // 密码登录；存量明文密码比对通过后自动升级为 bcrypt 哈希
    const isHashed = typeof user.password === 'string' && user.password.startsWith('$2')
    const ok = isHashed
      ? await bcrypt.compare(password, user.password)
      : password === user.password
    if (!ok) {
      throw createError({ statusCode: 401, message: '账号或密码错误' })
    }
    if (!isHashed) {
      await db.execute('UPDATE users SET password = ? WHERE id = ?', [
        await bcrypt.hash(password, 10),
        user.id
      ])
    }
  }

  const firstLogin = await unlockAchievement(db, user.id, 'first_login')

  return {
    token: signToken(user.id),
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      totalAnswered: user.total_answered,
      totalCorrect: user.total_correct,
      streak: user.streak,
      isAdmin: !!user.is_admin
    },
    newlyUnlocked: firstLogin ? [firstLogin] : []
  }
})
