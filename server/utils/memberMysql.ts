import mysql from 'mysql2/promise'
import { createError } from 'h3'

type Pool = mysql.Pool

let pool: Pool | null = null

function cfgFromRuntime() {
  const rc = useRuntimeConfig()
  const host = (rc.mysql?.host || '').toString().trim()
  const database = (rc.mysql?.database || '').toString().trim()
  const user = (rc.mysql?.user || '').toString().trim()
  return { host, database, user, rc }
}

export function isMemberMysqlConfigured() {
  const { host, database, user } = cfgFromRuntime()
  return Boolean(host && database && user)
}

function getPool(): Pool {
  const { host, database, user, rc } = cfgFromRuntime()
  if (!host || !database || !user) {
    throw createError({ statusCode: 500, message: '未配置会员库（NUXT_MYSQL_*）' })
  }
  if (pool) return pool

  const port = Number(rc.mysql?.port || 3306)
  const password = (rc.mysql?.password || '').toString()
  const connectionLimit = Number(rc.mysql?.connectionLimit || 10)

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
    namedPlaceholders: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: 'Z',
  })

  return pool
}

export async function memberMysqlQuery<T extends mysql.RowDataPacket[]>(sql: string, params?: any): Promise<T> {
  const p = getPool()
  const [rows] = await p.query<T>(sql, params)
  return rows
}

export async function memberMysqlExecute(sql: string, params?: any): Promise<mysql.ResultSetHeader> {
  const p = getPool()
  const [result] = await p.execute<mysql.ResultSetHeader>(sql, params)
  return result
}
