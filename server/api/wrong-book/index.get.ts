// 错题本列表：联表返回题目内容与解析，可按题库筛选
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const db = useDb()
  const q = getQuery(event)
  const bankId = (q.bankId as string || '').trim()

  let sql = `
    SELECT w.id, w.question_id, w.bank_id, b.name AS bank_name, b.type_name,
           q.type, q.content, q.options, q.answer_index, q.answer_multi, q.explanation
    FROM wrong_books w
    JOIN questions q ON q.id = w.question_id
    JOIN banks b ON b.id = w.bank_id
    WHERE w.user_id = ?`
  const params: any[] = [userId]
  if (bankId) {
    sql += ' AND w.bank_id = ?'
    params.push(bankId)
  }
  sql += ' ORDER BY w.created_at DESC'

  const [rows] = await db.execute(sql, params)
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
      typeName: r.type_name,
      type,
      question: r.content,
      opts,
      ans,
      exp: r.explanation
    }
  })
})
