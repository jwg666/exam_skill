// 收藏 / 取消收藏：POST { questionId }（bankId 由 question 反查，幂等 toggle）
import { countRows, unlockAchievement } from '../../utils/game'

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const body = await readBody(event)
  const questionId = Number(body?.questionId || 0)
  if (!questionId) {
    throw createError({ statusCode: 400, message: '参数不完整' })
  }

  const db = useDb()
  const [qRows] = await db.execute('SELECT bank_id FROM questions WHERE id = ?', [questionId])
  const questions = qRows as any[]
  if (!questions.length) {
    throw createError({ statusCode: 404, message: '题目不存在' })
  }
  const bankId = questions[0].bank_id

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const [del] = await conn.execute(
      'DELETE FROM favorites WHERE user_id = ? AND question_id = ?',
      [userId, questionId]
    )
    let favorited = false
    if ((del as any).affectedRows === 0) {
      await conn.execute(
        'INSERT IGNORE INTO favorites (user_id, bank_id, question_id) VALUES (?, ?, ?)',
        [userId, bankId, questionId]
      )
      favorited = true

      // 收藏数成就
      const total = await countRows(conn, 'SELECT COUNT(*) AS c FROM favorites WHERE user_id = ?', [userId])
      if (total >= 10) {
        const def = await unlockAchievement(conn, userId, 'fav_10')
        if (def) var newlyUnlocked = [def]
      }
    }
    await conn.commit()
    return { success: true, favorited, newlyUnlocked: newlyUnlocked || [] }
  } catch (err) {
    await conn.rollback()
    throw createError({ statusCode: 500, message: '操作失败' })
  } finally {
    conn.release()
  }
})
