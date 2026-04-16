import pool from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Bank ID is required' })
  }

  const [bankRows] = await pool.query('SELECT * FROM banks WHERE id = ?', [id])
  const banks = bankRows as any[]
  if (banks.length === 0) {
    throw createError({ statusCode: 404, message: 'Bank not found' })
  }

  const bank = banks[0]
  const [questions] = await pool.query('SELECT * FROM questions WHERE bank_id = ? ORDER BY sort_order ASC', [id])
  
  return {
    ...bank,
    questions: (questions as any[]).map(q => ({
      id: q.id,
      q: q.content,
      opts: JSON.parse(q.options),
      ans: q.answer_index,
      exp: q.explanation
    }))
  }
})