import { createError } from 'h3'
import pool from '../../../../utils/db'
import { ensureExamSkillSchema } from '../../../../utils/examSchema'
import { readUserId, requireFiniteUserId } from '../../_utils'

export default defineEventHandler(async (event) => {
  const userId = requireFiniteUserId(readUserId(event))
  const id = Number(event.context.params?.id)
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: 'id 非法' })

  await ensureExamSkillSchema()
  await pool.execute(`UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND read_at IS NULL`, [id, userId])
  return { ok: true }
})
