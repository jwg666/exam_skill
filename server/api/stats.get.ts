// 学习报告：总览 + 近 7 天练习 + 各科目正确率 + 答题时段分布
// 连接池已统一会话时区为 +08:00（见 server/utils/db.ts），日期/小时直接取库内值即可
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const db = useDb()

  const [uRows] = await db.execute('SELECT total_answered, total_correct, streak FROM users WHERE id = ?', [userId])
  const user = (uRows as any[])[0] || { total_answered: 0, total_correct: 0, streak: 0 }

  const start7 = cstDateStr(new Date(Date.now() - 6 * 86400_000))
  const [weekRows] = await db.execute(
    `SELECT date_str, SUM(total) AS total, SUM(correct) AS correct, SUM(time_spent) AS time_spent
     FROM histories WHERE user_id = ? AND date_str >= ?
     GROUP BY date_str ORDER BY date_str ASC`,
    [userId, start7]
  )
  const weekMap = new Map<string, any>((weekRows as any[]).map((r) => [r.date_str, r]))
  const week: any[] = []
  for (let i = 6; i >= 0; i--) {
    const d = cstDateStr(new Date(Date.now() - i * 86400_000))
    const r = weekMap.get(d)
    week.push({ date: d, total: Number(r?.total || 0), correct: Number(r?.correct || 0), timeSpent: Number(r?.time_spent || 0) })
  }

  const [typeRows] = await db.execute(
    `SELECT b.type, b.type_name, SUM(h.total) AS total, SUM(h.correct) AS correct
     FROM histories h JOIN banks b ON b.id = h.bank_id
     WHERE h.user_id = ?
     GROUP BY b.type, b.type_name
     HAVING SUM(h.total) > 0
     ORDER BY total DESC`,
    [userId]
  )
  const byType = (typeRows as any[]).map((r) => ({
    type: r.type,
    typeName: r.type_name || r.type,
    total: Number(r.total),
    accuracy: Number(r.total) ? Math.round((Number(r.correct) / Number(r.total)) * 100) : 0
  }))

  const [hourRows] = await db.execute(
    'SELECT HOUR(created_at) AS h, COUNT(*) AS c FROM histories WHERE user_id = ? GROUP BY h',
    [userId]
  )
  const dist = { morning: 0, noon: 0, evening: 0 }
  for (const r of hourRows as any[]) {
    const h = Number(r.h)
    const c = Number(r.c)
    if (h >= 5 && h < 12) dist.morning += c
    else if (h >= 12 && h < 18) dist.noon += c
    else dist.evening += c
  }

  return {
    totalAnswered: Number(user.total_answered || 0),
    totalCorrect: Number(user.total_correct || 0),
    accuracy: Number(user.total_answered) ? Math.round((Number(user.total_correct) / Number(user.total_answered)) * 100) : 0,
    streak: Number(user.streak || 0),
    week,
    byType,
    timeDistribution: dist
  }
})
