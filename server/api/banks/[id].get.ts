export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Bank ID is required' })
  }

  const db = useDb()
  const [bankRows] = await db.query('SELECT * FROM banks WHERE id = ?', [id])
  const banks = bankRows as any[]
  if (banks.length === 0) {
    throw createError({ statusCode: 404, message: 'Bank not found' })
  }
  const bank = banks[0]

  const [questions] = await db.query(
    'SELECT id, type, content, options, answer_index, answer_multi, explanation FROM questions WHERE bank_id = ? ORDER BY sort_order ASC',
    [id]
  )

  return {
    ...bank,
    questions: (questions as any[]).map((q) => {
      let opts: any[] = []
      try { opts = JSON.parse(q.options) } catch { opts = [] }
      const type = q.type || 'single'
      let ans: any = q.answer_index
      if (type === 'multi') {
        try { ans = JSON.parse(q.answer_multi || '[]') } catch { ans = [] }
      }
      if (type === 'judge') ans = q.answer_index
      const item: any = { id: q.id, type, q: q.content, opts, ans, exp: q.explanation }
      // 测评类题库由服务端判分出报告，不下发答案与解析防止作弊
      if (bank.kind === 'assessment') {
        delete item.ans
        delete item.exp
      }
      return item
    })
  }
})
