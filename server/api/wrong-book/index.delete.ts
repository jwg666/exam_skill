// 移出错题本（已掌握）：DELETE /api/wrong-book?id=xx  或  DELETE /api/wrong-book?questionId=xx
// 不带任何 id 参数则一键清空（返回清空数量）
import { unlockAchievement } from '../../utils/game'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const db = useDb()
  const q = getQuery(event)
  const id = Number(q.id || 0)
  const questionId = Number(q.questionId || 0)

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    let result: any
    let cleared = false
    if (id || questionId) {
      ;[result] = id
        ? await conn.execute('DELETE FROM wrong_books WHERE id = ? AND user_id = ?', [id, userId])
        : await conn.execute('DELETE FROM wrong_books WHERE question_id = ? AND user_id = ?', [questionId, userId])
    } else {
      ;[result] = await conn.execute('DELETE FROM wrong_books WHERE user_id = ?', [userId])
      cleared = true
    }
    const removed = (result as any).affectedRows || 0

    const newlyUnlocked: any[] = []
    // 一键清空且错题本原来非空 → 「知错能改」成就
    if (cleared && removed > 0) {
      const def = await unlockAchievement(conn, userId, 'wrong_clear')
      if (def) newlyUnlocked.push(def)
    }
    await conn.commit()
    return { success: true, removed, newlyUnlocked }
  } catch (err) {
    await conn.rollback()
    throw createError({ statusCode: 500, message: '操作失败' })
  } finally {
    conn.release()
  }
})
