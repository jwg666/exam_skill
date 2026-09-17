// 我的测评报告列表（16型人格/智商测试等），最新 20 条
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const db = useDb()

  const [rows] = await db.execute(
    `SELECT h.id, h.bank_id, h.date_str, h.accuracy, h.created_at, h.report,
            b.name AS bank_name, b.icon AS bank_icon, b.color AS bank_color
     FROM histories h
     JOIN banks b ON b.id = h.bank_id
     WHERE h.user_id = ? AND b.kind = 'assessment' AND h.report IS NOT NULL
     ORDER BY h.created_at DESC, h.id DESC
     LIMIT 20`,
    [userId]
  )

  return (rows as any[]).map((r) => {
    let report: any = null
    try { report = JSON.parse(r.report) } catch { report = null }
    return {
      id: r.id,
      bankId: r.bank_id,
      bankName: r.bank_name,
      icon: r.bank_icon,
      color: r.bank_color,
      date: r.date_str,
      accuracy: r.accuracy,
      report
    }
  }).filter((r) => r.report)
})
