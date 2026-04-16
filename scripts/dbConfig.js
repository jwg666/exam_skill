import 'dotenv/config'

export function getDbConfig() {
  const host = process.env.DB_HOST
  const user = process.env.DB_USER
  const password = process.env.DB_PASSWORD
  const database = process.env.DB_NAME
  const port = Number(process.env.DB_PORT || 3306)

  const missing = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'].filter((k) => !process.env[k])
  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(', ')}`)
  }

  return { host, port, user, password, database }
}

