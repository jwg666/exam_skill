export type GamificationRules = {
  expPerCorrect: number
  expPerAnswered: number
  expCheckin: number
  /** inclusive level thresholds: exp required to REACH this level (level 1 starts at thresholds[0] or 0) */
  expLevelThresholds: number[]
}

export const defaultGamificationRules: GamificationRules = {
  expPerCorrect: 8,
  expPerAnswered: 2,
  expCheckin: 15,
  expLevelThresholds: [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 6000],
}

function asFiniteNumber(v: any, fallback: number) {
  const n = typeof v === 'string' ? Number(v) : v
  if (!Number.isFinite(n)) return fallback
  return n
}

export function mergeGamificationRules(base: GamificationRules, patch: any): GamificationRules {
  if (!patch || typeof patch !== 'object') return base
  const next: GamificationRules = { ...base }
  if ('expPerCorrect' in patch) next.expPerCorrect = Math.max(0, asFiniteNumber(patch.expPerCorrect, base.expPerCorrect))
  if ('expPerAnswered' in patch) next.expPerAnswered = Math.max(0, asFiniteNumber(patch.expPerAnswered, base.expPerAnswered))
  if ('expCheckin' in patch) next.expCheckin = Math.max(0, asFiniteNumber(patch.expCheckin, base.expCheckin))
  if (Array.isArray(patch.expLevelThresholds)) {
    const arr = patch.expLevelThresholds
      .map((x: any) => asFiniteNumber(x, NaN))
      .filter((x: number) => Number.isFinite(x))
      .map((x: number) => Math.max(0, Math.floor(x)))
    if (arr.length >= 2) next.expLevelThresholds = arr
  }
  return next
}

export function computeLevel(exp: number, thresholds: number[]) {
  const t = (thresholds.length ? thresholds : defaultGamificationRules.expLevelThresholds).slice().sort((a, b) => a - b)
  const x = Math.max(0, Math.floor(exp))

  // thresholds[0] is typically 0 meaning "Lv1 from 0 exp"
  let level = 1
  for (let i = 1; i < t.length; i++) {
    if (x >= t[i]) level = i + 1
  }

  const next = t[level] // exp needed to reach next level (undefined if maxed out)
  return { level, nextThreshold: Number.isFinite(next) ? next : null }
}
