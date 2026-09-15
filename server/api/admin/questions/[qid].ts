// 管理端：修改 / 删除题目
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const qid = Number(getRouterParam(event, 'qid'))
  if (!Number.isInteger(qid)) throw createError({ statusCode: 400, message: '题目 ID 不合法' })
  const db = useDb()

  if (event.method === 'DELETE') {
    await db.execute('DELETE FROM questions WHERE id = ?', [qid])
    return { success: true }
  }

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

  await db.execute(
    'UPDATE questions SET type = ?, content = ?, options = ?, answer_index = ?, answer_multi = ?, explanation = ? WHERE id = ?',
    [type, content, JSON.stringify(opts), answerIndex, answerMulti, exp, qid]
  )
  return { success: true }
})
