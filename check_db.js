import mysql from 'mysql2/promise'
import { getDbConfig } from './scripts/dbConfig.js'

async function checkDb() {
  const connection = await mysql.createConnection({ ...getDbConfig(), connectTimeout: 10000 })

  try {
    const [rows] = await connection.execute('SHOW TABLES')
    console.log(rows)
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  } finally {
    await connection.end()
  }
}

checkDb()
