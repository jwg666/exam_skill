// 当前用户信息（供 token 有效但本地 user 丢失时恢复）
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const db = useDb()
  const [rows] = await db.execute('SELECT id, phone, name, total_answered, total_correct, streak, is_admin FROM users WHERE id = ?', [userId])
  const users = rows as any[]
  if (!users.length) {
    throw createError({ statusCode: 401, message: '用户不存在' })
  }
  const u = users[0]
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    totalAnswered: u.total_answered,
    totalCorrect: u.total_correct,
    streak: u.streak,
    isAdmin: !!u.is_admin
  }
})
