// 近 7 天打卡记录 + 当前连续天数
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const db = useDb()
  const start = cstDateStr(new Date(Date.now() - 6 * 86400_000))

  const [rows] = await db.execute(
    'SELECT date_str FROM checkins WHERE user_id = ? AND date_str >= ? ORDER BY date_str ASC',
    [userId, start]
  )
  const [uRows] = await db.execute('SELECT streak FROM users WHERE id = ?', [userId])

  const days = (rows as any[]).map((r) => r.date_str)
  return {
    days,
    streak: Number((uRows as any[])[0]?.streak || 0),
    checkedToday: days.includes(cstDateStr())
  }
})
