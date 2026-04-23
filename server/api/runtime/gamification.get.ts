import { loadGamificationRulesForServer } from '../../utils/gamificationLoader'

export default defineEventHandler(async () => {
  const { rules, source } = await loadGamificationRulesForServer()
  return { ok: true, source, rules }
})
