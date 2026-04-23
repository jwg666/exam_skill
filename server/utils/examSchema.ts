import mysql from 'mysql2/promise'
import pool from './db'

async function columnExists(conn: mysql.PoolConnection, table: string, column: string) {
  const db = process.env.DB_NAME
  if (!db) return false
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS c
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [db, table, column]
  )
  return Number(rows?.[0]?.c || 0) > 0
}

async function tableExists(conn: mysql.PoolConnection, table: string) {
  const db = process.env.DB_NAME
  if (!db) return false
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS c
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [db, table]
  )
  return Number(rows?.[0]?.c || 0) > 0
}

let ensured = false

export async function ensureExamSkillSchema() {
  if (ensured) return
  const conn = await pool.getConnection()
  try {
    if (!(await tableExists(conn, 'users'))) {
      ensured = true
      return
    }

    const addUserCol = async (column: string, ddl: string) => {
      if (await columnExists(conn, 'users', column)) return
      await conn.execute(ddl)
    }

    await addUserCol('exp', "ALTER TABLE users ADD COLUMN exp INT NOT NULL DEFAULT 0")
    await addUserCol('theme', "ALTER TABLE users ADD COLUMN theme VARCHAR(10) NOT NULL DEFAULT 'dark'")

    if (!(await tableExists(conn, 'notifications'))) {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS notifications (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          type VARCHAR(20) NOT NULL,
          title VARCHAR(120) NOT NULL,
          content TEXT NOT NULL,
          read_at TIMESTAMP NULL DEFAULT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          KEY idx_notifications_user_created (user_id, created_at),
          KEY idx_notifications_user_read (user_id, read_at),
          CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
    }

    ensured = true
  } finally {
    conn.release()
  }
}
