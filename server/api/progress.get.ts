// 各题库已完成题数：{ [bankId]: done }
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const db = useDb()
  const [rows] = await db.execute(
    'SELECT bank_id, done FROM user_bank_progress WHERE user_id = ?',
    [userId]
  )
  const map: Record<string, number> = {}
  for (const r of rows as any[]) map[r.bank_id] = Number(r.done || 0)
  return map
})
