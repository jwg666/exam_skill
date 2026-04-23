import pool from '../../utils/db'
import { ensureExamSkillSchema } from '../../utils/examSchema'
import { loadGamificationRulesForServer } from '../../utils/gamificationLoader'
import { buildUserAuthPayload } from '../../utils/userPayload'
import { readUserId, requireFiniteUserId } from './_utils'

export default defineEventHandler(async (event) => {
  const userId = requireFiniteUserId(readUserId(event))
  await ensureExamSkillSchema()
  const { rules, source } = await loadGamificationRulesForServer()

  const [uRows] = await pool.execute(`SELECT * FROM users WHERE id = ? LIMIT 1`, [userId])
  const user = (uRows as any[])[0]
  if (!user) throw createError({ statusCode: 404, message: '用户不存在' })

  const [aRows] = await pool.execute(`SELECT achievement_id FROM user_achievements WHERE user_id = ? ORDER BY id ASC`, [userId])
  const achievements = (aRows as any[]).map((r) => String(r.achievement_id))

  const [cRows] = await pool.execute(`SELECT date_str FROM checkins WHERE user_id = ? ORDER BY date_str ASC`, [userId])
  const checkedDays = (cRows as any[]).map((r) => String(r.date_str))

  const [n1] = await pool.execute(`SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL`, [userId])
  const unreadNotifications = Number((n1 as any[])[0]?.c || 0)

  return {
    ok: true,
    gamificationSource: source,
    user: buildUserAuthPayload(user, rules),
    achievements,
    checkedDays,
    unreadNotifications,
  }
})
