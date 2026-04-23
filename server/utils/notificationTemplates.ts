import { loadRuntimeRulesForServer } from './runtimeRulesCache'

export type NotificationTemplateVars = Record<string, string | number | boolean | null | undefined>

function renderText(tpl: string, vars: NotificationTemplateVars) {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key: string) => {
    const v = (vars as any)[key]
    if (v === null || v === undefined) return ''
    return String(v)
  })
}

export async function resolveNotificationTemplate(key: string) {
  const runtime = await loadRuntimeRulesForServer()
  const tpl = (runtime.rules as any)?.notifications?.templates?.[key]
  if (!tpl || typeof tpl !== 'object') return null
  const title = (tpl.title || '').toString()
  const content = (tpl.content || '').toString()
  if (!title && !content) return null
  return { title, content }
}

export async function renderNotificationFromTemplateOrFallback(params: {
  key: string
  vars: NotificationTemplateVars
  fallback: { title: string; content: string }
}) {
  const tpl = await resolveNotificationTemplate(params.key)
  if (!tpl) return params.fallback
  return {
    title: tpl.title ? renderText(tpl.title, params.vars) : params.fallback.title,
    content: tpl.content ? renderText(tpl.content, params.vars) : params.fallback.content,
  }
}

