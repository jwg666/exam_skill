export default defineEventHandler(async (event) => {
  const db = useDb()
  const [rows] = await db.query('SELECT * FROM banks ORDER BY created_at ASC')
  return rows as any[]
})
