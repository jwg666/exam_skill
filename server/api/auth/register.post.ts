import pool from '../../utils/db'
import { encryptPassword } from '../../utils/passwordCrypto'
import { ensureExamSkillSchema } from '../../utils/examSchema'
import { loadGamificationRulesForServer } from '../../utils/gamificationLoader'
import { buildUserAuthPayload } from '../../utils/userPayload'

export default defineEventHandler(async (event) => {
  const { passwordAesSecret } = useRuntimeConfig()
  const body = await readBody(event)
  const { name, phone, password } = body

  if (!name || !phone || !password) {
    throw createError({ statusCode: 400, message: '参数不完整' })
  }

  if (!passwordAesSecret) {
    throw createError({ statusCode: 500, message: '未配置密码加密密钥' })
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO users (name, phone, password) VALUES (?, ?, ?)',
      [name, phone, encryptPassword(password, passwordAesSecret)]
    )

    const insertId = (result as any).insertId

    await ensureExamSkillSchema()
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [insertId])
    const user = (rows as any[])[0]
    const { rules } = await loadGamificationRulesForServer()
    return buildUserAuthPayload(user, rules)
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw createError({ statusCode: 409, message: '该手机号已注册' })
    }
    if (err?.statusCode) {
      throw err
    }
    throw createError({ statusCode: 500, message: '服务器错误' })
  }
})
