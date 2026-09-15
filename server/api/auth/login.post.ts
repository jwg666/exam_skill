import bcrypt from 'bcryptjs'
import { signToken } from '../../utils/auth'
import { unlockAchievement } from '../../utils/game'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const phone = (body?.phone || '').trim()
  const password = body?.password || ''

  if (!phone || !password) {
    throw createError({ statusCode: 400, message: '手机号和密码不能为空' })
  }

  const db = useDb()
  const [rows] = await db.execute('SELECT * FROM users WHERE phone = ?', [phone])
  const users = rows as any[]

  if (users.length === 0) {
    throw createError({ statusCode: 401, message: '账号或密码错误' })
  }
  const user = users[0]

  // 存量明文密码：比对通过后自动升级为 bcrypt 哈希，无需停机迁移
  const isHashed = typeof user.password === 'string' && user.password.startsWith('$2')
  const ok = isHashed
    ? await bcrypt.compare(password, user.password)
    : password === user.password
  if (!ok) {
    throw createError({ statusCode: 401, message: '账号或密码错误' })
  }
  if (!isHashed) {
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [
      await bcrypt.hash(password, 10),
      user.id
    ])
  }

  const firstLogin = await unlockAchievement(db, user.id, 'first_login')

  return {
    token: signToken(user.id),
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      totalAnswered: user.total_answered,
      totalCorrect: user.total_correct,
      streak: user.streak,
      isAdmin: !!user.is_admin
    },
    newlyUnlocked: firstLogin ? [firstLogin] : []
  }
})
