// 管理端：修改分类（name/sort 可改，code 不可改——banks.type 引用它）
// DELETE：分类被题库引用时拒绝删除
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, message: '分类 ID 不合法' })
  }
  const db = useDb()

  if (event.method === 'DELETE') {
    const [rows] = await db.execute('SELECT code FROM bank_categories WHERE id = ?', [id])
    const cats = rows as any[]
    if (!cats.length) {
      throw createError({ statusCode: 404, message: '分类不存在' })
    }
    const [used] = await db.execute('SELECT COUNT(*) AS c FROM banks WHERE type = ?', [cats[0].code])
    if (Number((used as any[])[0].c) > 0) {
      throw createError({ statusCode: 409, message: '该分类下仍有题库，请先移动或删除对应题库' })
    }
    await db.execute('DELETE FROM bank_categories WHERE id = ?', [id])
    return { success: true }
  }

  // PUT 修改
  const body = await readBody(event)
  const name = (body?.name || '').trim()
  const sort = Number(body?.sort) || 0
  if (!name || name.length > 20) {
    throw createError({ statusCode: 400, message: '分类名称为 1~20 个字符' })
  }
  await db.execute('UPDATE bank_categories SET name = ?, sort = ? WHERE id = ?', [name, sort, id])
  return { success: true }
})
