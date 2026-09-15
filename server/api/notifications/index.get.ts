// 通知列表（最近 50 条）+ 未读数
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const db = useDb()

  const [rows] = await db.execute(
    'SELECT id, type, title, content, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50',
    [userId]
  )
  const [cntRows] = await db.execute(
    'SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  )

  return {
    list: rows as any[],
    unread: Number((cntRows as any[])[0]?.c || 0)
  }
})
