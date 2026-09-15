// 管理端：题库详情修改 / 删除题库（级联删除题目）
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: '缺少题库 ID' })
  const db = useDb()

  if (event.method === 'DELETE') {
    await db.execute('DELETE FROM banks WHERE id = ?', [id])
    return { success: true }
  }

  // PUT 修改题库基础信息
  const body = await readBody(event)
  const name = (body?.name || '').trim()
  if (!name) throw createError({ statusCode: 400, message: '题库名称不能为空' })
  await db.execute(
    'UPDATE banks SET name = ?, icon = ?, color = ?, type = ?, type_name = ?, description = ?, difficulty = ? WHERE id = ?',
    [
      name,
      body?.icon || 'fas fa-book',
      body?.color || '#3B82F6',
      body?.type || 'exam',
      body?.typeName || '考试类',
      body?.description || '',
      body?.difficulty || '中等',
      id
    ]
  )
  return { success: true }
})
