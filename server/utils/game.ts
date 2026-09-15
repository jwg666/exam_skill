import { findAchievement, type AchievementDef } from '../../shared/achievements'

// 解锁成就：新解锁时写入记录并生成一条通知，返回成就定义（前端弹 Toast 用）；已解锁返回 null
export async function unlockAchievement(
  conn: any,
  userId: number,
  achievementId: string
): Promise<AchievementDef | null> {
  const [r] = await conn.execute(
    'INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
    [userId, achievementId]
  )
  if ((r as any).affectedRows > 0) {
    const def = findAchievement(achievementId)
    if (def) {
      await addNotification(conn, userId, 'achievement', `解锁成就「${def.name}」`, def.desc)
    }
    return def || null
  }
  return null
}

export async function addNotification(
  conn: any,
  userId: number,
  type: string,
  title: string,
  content?: string
): Promise<void> {
  await conn.execute(
    'INSERT INTO notifications (user_id, type, title, content) VALUES (?, ?, ?, ?)',
    [userId, type, title, content || null]
  )
}

export async function countRows(conn: any, sql: string, params: any[]): Promise<number> {
  const [rows] = await conn.execute(sql, params)
  return Number((rows as any[])[0]?.c || 0)
}
