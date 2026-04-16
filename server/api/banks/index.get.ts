import pool from '../../utils/db'

export default defineEventHandler(async (event) => {
  const [rows] = await pool.query('SELECT * FROM banks ORDER BY created_at ASC')
  return rows as any[]
})