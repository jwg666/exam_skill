import { unlockAchievement } from '../../utils/game'
import { buildMbtiReport, buildIqReport } from '../../../shared/assessment'

interface SubmitBody {
  bankId?: string
  timeSpent?: number
  answers?: Array<number | number[]>
}

// 交卷：客户端只上传原始作答，服务端统一判分（防成绩伪造）
// - 普通题库：写历史 → 累加用户数据 → 错题入库 → 判定成就
// - 测评题库（kind=assessment）：不进错题本，生成报告存入历史（MBTI 人格报告 / IQ 智商报告）；
//   MBTI 不计入知识答题总量
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const body = await readValidatedBody<SubmitBody>(event, (b: any) => {
    if (!b || typeof b.bankId !== 'string' || !b.bankId) throw new Error('参数不完整')
    const timeSpent = Number(b.timeSpent)
    if (!Number.isFinite(timeSpent) || timeSpent < 0 || timeSpent > 86400 * 365) throw new Error('timeSpent 不合法')
    if (!Array.isArray(b.answers)) throw new Error('缺少作答数据')
    const answers = b.answers.map((a: any) => {
      if (Array.isArray(a)) return a.map(Number).filter((n: number) => Number.isInteger(n))
      const n = Number(a)
      return Number.isInteger(n) ? n : -1
    })
    return { bankId: b.bankId, timeSpent: Math.round(timeSpent), answers }
  })

  const { bankId, timeSpent, answers } = body
  const today = cstDateStr()

  const db = useDb()
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const [bankRows] = await conn.execute('SELECT id, kind FROM banks WHERE id = ?', [bankId])
    const bank = (bankRows as any[])[0]
    if (!bank) {
      throw createError({ statusCode: 404, message: '题库不存在' })
    }
    const isAssessment = bank.kind === 'assessment'

    const [qRows] = await conn.execute(
      'SELECT id, type, answer_index, answer_multi, meta FROM questions WHERE bank_id = ? ORDER BY sort_order ASC',
      [bankId]
    )
    const questions = qRows as any[]
    const total = questions.length
    if (!total) {
      throw createError({ statusCode: 400, message: '该题库暂无题目' })
    }
    if (answers.length !== total) {
      throw createError({ statusCode: 400, message: '作答数量与题目数量不符' })
    }

    const isCorrectAt = (q: any, a: number | number[] | undefined): boolean => {
      if (a === undefined || a === -1 || (Array.isArray(a) && a.length === 0)) return false
      const type = q.type || 'single'
      if (type === 'multi') {
        let right: number[] = []
        try { right = JSON.parse(q.answer_multi || '[]') } catch { right = [] }
        const got: number[] = Array.isArray(a) ? [...a].sort() : []
        return right.length === got.length && right.every((v, idx) => v === got[idx])
      }
      if (Array.isArray(a)) return false
      return a === q.answer_index
    }

    let correct = 0
    const wrongQuestions: number[] = []
    questions.forEach((q, i) => {
      if (isCorrectAt(q, answers[i])) correct++
      else if (!isAssessment) wrongQuestions.push(q.id)
    })

    let accuracy = total ? Math.round((correct / total) * 100) : 0
    let report: any = null

    if (isAssessment) {
      if (bankId === 'mbti') {
        // 人格测试无对错概念，不算正确率
        correct = 0
        accuracy = 100
        report = buildMbtiReport(questions, answers as number[])
      } else {
        report = buildIqReport(questions, answers as number[], correct, total)
      }
    }

    await conn.execute(
      'INSERT INTO histories (user_id, bank_id, date_str, total, correct, time_spent, accuracy, report) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, bankId, today, total, correct, timeSpent, accuracy, report ? JSON.stringify(report) : null]
    )

    const newlyUnlocked: any[] = []
    const push = (def: any) => { if (def) newlyUnlocked.push(def) }
    push(await unlockAchievement(conn, userId, 'first_quiz'))

    // MBTI 不计入知识答题统计；IQ 与普通题库计入
    const countsForStats = !isAssessment || bankId === 'iq'
    if (countsForStats) {
      await conn.execute(
        'UPDATE users SET total_answered = total_answered + ?, total_correct = total_correct + ? WHERE id = ?',
        [total, correct, userId]
      )
      const [uRows] = await conn.execute('SELECT total_answered FROM users WHERE id = ?', [userId])
      const totalAnswered = Number((uRows as any[])[0]?.total_answered || 0)
      if (totalAnswered >= 50) push(await unlockAchievement(conn, userId, 'quiz_50'))
      if (totalAnswered >= 200) push(await unlockAchievement(conn, userId, 'quiz_200'))
      if (totalAnswered >= 500) push(await unlockAchievement(conn, userId, 'quiz_500'))
      if (accuracy >= 80) push(await unlockAchievement(conn, userId, 'acc_80'))
      if (accuracy === 100) push(await unlockAchievement(conn, userId, 'acc_100'))
    }

    for (const qId of wrongQuestions) {
      await conn.execute(
        'INSERT IGNORE INTO wrong_books (user_id, bank_id, question_id) VALUES (?, ?, ?)',
        [userId, bankId, qId]
      )
    }

    await conn.execute(
      `INSERT INTO user_bank_progress (user_id, bank_id, done, last_index) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE done = GREATEST(done, VALUES(done)), last_index = VALUES(last_index)`,
      [userId, bankId, total, Math.max(total - 1, 0)]
    )

    await conn.commit()
    return { success: true, accuracy, report, newlyUnlocked }
  } catch (err: any) {
    await conn.rollback()
    if (err?.statusCode) throw err
    throw createError({ statusCode: 500, message: '提交失败' })
  } finally {
    conn.release()
  }
})
