import { checkSendLimit, generateAndStoreCode, recordSent, sendSmsCode, smsProvider } from '../../../utils/sms'

// 发送短信验证码（注册与登录共用）：POST { phone }
// 已注册与否在各自动作中校验：注册接口对已注册手机号返回 409，登录接口对不存在手机号返回 401
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const phone = (body?.phone || '').trim()

  if (!/^1\d{10}$/.test(phone)) {
    throw createError({ statusCode: 400, message: '手机号格式不正确' })
  }

  const limitMsg = checkSendLimit(phone)
  if (limitMsg) {
    throw createError({ statusCode: 429, message: limitMsg })
  }

  // mock 模式固定 123456（开发用），真实模式生成随机码
  const code = generateAndStoreCode(phone, smsProvider() === 'aliyun' ? undefined : '123456')
  try {
    await sendSmsCode(phone, code)
  } catch (err: any) {
    console.error('[SMS] 发送失败:', err.message)
    throw createError({ statusCode: 502, message: '验证码发送失败，请稍后再试' })
  }
  recordSent(phone)

  return { success: true, provider: smsProvider() }
})
