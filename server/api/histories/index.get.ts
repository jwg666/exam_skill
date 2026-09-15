// 答题历史列表（联 banks 取名称，最近 100 条）
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const db = useDb()

  const [rows] = await db.execute(
    `SELECT h.id, h.bank_id, h.date_str, h.total, h.correct, h.time_spent, h.accuracy, h.created_at,
            b.name AS bank_name, b.icon AS bank_icon, b.color AS bank_color
     FROM histories h
     JOIN banks b ON b.id = h.bank_id
     WHERE h.user_id = ?
     ORDER BY h.created_at DESC
     LIMIT 100`,
    [userId]
  )

  return (rows as any[]).map((r) => ({
    id: r.id,
    bankId: r.bank_id,
    bankName: r.bank_name,
    bankIcon: r.bank_icon,
    bankColor: r.bank_color,
    date: r.date_str,
    total: r.total,
    correct: r.correct,
    time: r.time_spent,
    accuracy: r.accuracy
  }))
})
