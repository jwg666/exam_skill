import { createHmac, randomInt } from 'node:crypto'

// 短信验证码：与 rixingyishan-service 相同的通道设计与防爆破规则
// - 验证码 6 位随机数字，内存存储，TTL 300s（SMS_CODE_TTL 可调），最多验证 5 次，成功即销毁
// - 发送限频：同号 60s 一条、单号每日 10 条
// - SMS_PROVIDER=aliyun 走真实阿里云短信（模板参数 {"code":"xxxxxx"}）；其他值为 mock（固定 123456，开发用）

const CODE_TTL_MS = Number(process.env.SMS_CODE_TTL || 300) * 1000
const MAX_VERIFY_ATTEMPTS = 5
const SEND_INTERVAL_MS = Number(process.env.SMS_SEND_INTERVAL_MS || 60) * 1000
const DAILY_LIMIT = 10

interface CodeEntry {
  code: string
  expireAt: number
  attempts: number
}

interface SendEntry {
  lastSentAt: number
  dayKey: string
  dayCount: number
}

const codeStore = new Map<string, CodeEntry>()
const sendStore = new Map<string, SendEntry>()

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function cleanupExpired(): void {
  const now = Date.now()
  for (const [k, e] of codeStore) if (now > e.expireAt) codeStore.delete(k)
}

export function generateAndStoreCode(phone: string, fixedCode?: string): string {
  cleanupExpired()
  const code = fixedCode || String(randomInt(0, 1_000_000)).padStart(6, '0')
  codeStore.set(phone, { code, expireAt: Date.now() + CODE_TTL_MS, attempts: 0 })
  return code
}

export function checkSmsCode(phone: string, code: string): { ok: boolean; message: string } {
  cleanupExpired()
  const e = codeStore.get(phone)
  if (!e) return { ok: false, message: '验证码不存在或已过期，请重新获取' }
  if (Date.now() > e.expireAt) {
    codeStore.delete(phone)
    return { ok: false, message: '验证码已过期，请重新获取' }
  }
  if (e.attempts >= MAX_VERIFY_ATTEMPTS) {
    codeStore.delete(phone)
    return { ok: false, message: '验证次数过多，请重新获取验证码' }
  }
  if (e.code !== code) {
    e.attempts++
    return { ok: false, message: '验证码错误' }
  }
  codeStore.delete(phone)
  return { ok: true, message: '' }
}

// 发送限频检查：返回空字符串表示允许，否则返回提示语
export function checkSendLimit(phone: string): string {
  const s = sendStore.get(phone)
  const now = Date.now()
  const key = todayKey()
  if (s) {
    if (now - s.lastSentAt < SEND_INTERVAL_MS) {
      return '发送太频繁，请 1 分钟后再试'
    }
    if (s.dayKey === key && s.dayCount >= DAILY_LIMIT) {
      return '今日发送次数已达上限，请明天再试'
    }
  }
  return ''
}

export function recordSent(phone: string): void {
  const s = sendStore.get(phone)
  const key = todayKey()
  if (s && s.dayKey === key) {
    s.lastSentAt = Date.now()
    s.dayCount++
  } else {
    sendStore.set(phone, { lastSentAt: Date.now(), dayKey: key, dayCount: 1 })
  }
}

// ---------- 阿里云短信（RPC 签名，HMAC-SHA1，无需 SDK 依赖） ----------

function percentEncode(s: string): string {
  return encodeURIComponent(s)
    .replace(/\+/g, '%20')
    .replace(/\*/g, '%2A')
    .replace(/%7E/g, '~')
}

export function smsProvider(): 'aliyun' | 'mock' {
  return process.env.SMS_PROVIDER === 'aliyun' ? 'aliyun' : 'mock'
}

export async function sendSmsCode(phone: string, code: string): Promise<void> {
  if (smsProvider() !== 'aliyun') {
    console.log(`[SMS:mock] ${phone} 验证码 ${code}（mock 模式固定为 123456 时请直接输入 123456）`)
    return
  }

  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET
  const signName = process.env.ALIYUN_SMS_SIGN_NAME
  const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE
  if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
    throw new Error('阿里云短信配置不完整（ALIYUN_ACCESS_KEY_ID/SECRET、ALIYUN_SMS_SIGN_NAME/TEMPLATE_CODE）')
  }

  const params: Record<string, string> = {
    AccessKeyId: accessKeyId,
    Action: 'SendSms',
    Format: 'JSON',
    PhoneNumbers: phone,
    RegionId: 'cn-hangzhou',
    SignName: signName,
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: randomInt(0, Number.MAX_SAFE_INTEGER).toString(),
    SignatureVersion: '1.0',
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify({ code }),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2017-05-25'
  }

  const sorted = Object.keys(params).sort()
  const canonical = sorted.map((k) => percentEncode(k) + '=' + percentEncode(params[k])).join('&')
  const stringToSign = 'GET&' + percentEncode('/') + '&' + percentEncode(canonical)
  const signature = createHmac('sha1', accessKeySecret + '&').update(stringToSign).digest('base64')

  const url = 'https://dysmsapi.aliyuncs.com/?' + new URLSearchParams({ ...params, Signature: signature }).toString()
  const res = await fetch(url, { method: 'GET' })
  const body: any = await res.json().catch(() => null)
  if (!body || body.Code !== 'OK') {
    throw new Error(`阿里云短信发送失败: code=${body?.Code} message=${body?.Message}`)
  }
  console.log(`[SMS] 验证码已发送至 ${phone} (bizId=${body.BizId})`)
}
