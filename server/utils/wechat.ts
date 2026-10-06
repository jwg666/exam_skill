// 微信小程序登录支持：
// - 真实模式：WECHAT_APPID + WECHAT_APPSECRET 都配置时，用 wx.login 的 code 调 code2session 换 openid
// - mock 模式：未配置密钥时（开发联调用），使用小程序端传入的稳定 mockOpenid 充当 openid（与 SMS_PROVIDER=mock 同一套路）
export function wechatProvider(): 'wechat' | 'mock' {
  return process.env.WECHAT_APPID && process.env.WECHAT_APPSECRET ? 'wechat' : 'mock'
}

export async function codeToOpenid(code: string): Promise<string> {
  const params = new URLSearchParams({
    appid: process.env.WECHAT_APPID as string,
    secret: process.env.WECHAT_APPSECRET as string,
    js_code: code,
    grant_type: 'authorization_code'
  })
  let data: { openid?: string; errcode?: number; errmsg?: string }
  try {
    const res = await fetch(`https://api.weixin.qq.com/sns/jscode2session?${params.toString()}`)
    data = await res.json()
  } catch (err: any) {
    throw createError({ statusCode: 502, message: '微信服务连接失败，请稍后再试' })
  }
  if (!data.openid) {
    // 40029=code 无效 45011=频率限制 40163=code 已使用；统一直接透出微信的错误描述
    throw createError({ statusCode: 502, message: `微信登录失败：${data.errmsg || 'code 无效'}` })
  }
  return data.openid
}

// mock 模式的 openid：仅接受小程序端生成的设备级随机串，杜绝注入任意身份
export function mockOpenid(mockOpenid: unknown, code: string): string {
  const id = String(mockOpenid || '')
  if (/^[a-zA-Z0-9_-]{8,64}$/.test(id)) return `mock:${id}`
  return `mock:code-${code.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'anonymous'}`
}
