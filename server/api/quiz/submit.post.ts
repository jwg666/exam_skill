import pool from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userId, bankId, total, correct, timeSpent, accuracy, wrongQuestions, dateStr } = body

  if (!userId || !bankId) {
    throw createError({ statusCode: 400, message: '参数不完整' })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // 1. 更新历史记录
    await conn.execute(
      `INSERT INTO histories (user_id, bank_id, total, correct, time_spent, accuracy, date_str) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, bankId, total, correct, timeSpent, accuracy, dateStr || new Date().toLocaleDateString()]
    )

    // 2. 更新用户总数据
    await conn.execute(
      `UPDATE users SET total_answered = total_answered + ?, total_correct = total_correct + ? WHERE id = ?`,
      [total, correct, userId]
    )

    // 3. 处理错题本
    if (wrongQuestions && wrongQuestions.length > 0) {
      for (const qId of wrongQuestions) {
        await conn.execute(
          `INSERT IGNORE INTO wrong_books (user_id, bank_id, question_id) VALUES (?, ?, ?)`,
          [userId, bankId, qId]
        )
      }
    }

    await conn.commit()
    return { success: true }
  } catch (err) {
    await conn.rollback()
    throw createError({ statusCode: 500, message: '提交失败' })
  } finally {
    conn.release()
  }
})