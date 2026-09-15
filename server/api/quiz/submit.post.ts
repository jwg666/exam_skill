import { unlockAchievement } from '../../utils/game'

interface SubmitBody {
  bankId?: string
  total?: number
  correct?: number
  timeSpent?: number
  wrongQuestions?: number[]
}

// 交卷：校验参数（服务端生成日期）→ 写历史 → 累加用户数据 → 错题入库 → 更新刷题进度 → 判定成就
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const body = await readValidatedBody<SubmitBody>(event, (b: any) => {
    if (!b || typeof b.bankId !== 'string' || !b.bankId) throw new Error('参数不完整')
    const total = Number(b.total)
    const correct = Number(b.correct)
    const timeSpent = Number(b.timeSpent)
    if (!Number.isInteger(total) || total < 0 || total > 10000) throw new Error('total 不合法')
    if (!Number.isInteger(correct) || correct < 0 || correct > total) throw new Error('correct 不合法')
    if (!Number.isFinite(timeSpent) || timeSpent < 0 || timeSpent > 86400 * 365) throw new Error('timeSpent 不合法')
    if (b.wrongQuestions !== undefined && !Array.isArray(b.wrongQuestions)) throw new Error('wrongQuestions 不合法')
    return {
      bankId: b.bankId,
      total,
      correct,
      timeSpent: Math.round(timeSpent),
      wrongQuestions: (b.wrongQuestions || []).map(Number).filter((n: number) => Number.isInteger(n))
    }
  })

  const { bankId, total, correct, timeSpent, wrongQuestions } = body
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const today = cstDateStr()

  const db = useDb()
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    // 校验题库存在
    const [bankRows] = await conn.execute('SELECT id FROM banks WHERE id = ?', [bankId])
    if (!(bankRows as any[]).length) {
      throw createError({ statusCode: 404, message: '题库不存在' })
    }

    await conn.execute(
      'INSERT INTO histories (user_id, bank_id, date_str, total, correct, time_spent, accuracy) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, bankId, today, total, correct, timeSpent, accuracy]
    )

    await conn.execute(
      'UPDATE users SET total_answered = total_answered + ?, total_correct = total_correct + ? WHERE id = ?',
      [total, correct, userId]
    )

    for (const qId of wrongQuestions) {
      await conn.execute(
        'INSERT IGNORE INTO wrong_books (user_id, bank_id, question_id) VALUES (?, ?, ?)',
        [userId, bankId, qId]
      )
    }

    // 顺序练习进度：done 取累计完成数（按正确+错误都算已做），未通过题目数超过总题数时以总题数为上限
    const [qCountRows] = await conn.execute('SELECT COUNT(*) AS c FROM questions WHERE bank_id = ?', [bankId])
    const bankTotal = Number((qCountRows as any[])[0]?.c || 0)
    await conn.execute(
      `INSERT INTO user_bank_progress (user_id, bank_id, done, last_index) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE done = GREATEST(done, VALUES(done)), last_index = VALUES(last_index)`,
      [userId, bankId, Math.min(total, bankTotal), Math.min(total, Math.max(bankTotal - 1, 0))]
    )

    // 成就判定
    const newlyUnlocked: any[] = []
    const push = (def: any) => { if (def) newlyUnlocked.push(def) }
    push(await unlockAchievement(conn, userId, 'first_quiz'))
    const [uRows] = await conn.execute('SELECT total_answered FROM users WHERE id = ?', [userId])
    const totalAnswered = Number((uRows as any[])[0]?.total_answered || 0)
    if (totalAnswered >= 50) push(await unlockAchievement(conn, userId, 'quiz_50'))
    if (totalAnswered >= 200) push(await unlockAchievement(conn, userId, 'quiz_200'))
    if (totalAnswered >= 500) push(await unlockAchievement(conn, userId, 'quiz_500'))
    if (accuracy >= 80) push(await unlockAchievement(conn, userId, 'acc_80'))
    if (accuracy === 100) push(await unlockAchievement(conn, userId, 'acc_100'))

    await conn.commit()
    return { success: true, accuracy, newlyUnlocked }
  } catch (err: any) {
    await conn.rollback()
    if (err?.statusCode) throw err
    throw createError({ statusCode: 500, message: '提交失败' })
  } finally {
    conn.release()
  }
})
