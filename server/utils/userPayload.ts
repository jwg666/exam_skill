import { computeLevel } from './gamification'
import type { GamificationRules } from './gamification'

export function buildUserAuthPayload(userRow: any, rules: GamificationRules) {
  const exp = Number(userRow.exp || 0)
  const { level, nextThreshold } = computeLevel(exp, rules.expLevelThresholds)
  return {
    id: userRow.id,
    phone: userRow.phone,
    name: userRow.name,
    totalAnswered: Number(userRow.total_answered || 0),
    totalCorrect: Number(userRow.total_correct || 0),
    streak: Number(userRow.streak || 0),
    exp,
    level,
    nextExp: nextThreshold,
    theme: (userRow.theme || 'dark').toString(),
  }
}
