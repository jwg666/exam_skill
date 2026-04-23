import pool from '../../../utils/db'
import { ensureExamSkillSchema } from '../../../utils/examSchema'
import { readUserId, requireFiniteUserId } from '../_utils'

export default defineEventHandler(async (event) => {
  const userId = requireFiniteUserId(readUserId(event))
  await ensureExamSkillSchema()

  const [rows] = await pool.execute(`SELECT achievement_id FROM user_achievements WHERE user_id = ? ORDER BY id ASC`, [userId])
  return { ok: true, achievements: (rows as any[]).map((r) => String(r.achievement_id)) }
})
