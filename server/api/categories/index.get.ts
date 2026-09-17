// 题库分类列表（公开）：按 sort 升序
export default defineEventHandler(async (event) => {
  const db = useDb()
  const [rows] = await db.query('SELECT id, code, name, sort FROM bank_categories ORDER BY sort ASC, id ASC')
  return rows as any[]
})
