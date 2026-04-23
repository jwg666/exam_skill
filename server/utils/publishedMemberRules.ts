import { isMemberMysqlConfigured, memberMysqlQuery } from './memberMysql'

export type PublishedRuleVersion = {
  ruleSetId: number
  ruleSetName: string
  ruleSetKind: string
  versionId: number
  versionNo: number
  contentJsonText: string
  publishedAt: string | null
}

function parseMaybeJsonText(s: any) {
  if (typeof s !== 'string') return null
  const t = s.trim()
  if (!t) return null
  try {
    return JSON.parse(t)
  } catch {
    return null
  }
}

export async function getCurrentPublishedRuleVersionByScopeKindName(params: { appScope: string; kind: string; name: string }) {
  if (!isMemberMysqlConfigured()) return null
  const rows = await memberMysqlQuery<any[]>(
    `
    SELECT
      rs.id AS rule_set_id,
      rs.name AS rule_set_name,
      rs.kind AS rule_set_kind,
      rv.id AS version_id,
      rv.version_no AS version_no,
      rv.content_json AS content_json,
      rv.published_at AS published_at
    FROM rule_sets rs
    JOIN rule_versions rv ON rv.rule_set_id = rs.id
    WHERE rs.app_scope = :appScope
      AND rs.kind = :kind
      AND rs.name = :name
      AND rv.status = 'published'
    ORDER BY rv.version_no DESC, rv.id DESC
    LIMIT 1
    `,
    params
  )
  const r = rows[0]
  if (!r) return null
  const version: PublishedRuleVersion = {
    ruleSetId: Number(r.rule_set_id),
    ruleSetName: String(r.rule_set_name),
    ruleSetKind: String(r.rule_set_kind),
    versionId: Number(r.version_id),
    versionNo: Number(r.version_no),
    contentJsonText: String(r.content_json || ''),
    publishedAt: r.published_at ? String(r.published_at) : null,
  }
  return { version, content: parseMaybeJsonText(version.contentJsonText) }
}

