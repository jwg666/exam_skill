// 个人资料修改：昵称（手机号只读展示由前端脱敏）
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const body = await readBody(event)
  const name = (body?.name || '').trim()

  if (!name || name.length > 20) {
    throw createError({ statusCode: 400, message: '昵称为 1~20 个字符' })
  }

  const db = useDb()
  await db.execute('UPDATE users SET name = ? WHERE id = ?', [name, userId])
  const [rows] = await db.execute('SELECT id, phone, name FROM users WHERE id = ?', [userId])
  return { success: true, user: rows as any[] }
})
