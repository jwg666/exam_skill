import { createError } from 'h3'
import pool from '../../../utils/db'
import { ensureExamSkillSchema } from '../../../utils/examSchema'
import { tryUnlockAchievement } from '../../../utils/achievements'
import { readUserId, requireFiniteUserId } from '../_utils'

export default defineEventHandler(async (event) => {
  const userId = requireFiniteUserId(readUserId(event))
  const body = await readBody(event).catch(() => ({} as any))
  const achievementId = String(body?.achievementId || '').trim()
  if (!achievementId) throw createError({ statusCode: 400, message: '缺少 achievementId' })

  await ensureExamSkillSchema()
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const ok = await tryUnlockAchievement(conn, userId, achievementId)
    await conn.commit()
    return { ok: true, unlocked: ok }
  } catch (e: any) {
    await conn.rollback()
    if (e?.statusCode) throw e
    throw createError({ statusCode: 500, message: '解锁失败' })
  } finally {
    conn.release()
  }
})
