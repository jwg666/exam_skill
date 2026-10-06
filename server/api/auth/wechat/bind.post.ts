import { checkSmsCode } from '../../../utils/sms'

// 绑定手机号（登录态可选操作）：POST { phone, code }，Authorization: Bearer <token>
// - 面向微信免手机号账号；短信验证码证明手机号持有者本人
// - 仅当当前账号没有手机号时可绑；目标手机号必须未注册（已注册则引导用短信验证码直接登录该账号）
export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)
  const body = await readBody(event)
  const phone = (body?.phone || '').trim()
  const code = (body?.code || '').trim()

  if (!/^1\d{10}$/.test(phone)) {
    throw createError({ statusCode: 400, message: '手机号格式不正确' })
  }

  const db = useDb()
  const [selfRows] = await db.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId])
  const user = (selfRows as any[])[0]
  if (!user) {
    throw createError({ statusCode: 401, message: '登录态失效，请重新登录' })
  }
  // 自己账号的状态检查放在短信验证之前：已绑定无需消耗验证码
  if (user.phone) {
    throw createError({ statusCode: 409, message: '当前账号已绑定手机号' })
  }

  const verify = checkSmsCode(phone, code)
  if (!verify.ok) {
    throw createError({ statusCode: 401, message: verify.message })
  }

  const [takenRows] = await db.execute('SELECT id FROM users WHERE phone = ? LIMIT 1', [phone])
  if ((takenRows as any[]).length > 0) {
    throw createError({ statusCode: 409, message: '该手机号已注册，请用短信验证码直接登录该账号' })
  }

  await db.execute('UPDATE users SET phone = ? WHERE id = ?', [phone, userId])

  return {
    success: true,
    user: {
      id: user.id,
      phone,
      name: user.name,
      totalAnswered: user.total_answered,
      totalCorrect: user.total_correct,
      streak: user.streak,
      isAdmin: !!user.is_admin
    }
  }
})
