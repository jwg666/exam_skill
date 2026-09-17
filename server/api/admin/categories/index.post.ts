// 管理端：新建题库分类 { code, name, sort }
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const code = (body?.code || '').trim().toLowerCase()
  const name = (body?.name || '').trim()
  const sort = Number(body?.sort) || 0

  if (!/^[a-z0-9_-]{2,20}$/.test(code)) {
    throw createError({ statusCode: 400, message: '分类编码须为 2~20 位小写字母/数字/中划线' })
  }
  if (!name || name.length > 20) {
    throw createError({ statusCode: 400, message: '分类名称为 1~20 个字符' })
  }

  const db = useDb()
  try {
    await db.execute('INSERT INTO bank_categories (code, name, sort) VALUES (?, ?, ?)', [code, name, sort])
    return { success: true }
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw createError({ statusCode: 409, message: '分类编码已存在' })
    }
    throw createError({ statusCode: 500, message: '服务器错误' })
  }
})
