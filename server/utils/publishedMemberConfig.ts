import { isMemberMysqlConfigured, memberMysqlQuery } from './memberMysql'

type ConfigItemRow = {
  id: number
  key: string
  type: string
  value_json: any
  value_text: string | null
  app_scope: string
  module: string
  version: number
  status: string
  created_by: number | null
  created_at: string
}

function parseMaybeJson(v: any) {
  if (v == null) return null
  if (typeof v === 'object') return v
  if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return null
    try {
      return JSON.parse(s)
    } catch {
      return null
    }
  }
  return null
}

export async function getPublishedConfigValue(params: { appScope: string; module: string; key: string }) {
  if (!isMemberMysqlConfigured()) return null
  const rows = await memberMysqlQuery<ConfigItemRow[]>(
    `SELECT id, \`key\`, type, value_json, value_text, app_scope, module, version, status, created_by, created_at
     FROM config_items
     WHERE app_scope = :appScope AND module = :module AND \`key\` = :key AND status = 'published'
     ORDER BY version DESC, id DESC
     LIMIT 1`,
    params
  )
  const row = rows[0]
  if (!row) return null
  const json = parseMaybeJson(row.value_json)
  if (json != null) return json
  return row.value_text
}
