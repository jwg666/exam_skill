import pool from '../../utils/db'
import { encryptPassword, verifyPassword } from '../../utils/passwordCrypto'

export default defineEventHandler(async (event) => {
  const { passwordAesSecret } = useRuntimeConfig()
  const body = await readBody(event)
  const { phone, password } = body

  if (!phone || !password) {
    throw createError({ statusCode: 400, message: '手机号和密码不能为空' })
  }

  const [rows] = await pool.execute('SELECT * FROM users WHERE phone = ? LIMIT 1', [phone])
  const users = rows as any[]

  if (users.length === 0) {
    throw createError({ statusCode: 401, message: '账号或密码错误' })
  }

  const user = users[0]
  let ok = false
  let needsUpgrade = false
  try {
    const result = verifyPassword(user.password, password, passwordAesSecret)
    ok = result.ok
    needsUpgrade = result.needsUpgrade
  } catch (e: any) {
    if (e?.message === 'Missing password AES secret') {
      throw createError({ statusCode: 500, message: '未配置密码加密密钥' })
    }
    throw createError({ statusCode: 500, message: '服务器错误' })
  }
  if (!ok) {
    throw createError({ statusCode: 401, message: '账号或密码错误' })
  }

  if (needsUpgrade && passwordAesSecret) {
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [encryptPassword(password, passwordAesSecret), user.id])
  }

  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    totalAnswered: user.total_answered,
    totalCorrect: user.total_correct,
    streak: user.streak
  }
})
