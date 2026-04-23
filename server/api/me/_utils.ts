import { getQuery, readBody, createError } from 'h3'

export function readUserId(event: any) {
  const q = getQuery(event) as any
  const fromQuery = q.userId ?? q.uid
  return fromQuery != null && fromQuery !== '' ? Number(fromQuery) : NaN
}

export async function readUserIdFromBody(event: any) {
  const body = await readBody(event).catch(() => ({} as any))
  const v = body?.userId
  return v != null && v !== '' ? Number(v) : NaN
}

export function requireFiniteUserId(id: number) {
  if (!Number.isFinite(id) || id <= 0) throw createError({ statusCode: 400, message: '缺少 userId' })
  return id
}
