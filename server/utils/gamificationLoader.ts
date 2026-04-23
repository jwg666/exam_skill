import { defaultGamificationRules, mergeGamificationRules, type GamificationRules } from './gamification'
import { getExamSkillMemberBindings } from './examSkillRuntimeConfig'
import { getPublishedConfigValue } from './publishedMemberConfig'
import { loadRuntimeRulesForServer } from './runtimeRulesCache'

export async function loadGamificationRulesForServer(): Promise<{ rules: GamificationRules; source: 'default' | 'member_db' }> {
  const b = getExamSkillMemberBindings()
  try {
    const published = await getPublishedConfigValue({
      appScope: b.appScope,
      module: b.gamificationModule,
      key: b.gamificationKey,
    })
    let merged = published ? mergeGamificationRules(defaultGamificationRules, published) : defaultGamificationRules

    // ruleset 可以覆盖 configs（可选）
    try {
      const runtime = await loadRuntimeRulesForServer()
      const patch = (runtime.rules as any)?.gamification
      if (patch && typeof patch === 'object') {
        merged = mergeGamificationRules(merged, patch)
      }
    } catch {
      // ignore
    }

    if (!published) return { rules: merged, source: 'default' }
    return { rules: merged, source: 'member_db' }
  } catch {
    return { rules: defaultGamificationRules, source: 'default' }
  }
}
