// 管理端：为题库添加题目
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const bankId = getRouterParam(event, 'id')
  if (!bankId) throw createError({ statusCode: 400, message: '缺少题库 ID' })

  const body = await readBody(event)
  const content = (body?.content || '').trim()
  const opts: string[] = Array.isArray(body?.opts) ? body.opts.map((o: any) => String(o)) : []
  const type = ['single', 'judge', 'multi'].includes(body?.type) ? body.type : 'single'
  const exp = (body?.explanation || '').trim()

  if (!content || opts.length < 2) {
    throw createError({ statusCode: 400, message: '题干与至少两个选项必填' })
  }

  let answerIndex = 0
  let answerMulti: string | null = null
  if (type === 'multi') {
    const arr = (Array.isArray(body?.ans) ? body.ans : []).map(Number).filter((n: number) => Number.isInteger(n) && n >= 0 && n < opts.length)
    if (!arr.length) throw createError({ statusCode: 400, message: '多选题须至少选择一个正确答案' })
    answerMulti = JSON.stringify([...new Set(arr)].sort((a, b) => a - b))
  } else {
    answerIndex = Number(body?.ans)
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= opts.length) {
      throw createError({ statusCode: 400, message: '正确答案索引不合法' })
    }
  }

  const db = useDb()
  const [bankRows] = await db.execute('SELECT id FROM banks WHERE id = ?', [bankId])
  if (!(bankRows as any[]).length) throw createError({ statusCode: 404, message: '题库不存在' })

  const [maxRows] = await db.execute('SELECT COALESCE(MAX(sort_order), -1) AS m FROM questions WHERE bank_id = ?', [bankId])
  const nextOrder = Number((maxRows as any[])[0]?.m || -1) + 1

  const [result] = await db.execute(
    'INSERT INTO questions (bank_id, type, content, options, answer_index, answer_multi, explanation, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [bankId, type, content, JSON.stringify(opts), answerIndex, answerMulti, exp, nextOrder]
  )
  await db.execute('UPDATE banks SET total = (SELECT COUNT(*) FROM questions WHERE bank_id = ?) WHERE id = ?', [bankId, bankId])

  return { success: true, id: (result as any).insertId }
})
