import pool from '../../utils/db'
import { ensureExamSkillSchema } from '../../utils/examSchema'
import { computeLevel } from '../../utils/gamification'
import { loadGamificationRulesForServer } from '../../utils/gamificationLoader'
import { buildUserAuthPayload } from '../../utils/userPayload'
import { unlockAccuracyAchievements, unlockMilestoneQuizAchievements, tryUnlockAchievement } from '../../utils/achievements'
import { unlockAchievementsByRuntimeRules } from '../../utils/achievementRules'
import { renderNotificationFromTemplateOrFallback } from '../../utils/notificationTemplates'

function ymdToday() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userId, bankId, total, correct, timeSpent, accuracy, wrongQuestions, dateStr } = body

  if (!userId || !bankId) {
    throw createError({ statusCode: 400, message: '参数不完整' })
  }

  const uid = Number(userId)
  if (!Number.isFinite(uid)) throw createError({ statusCode: 400, message: 'userId 非法' })

  const t = Number(total)
  const c = Number(correct)
  if (!Number.isFinite(t) || !Number.isFinite(c) || t < 0 || c < 0 || c > t) {
    throw createError({ statusCode: 400, message: '答题统计参数非法' })
  }

  await ensureExamSkillSchema()
  const { rules } = await loadGamificationRulesForServer()

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [uRows] = await conn.execute(
      `SELECT id, phone, name, total_answered, total_correct, streak, exp, theme
       FROM users WHERE id = ? FOR UPDATE`,
      [uid]
    )
    const u = (uRows as any[])[0]
    if (!u) throw createError({ statusCode: 404, message: '用户不存在' })

    const prevAnswered = Number(u.total_answered || 0)
    const prevExp = Number(u.exp || 0)
    const prevLevel = computeLevel(prevExp, rules.expLevelThresholds).level

    const gainedExp = Math.max(0, Math.floor(c * rules.expPerCorrect + t * rules.expPerAnswered))

    // 1. 更新历史记录
    await conn.execute(
      `INSERT INTO histories (user_id, bank_id, total, correct, time_spent, accuracy, date_str) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uid, bankId, t, c, timeSpent, accuracy, (dateStr || ymdToday()).toString()]
    )

    // 2. 更新用户总数据 + 经验
    await conn.execute(
      `UPDATE users
       SET total_answered = total_answered + ?,
           total_correct = total_correct + ?,
           exp = exp + ?
       WHERE id = ?`,
      [t, c, gainedExp, uid]
    )

    // 3. 处理错题本
    if (wrongQuestions && wrongQuestions.length > 0) {
      for (const qId of wrongQuestions) {
        await conn.execute(`INSERT IGNORE INTO wrong_books (user_id, bank_id, question_id) VALUES (?, ?, ?)`, [uid, bankId, qId])
      }
    }

    const nextAnswered = prevAnswered + t
    // 规则优先：若 member ruleset 配置了 achievements.rules，则用规则驱动解锁；否则回退硬编码
    const byRules = await unlockAchievementsByRuntimeRules(conn, uid, {
      prevTotalAnswered: prevAnswered,
      nextTotalAnswered: nextAnswered,
      accuracy: Number(accuracy),
    })
    const unlockedQuiz = byRules.usedRules ? [] : await unlockMilestoneQuizAchievements(conn, uid, prevAnswered, nextAnswered)
    const unlockedAcc = byRules.usedRules ? [] : await unlockAccuracyAchievements(conn, uid, Number(accuracy))

    const [favRows] = await conn.execute(`SELECT COUNT(*) AS c FROM favorites WHERE user_id = ?`, [uid])
    const favCount = Number((favRows as any[])[0]?.c || 0)
    const unlockedFav: string[] = []
    if (!byRules.usedRules) {
      if (favCount >= 10 && (await tryUnlockAchievement(conn, uid, 'fav_10'))) unlockedFav.push('fav_10')
    }

    const [freshRows] = await conn.execute(`SELECT * FROM users WHERE id = ? LIMIT 1`, [uid])
    const fresh = (freshRows as any[])[0]
    const nextExp = Number(fresh.exp || 0)
    const nextLevel = computeLevel(nextExp, rules.expLevelThresholds).level
    if (nextLevel > prevLevel) {
      const levelMsg = await renderNotificationFromTemplateOrFallback({
        key: 'level.up',
        vars: { fromLevel: prevLevel, toLevel: nextLevel, exp: nextExp },
        fallback: {
          title: '等级提升',
          content: `恭喜升级到 Lv.${nextLevel}！继续刷题可获得更多经验。`,
        },
      })
      await conn.execute(`INSERT INTO notifications (user_id, type, title, content) VALUES (?, 'system', ?, ?)`, [
        uid,
        levelMsg.title,
        levelMsg.content,
      ])
    }

    await conn.commit()

    return {
      ok: true,
      gainedExp,
      unlockedAchievements: [...byRules.unlocked, ...unlockedQuiz, ...unlockedAcc, ...unlockedFav],
      user: buildUserAuthPayload(fresh, rules),
    }
  } catch (err: any) {
    await conn.rollback()
    if (err?.statusCode) throw err
    throw createError({ statusCode: 500, message: '提交失败' })
  } finally {
    conn.release()
  }
})