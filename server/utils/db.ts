import mysql from 'mysql2/promise'
import { createError } from 'h3'

type Pool = mysql.Pool

let pool: Pool | null = null

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw createError({ statusCode: 500, message: `未配置环境变量：${name}` })
  }
  return value
}

function getPool() {
  if (pool) return pool

  const host = getRequiredEnv('DB_HOST')
  const port = Number(process.env.DB_PORT || 3306)
  const user = getRequiredEnv('DB_USER')
  const password = getRequiredEnv('DB_PASSWORD')
  const database = getRequiredEnv('DB_NAME')

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  })

  return pool
}

export default {
  execute: (...args: Parameters<Pool['execute']>) => getPool().execute(...args),
  query: (...args: Parameters<Pool['query']>) => getPool().query(...args),
  end: (...args: Parameters<Pool['end']>) => getPool().end(...args)
} as Pick<Pool, 'execute' | 'query' | 'end'>
