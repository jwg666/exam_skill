// 收藏列表
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const db = useDb()

  const [rows] = await db.execute(
    `SELECT f.id, f.question_id, f.bank_id, b.name AS bank_name,
            q.type, q.content, q.options, q.answer_index, q.answer_multi, q.explanation
     FROM favorites f
     JOIN questions q ON q.id = f.question_id
     JOIN banks b ON b.id = f.bank_id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [userId]
  )

  return (rows as any[]).map((r) => {
    let opts: any[] = []
    try { opts = JSON.parse(r.options) } catch { opts = [] }
    const type = r.type || 'single'
    let ans: any = r.answer_index
    if (type === 'multi') {
      try { ans = JSON.parse(r.answer_multi || '[]') } catch { ans = [] }
    }
    return {
      id: r.id,
      questionId: r.question_id,
      bankId: r.bank_id,
      bankName: r.bank_name,
      type,
      question: r.content,
      opts,
      ans,
      exp: r.explanation
    }
  })
})
