// 学习排行榜：按总答题数排序，取前 20；返回当前用户排名
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const db = useDb()

  const [rows] = await db.execute(
    `SELECT id, name, total_answered, total_correct, streak,
            CASE WHEN total_answered > 0 THEN ROUND(total_correct / total_answered * 100) ELSE 0 END AS accuracy
     FROM users
     ORDER BY total_answered DESC, total_correct DESC
     LIMIT 20`
  )

  const [meRows] = await db.execute(
    `SELECT 1 + COUNT(*) AS my_rank FROM users u
     WHERE (u.total_answered > (SELECT total_answered FROM users WHERE id = ?))
        OR (u.total_answered = (SELECT total_answered FROM users WHERE id = ?) AND u.id < ?)`,
    [userId, userId, userId]
  )

  return {
    list: (rows as any[]).map((r, i) => ({
      rank: i + 1,
      id: r.id,
      name: r.name,
      isMe: r.id === userId,
      totalAnswered: Number(r.total_answered),
      accuracy: Number(r.accuracy || 0),
      streak: Number(r.streak || 0)
    })),
    myRank: Number((meRows as any[])[0]?.my_rank || 0)
  }
})
