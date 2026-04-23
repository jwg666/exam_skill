import { createError } from 'h3'
import pool from '../../utils/db'
import { ensureExamSkillSchema } from '../../utils/examSchema'
import { computeLevel } from '../../utils/gamification'
import { loadGamificationRulesForServer } from '../../utils/gamificationLoader'
import { unlockStreakAchievements } from '../../utils/achievements'
import { unlockAchievementsByRuntimeRules } from '../../utils/achievementRules'
import { readUserId, requireFiniteUserId } from './_utils'

function ymd(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseYmd(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export default defineEventHandler(async (event) => {
  const userId = requireFiniteUserId(readUserId(event))
  await ensureExamSkillSchema()
  const { rules } = await loadGamificationRulesForServer()

  const today = ymd(new Date())
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [uRows] = await conn.execute(`SELECT id, exp FROM users WHERE id = ? FOR UPDATE`, [userId])
    const u = (uRows as any[])[0]
    if (!u) throw createError({ statusCode: 404, message: '用户不存在' })

    const prevExp = Number(u.exp || 0)
    const prevLevel = computeLevel(prevExp, rules.expLevelThresholds).level

    let inserted = false
    try {
      await conn.execute(`INSERT INTO checkins (user_id, date_str) VALUES (?, ?)`, [userId, today])
      inserted = true
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') inserted = false
      else throw e
    }

    if (!inserted) {
      await conn.rollback()
      const [cRows] = await pool.execute(`SELECT date_str FROM checkins WHERE user_id = ? ORDER BY date_str ASC`, [userId])
      const checkedDays = (cRows as any[]).map((r) => String(r.date_str))
      const [u2] = await pool.execute(`SELECT streak FROM users WHERE id = ? LIMIT 1`, [userId])
      const streak = Number((u2 as any[])[0]?.streak || 0)
      return { ok: true, checked: false, today, streak, checkedDays, gainedExp: 0 }
    }

    const gainedExp = Math.max(0, Math.floor(rules.expCheckin))
    await conn.execute(`UPDATE users SET exp = exp + ? WHERE id = ?`, [gainedExp, userId])

    const [daysRows] = await conn.execute(`SELECT date_str FROM checkins WHERE user_id = ? ORDER BY date_str ASC`, [userId])
    const days = Array.from(new Set((daysRows as any[]).map((r) => String(r.date_str)))).sort(
      (a, b) => parseYmd(a).getTime() - parseYmd(b).getTime()
    )
    const set = new Set(days)

    let streak = 0
    if (set.has(today)) {
      streak = 1
      for (let i = 1; i < 400; i++) {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        d.setDate(d.getDate() - i)
        if (set.has(ymd(d))) streak++
        else break
      }
    }

    await conn.execute(`UPDATE users SET streak = ? WHERE id = ?`, [streak, userId])

    await conn.execute(`INSERT INTO notifications (user_id, type, title, content) VALUES (?, 'system', ?, ?)`, [
      userId,
      '打卡成功',
      `你已连续打卡 ${streak} 天，继续保持！`,
    ])

    const byRules = await unlockAchievementsByRuntimeRules(conn, userId, {
      prevTotalAnswered: 0,
      nextTotalAnswered: 0,
      streak,
    })
    const unlockedStreak = byRules.usedRules ? [] : await unlockStreakAchievements(conn, userId, streak)

    const [freshRows] = await conn.execute(`SELECT * FROM users WHERE id = ? LIMIT 1`, [userId])
    const fresh = (freshRows as any[])[0]
    const nextExp = Number(fresh.exp || 0)
    const nextLevel = computeLevel(nextExp, rules.expLevelThresholds).level
    if (nextLevel > prevLevel) {
      await conn.execute(`INSERT INTO notifications (user_id, type, title, content) VALUES (?, 'system', ?, ?)`, [
        userId,
        '等级提升',
        `恭喜升级到 Lv.${nextLevel}！继续刷题可获得更多经验。`,
      ])
    }

    await conn.commit()

    return {
      ok: true,
      checked: true,
      today,
      streak,
      checkedDays: days,
      gainedExp,
      unlockedAchievements: [...byRules.unlocked, ...unlockedStreak],
      exp: nextExp,
      level: computeLevel(nextExp, rules.expLevelThresholds).level,
    }
  } catch (e: any) {
    await conn.rollback()
    if (e?.statusCode) throw e
    throw createError({ statusCode: 500, message: '打卡失败' })
  } finally {
    conn.release()
  }
})
