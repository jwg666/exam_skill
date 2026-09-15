// 随机抽题：GET /api/banks/[id]/random?n=10
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Bank ID is required' })
  }
  const q = getQuery(event)
  let n = Math.floor(Number(q.n || 10))
  if (!Number.isFinite(n) || n < 1) n = 10
  n = Math.min(n, 100)

  const db = useDb()
  const [bankRows] = await db.query('SELECT * FROM banks WHERE id = ?', [id])
  const banks = bankRows as any[]
  if (banks.length === 0) {
    throw createError({ statusCode: 404, message: 'Bank not found' })
  }

  const [questions] = await db.query(
    `SELECT id, type, content, options, answer_index, answer_multi, explanation
     FROM questions WHERE bank_id = ? ORDER BY RAND() LIMIT ?`,
    [id, n]
  )

  return {
    bank: banks[0],
    questions: (questions as any[]).map((q) => {
      let opts: any[] = []
      try { opts = JSON.parse(q.options) } catch { opts = [] }
      const type = q.type || 'single'
      let ans: any = q.answer_index
      if (type === 'multi') {
        try { ans = JSON.parse(q.answer_multi || '[]') } catch { ans = [] }
      }
      return { id: q.id, type, q: q.content, opts, ans, exp: q.explanation }
    })
  }
})
