import pool from '../../../utils/db'
import { ensureExamSkillSchema } from '../../../utils/examSchema'
import { readUserId, requireFiniteUserId } from '../_utils'

export default defineEventHandler(async (event) => {
  const userId = requireFiniteUserId(readUserId(event))
  await ensureExamSkillSchema()

  const [rows] = await pool.execute(
    `SELECT id, type, title, content, created_at, read_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY id DESC
     LIMIT 80`,
    [userId]
  )

  const notifications = (rows as any[]).map((r) => ({
    id: String(r.id),
    type: String(r.type),
    title: String(r.title),
    content: String(r.content),
    createdAt: new Date(r.created_at).getTime(),
    readAt: r.read_at ? new Date(r.read_at).getTime() : null,
  }))

  return { ok: true, notifications }
})
