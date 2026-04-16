import pool from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, phone, password } = body

  if (!name || !phone || !password) {
    throw createError({ statusCode: 400, message: '参数不完整' })
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO users (name, phone, password) VALUES (?, ?, ?)',
      [name, phone, password]
    )

    const insertId = (result as any).insertId

    return {
      id: insertId,
      name,
      phone,
      totalAnswered: 0,
      totalCorrect: 0,
      streak: 0
    }
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw createError({ statusCode: 409, message: '该手机号已注册' })
    }
    throw createError({ statusCode: 500, message: '服务器错误' })
  }
})