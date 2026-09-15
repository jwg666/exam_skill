// 管理端：题库列表（含题目数、真实题目总数）+ 新建题库
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()

  if (event.method === 'GET') {
    const [rows] = await db.query(
      `SELECT b.*, COUNT(q.id) AS question_count
       FROM banks b LEFT JOIN questions q ON q.bank_id = b.id
       GROUP BY b.id
       ORDER BY b.created_at ASC`
    )
    return rows as any[]
  }

  // POST 新建题库
  const body = await readBody(event)
  const id = (body?.id || '').trim()
  const name = (body?.name || '').trim()
  if (!/^[a-z0-9_-]{2,50}$/.test(id)) {
    throw createError({ statusCode: 400, message: '题库 ID 须为 2~50 位小写字母/数字/中划线' })
  }
  if (!name) {
    throw createError({ statusCode: 400, message: '题库名称不能为空' })
  }
  try {
    await db.execute(
      'INSERT INTO banks (id, name, icon, color, type, type_name, description, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        name,
        body?.icon || 'fas fa-book',
        body?.color || '#3B82F6',
        body?.type || 'exam',
        body?.typeName || '考试类',
        body?.description || '',
        body?.difficulty || '中等'
      ]
    )
    return { success: true, id }
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw createError({ statusCode: 409, message: '题库 ID 已存在' })
    }
    throw createError({ statusCode: 500, message: '服务器错误' })
  }
})
