import { createError, getQuery } from 'h3'
import pool from '../../utils/db'
import { ensureExamSkillSchema } from '../../utils/examSchema'
import { readUserId } from '../me/_utils'

type SortKey = 'answered' | 'correct_rate' | 'sessions'

function clampInt(n: any, fallback: number, min: number, max: number) {
  const x = Number(n)
  if (!Number.isFinite(x)) return fallback
  return Math.max(min, Math.min(max, Math.floor(x)))
}

function maskPhone(phone: string) {
  const s = String(phone || '')
  if (s.length < 7) return s
  return `${s.slice(0, 3)}****${s.slice(-4)}`
}

export default defineEventHandler(async (event) => {
  await ensureExamSkillSchema()

  const q = getQuery(event) as any
  const sort = (String(q.sort || 'answered') as SortKey) || 'answered'
  if (!['answered', 'correct_rate', 'sessions'].includes(sort)) throw createError({ statusCode: 400, message: 'sort 非法' })

  const limit = clampInt(q.limit, 50, 1, 100)
  const offset = clampInt(q.offset, 0, 0, 100000)
  const minAnswered = clampInt(q.minAnswered, 1, 0, 1000000)

  const orderSql =
    sort === 'correct_rate'
      ? `ORDER BY correct_rate DESC, u.total_answered DESC, u.id DESC`
      : sort === 'sessions'
        ? `ORDER BY sessions DESC, u.total_answered DESC, u.id DESC`
        : `ORDER BY u.total_answered DESC, correct_rate DESC, u.id DESC`

  const sql = `
    SELECT
      u.id,
      u.name,
      u.phone,
      u.total_answered AS answered,
      u.total_correct AS correct,
      CASE WHEN u.total_answered > 0 THEN (u.total_correct / u.total_answered) ELSE 0 END AS correct_rate,
      COALESCE(h.sessions, 0) AS sessions
    FROM users u
    LEFT JOIN (
      SELECT user_id, COUNT(DISTINCT CONCAT(bank_id, '|', date_str)) AS sessions
      FROM histories
      GROUP BY user_id
    ) h ON h.user_id = u.id
    WHERE u.total_answered >= ?
    ${orderSql}
    LIMIT ? OFFSET ?
  `

  const [rows] = await pool.execute(sql, [minAnswered, limit, offset])
  const items = (rows as any[]).map((r, idx) => ({
    rank: offset + idx + 1,
    userId: Number(r.id),
    name: String(r.name || ''),
    phoneMasked: maskPhone(String(r.phone || '')),
    answered: Number(r.answered || 0),
    correct: Number(r.correct || 0),
    correctRate: Number(r.correct_rate || 0),
    sessions: Number(r.sessions || 0),
  }))

  const meId = readUserId(event)
  let me: any = null
  if (Number.isFinite(meId) && meId > 0) {
    const [meRows] = await pool.execute(
      `
      SELECT
        u.id,
        u.name,
        u.phone,
        u.total_answered AS answered,
        u.total_correct AS correct,
        CASE WHEN u.total_answered > 0 THEN (u.total_correct / u.total_answered) ELSE 0 END AS correct_rate,
        COALESCE(h.sessions, 0) AS sessions
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(DISTINCT CONCAT(bank_id, '|', date_str)) AS sessions
        FROM histories
        GROUP BY user_id
      ) h ON h.user_id = u.id
      WHERE u.id = ?
      LIMIT 1
      `,
      [meId]
    )
    const mr = (meRows as any[])[0]
    if (mr) {
      const answered = Number(mr.answered || 0)
      const correct = Number(mr.correct || 0)
      const correctRate = Number(mr.correct_rate || 0)
      const sessions = Number(mr.sessions || 0)

      let rankSql = ''
      if (sort === 'correct_rate') {
        rankSql = `
          SELECT COUNT(*) AS c
          FROM users u
          LEFT JOIN (
            SELECT user_id, COUNT(DISTINCT CONCAT(bank_id, '|', date_str)) AS sessions
            FROM histories
            GROUP BY user_id
          ) h ON h.user_id = u.id
          WHERE u.total_answered >= ?
            AND (
              (CASE WHEN u.total_answered > 0 THEN (u.total_correct / u.total_answered) ELSE 0 END) > ?
              OR (
                (CASE WHEN u.total_answered > 0 THEN (u.total_correct / u.total_answered) ELSE 0 END) = ?
                AND u.total_answered > ?
              )
              OR (
                (CASE WHEN u.total_answered > 0 THEN (u.total_correct / u.total_answered) ELSE 0 END) = ?
                AND u.total_answered = ?
                AND u.id > ?
              )
            )
        `
        const [rc] = await pool.execute(rankSql, [minAnswered, correctRate, correctRate, answered, correctRate, answered, meId])
        const ahead = Number((rc as any[])[0]?.c || 0)
        me = {
          rank: ahead + 1,
          userId: meId,
          name: String(mr.name || ''),
          phoneMasked: maskPhone(String(mr.phone || '')),
          answered,
          correct,
          correctRate,
          sessions,
        }
      } else if (sort === 'sessions') {
        rankSql = `
          SELECT COUNT(*) AS c
          FROM users u
          LEFT JOIN (
            SELECT user_id, COUNT(DISTINCT CONCAT(bank_id, '|', date_str)) AS sessions
            FROM histories
            GROUP BY user_id
          ) h ON h.user_id = u.id
          WHERE u.total_answered >= ?
            AND (
              COALESCE(h.sessions, 0) > ?
              OR (COALESCE(h.sessions, 0) = ? AND u.total_answered > ?)
              OR (COALESCE(h.sessions, 0) = ? AND u.total_answered = ? AND u.id > ?)
            )
        `
        const [rc] = await pool.execute(rankSql, [minAnswered, sessions, sessions, answered, sessions, answered, meId])
        const ahead = Number((rc as any[])[0]?.c || 0)
        me = { rank: ahead + 1, userId: meId, name: String(mr.name || ''), phoneMasked: maskPhone(String(mr.phone || '')), answered, correct, correctRate, sessions }
      } else {
        rankSql = `
          SELECT COUNT(*) AS c
          FROM users u
          LEFT JOIN (
            SELECT user_id, COUNT(DISTINCT CONCAT(bank_id, '|', date_str)) AS sessions
            FROM histories
            GROUP BY user_id
          ) h ON h.user_id = u.id
          WHERE u.total_answered >= ?
            AND (
              u.total_answered > ?
              OR (u.total_answered = ? AND (CASE WHEN u.total_answered > 0 THEN (u.total_correct / u.total_answered) ELSE 0 END) > ?)
              OR (u.total_answered = ? AND (CASE WHEN u.total_answered > 0 THEN (u.total_correct / u.total_answered) ELSE 0 END) = ? AND u.id > ?)
            )
        `
        const [rc] = await pool.execute(rankSql, [minAnswered, answered, answered, correctRate, answered, correctRate, meId])
        const ahead = Number((rc as any[])[0]?.c || 0)
        me = { rank: ahead + 1, userId: meId, name: String(mr.name || ''), phoneMasked: maskPhone(String(mr.phone || '')), answered, correct, correctRate, sessions }
      }
    }
  }

  return { ok: true, sort, minAnswered, limit, offset, items, me }
})
