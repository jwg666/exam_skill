// 全部标记已读
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const db = useDb()
  await db.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId])
  return { success: true }
})
