import { createError, readBody } from 'h3'
import pool from '../../utils/db'
import { ensureExamSkillSchema } from '../../utils/examSchema'
import { readUserId, requireFiniteUserId } from './_utils'

export default defineEventHandler(async (event) => {
  const qid = readUserId(event)
  const body = await readBody(event).catch(() => ({} as any))
  const userId = requireFiniteUserId(Number.isFinite(qid) ? qid : Number(body?.userId))
  const theme = String(body?.theme || '')
  if (theme !== 'dark' && theme !== 'light') throw createError({ statusCode: 400, message: 'theme 非法' })

  await ensureExamSkillSchema()
  await pool.execute(`UPDATE users SET theme = ? WHERE id = ?`, [theme, userId])
  return { ok: true, theme }
})
