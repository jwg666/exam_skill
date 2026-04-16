import pool from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone, password } = body

  if (!phone || !password) {
    throw createError({ statusCode: 400, message: '手机号和密码不能为空' })
  }

  const [rows] = await pool.execute('SELECT * FROM users WHERE phone = ? AND password = ?', [phone, password])
  const users = rows as any[]

  if (users.length === 0) {
    throw createError({ statusCode: 401, message: '账号或密码错误' })
  }

  const user = users[0]
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    totalAnswered: user.total_answered,
    totalCorrect: user.total_correct,
    streak: user.streak
  }
})