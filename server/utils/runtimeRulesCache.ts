import { getExamSkillMemberBindings } from './examSkillRuntimeConfig'
import { getCurrentPublishedRuleVersionByScopeKindName } from './publishedMemberRules'

export type ExamSkillRuntimeRules = {
  gamification?: any
  notifications?: {
    templates?: Record<string, { title?: string; content?: string }>
  }
  achievements?: {
    templates?: Record<string, { title?: string; content?: string }>
    rules?: Array<any>
  }
}

type CacheState = {
  expiresAt: number
  value: { ok: true; source: 'member_db' | 'none'; ruleSet?: any; version?: any; rules: ExamSkillRuntimeRules } | null
}

let cache: CacheState = { expiresAt: 0, value: null }

export async function loadRuntimeRulesForServer(): Promise<{
  ok: true
  source: 'member_db' | 'none'
  ruleSet?: { id: number; name: string; kind: string }
  version?: { id: number; versionNo: number; publishedAt: string | null }
  rules: ExamSkillRuntimeRules
}> {
  const b = getExamSkillMemberBindings()
  const now = Date.now()
  if (cache.value && cache.expiresAt > now) return cache.value

  const ttl = Math.max(1_000, Math.min(60_000, Number(b.runtimeRuleCacheTtlMs || 10_000)))

  try {
    const r = await getCurrentPublishedRuleVersionByScopeKindName({
      appScope: b.appScope,
      kind: b.runtimeRuleSetKind,
      name: b.runtimeRuleSetName,
    })
    if (!r?.version || !r.content) {
      const v = { ok: true as const, source: 'none' as const, rules: {} as ExamSkillRuntimeRules }
      cache = { value: v, expiresAt: now + ttl }
      return v
    }
    const v = {
      ok: true as const,
      source: 'member_db' as const,
      ruleSet: { id: r.version.ruleSetId, name: r.version.ruleSetName, kind: r.version.ruleSetKind },
      version: { id: r.version.versionId, versionNo: r.version.versionNo, publishedAt: r.version.publishedAt },
      rules: r.content as ExamSkillRuntimeRules,
    }
    cache = { value: v, expiresAt: now + ttl }
    return v
  } catch {
    const v = { ok: true as const, source: 'none' as const, rules: {} as ExamSkillRuntimeRules }
    cache = { value: v, expiresAt: now + ttl }
    return v
  }
}

