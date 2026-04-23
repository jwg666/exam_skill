import type mysql from 'mysql2/promise'
import { loadRuntimeRulesForServer } from './runtimeRulesCache'
import { tryUnlockAchievement } from './achievements'

type UnlockContext = {
  prevTotalAnswered: number
  nextTotalAnswered: number
  accuracy?: number
  streak?: number
  favoritesCount?: number
}

function isRuleEnabled(r: any) {
  if (!r || typeof r !== 'object') return false
  if (r.enabled === false) return false
  return true
}

function matchesType(r: any, type: string) {
  return String(r.type || '').toLowerCase() === type.toLowerCase()
}

function getThresholds(v: any): number[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0).map((x) => Math.floor(x))
}

function shouldUnlockMilestone(prev: number, next: number, at: number) {
  return prev < at && next >= at
}

async function insertAchievementNotificationTemplate(conn: mysql.PoolConnection, userId: number, achievementId: string) {
  const runtime = await loadRuntimeRulesForServer()
  const tpl = (runtime.rules as any)?.achievements?.templates?.[achievementId] || (runtime.rules as any)?.notifications?.templates?.[`achievement.${achievementId}`]
  if (!tpl) return
  const title = (tpl.title || '').toString().trim()
  const content = (tpl.content || '').toString().trim()
  if (!title && !content) return
  await conn.execute(`INSERT INTO notifications (user_id, type, title, content) VALUES (?, 'achievement', ?, ?)`, [
    userId,
    title || `解锁成就：${achievementId}`,
    content || '你解锁了一个新的成就，继续保持！',
  ])
}

export async function unlockAchievementsByRuntimeRules(conn: mysql.PoolConnection, userId: number, ctx: UnlockContext) {
  const runtime = await loadRuntimeRulesForServer()
  const rules = (runtime.rules as any)?.achievements?.rules
  if (!Array.isArray(rules) || rules.length === 0) return { usedRules: false, unlocked: [] as string[] }

  const unlocked: string[] = []

  for (const r of rules) {
    if (!isRuleEnabled(r)) continue
    const id = String(r.achievementId || r.id || '').trim()
    if (!id) continue

    let okToTry = false

    if (matchesType(r, 'milestone_total_answered')) {
      const at = Number(r.at)
      if (Number.isFinite(at) && at > 0 && shouldUnlockMilestone(ctx.prevTotalAnswered, ctx.nextTotalAnswered, Math.floor(at))) {
        okToTry = true
      }
    } else if (matchesType(r, 'accuracy_gte')) {
      const at = Number(r.at)
      const acc = Number(ctx.accuracy)
      if (Number.isFinite(at) && Number.isFinite(acc) && acc >= at) okToTry = true
    } else if (matchesType(r, 'streak_gte')) {
      const at = Number(r.at)
      const s = Number(ctx.streak)
      if (Number.isFinite(at) && Number.isFinite(s) && s >= at) okToTry = true
    } else if (matchesType(r, 'favorites_gte')) {
      const at = Number(r.at)
      const f = Number(ctx.favoritesCount)
      if (Number.isFinite(at) && Number.isFinite(f) && f >= at) okToTry = true
    } else if (matchesType(r, 'thresholds_total_answered')) {
      const list = getThresholds(r.thresholds)
      for (const at of list) {
        if (shouldUnlockMilestone(ctx.prevTotalAnswered, ctx.nextTotalAnswered, at)) {
          okToTry = true
          break
        }
      }
    } else {
      continue
    }

    if (!okToTry) continue

    const inserted = await tryUnlockAchievement(conn, userId, id)
    if (inserted) {
      unlocked.push(id)
      // 如果规则侧提供模板，则额外插入一条模板通知（不会替换默认通知；MVP 先叠加）
      await insertAchievementNotificationTemplate(conn, userId, id).catch(() => {})
    }
  }

  return { usedRules: true, unlocked }
}

