import { achievementDefs } from '../../shared/achievements'

// 我的成就：定义 + 是否解锁 + 解锁时间
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const db = useDb()

  const [rows] = await db.execute(
    'SELECT achievement_id, created_at FROM user_achievements WHERE user_id = ?',
    [userId]
  )
  const unlocked = new Map<string, Date>((rows as any[]).map((r) => [r.achievement_id, r.created_at]))

  return achievementDefs.map((def) => ({
    ...def,
    unlocked: unlocked.has(def.id),
    unlockedAt: unlocked.get(def.id) || null
  }))
})
