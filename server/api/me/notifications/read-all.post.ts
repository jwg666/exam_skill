import pool from '../../../utils/db'
import { ensureExamSkillSchema } from '../../../utils/examSchema'
import { readUserId, requireFiniteUserId } from '../_utils'

export default defineEventHandler(async (event) => {
  const userId = requireFiniteUserId(readUserId(event))
  await ensureExamSkillSchema()
  await pool.execute(`UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL`, [userId])
  return { ok: true }
})
