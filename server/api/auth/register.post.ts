import bcrypt from 'bcryptjs'
import { signToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = (body?.name || '').trim()
  const phone = (body?.phone || '').trim()
  const password = body?.password || ''

  if (!name || !phone || !password) {
    throw createError({ statusCode: 400, message: '参数不完整' })
  }
  if (!/^1\d{10}$/.test(phone)) {
    throw createError({ statusCode: 400, message: '手机号格式不正确' })
  }
  if (String(password).length < 6) {
    throw createError({ statusCode: 400, message: '密码至少 6 位' })
  }

  const db = useDb()
  try {
    const hashed = await bcrypt.hash(password, 10)
    const [result] = await db.execute(
      'INSERT INTO users (name, phone, password) VALUES (?, ?, ?)',
      [name, phone, hashed]
    )
    const id = (result as any).insertId

    return {
      token: signToken(id),
      user: { id, name, phone, totalAnswered: 0, totalCorrect: 0, streak: 0 }
    }
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw createError({ statusCode: 409, message: '该手机号已注册' })
    }
    throw createError({ statusCode: 500, message: '服务器错误' })
  }
})
