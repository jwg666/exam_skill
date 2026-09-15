import { unlockAchievement } from '../../utils/game'

// 每日打卡：插入成功则按昨天是否打卡续算 streak，并判定连续打卡成就
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const db = useDb()
  const today = cstDateStr()
  const yesterday = cstDateStr(new Date(Date.now() - 86400_000))

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const [r] = await conn.execute(
      'INSERT IGNORE INTO checkins (user_id, date_str) VALUES (?, ?)',
      [userId, today]
    )
    const inserted = (r as any).affectedRows > 0

    let streak = 0
    const newlyUnlocked: any[] = []

    if (inserted) {
      const [uRows] = await conn.execute('SELECT streak FROM users WHERE id = ? FOR UPDATE', [userId])
      const prev = Number((uRows as any[])[0]?.streak || 0)
      const [y] = await conn.execute(
        'SELECT id FROM checkins WHERE user_id = ? AND date_str = ?',
        [userId, yesterday]
      )
      streak = (y as any[]).length > 0 ? prev + 1 : 1
      await conn.execute('UPDATE users SET streak = ? WHERE id = ?', [streak, userId])

      const thresholds: Array<[string, number]> = [['streak_3', 3], ['streak_7', 7], ['streak_30', 30]]
      for (const [id, min] of thresholds) {
        if (streak >= min) {
          const def = await unlockAchievement(conn, userId, id)
          if (def) newlyUnlocked.push(def)
        }
      }
      await conn.commit()
    } else {
      await conn.rollback()
      const [uRows] = await conn.execute('SELECT streak FROM users WHERE id = ?', [userId])
      streak = Number((uRows as any[])[0]?.streak || 0)
    }

    return { success: true, alreadyChecked: !inserted, streak, newlyUnlocked }
  } catch (err) {
    await conn.rollback()
    throw createError({ statusCode: 500, message: '打卡失败' })
  } finally {
    conn.release()
  }
})
