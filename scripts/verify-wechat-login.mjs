// 微信登录后端 E2E（mock 模式，直进式流程）：
// 首次登录直接建号（无手机号）→ 二次登录同账号 → 登录态下可选绑定手机号 → 冲突/错误校验
const BASE = 'http://localhost:3000/api'
const MOCK_OPENID = 'e2etest' + Date.now().toString(36)
const NEW_PHONE = '137' + String(Date.now() % 1e8).padStart(8, '0')
const OLD_PHONE = '13800001234' // 已注册账号（wx-test）

async function api(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}
const post = (path, body, token) => api(path, {
  method: 'POST',
  headers: token ? { Authorization: 'Bearer ' + token } : {},
  body: JSON.stringify(body)
})

let failures = 0
function check(name, cond, detail = '') {
  if (cond) console.log(`✅ ${name}`)
  else { failures++; console.log(`❌ ${name} ${detail}`) }
}

async function main() {
  // 1. 首次微信登录 → 直接建号进入（无手机号）
  const first = await post('/auth/wechat/login', { code: 'e2e-1', mockOpenid: MOCK_OPENID })
  check('首次微信登录直接返回 token', first.status === 200 && !!first.data.token, JSON.stringify(first.data).slice(0, 140))
  check('新账号无手机号（phone=null）', first.data.user?.phone === null, `phone=${JSON.stringify(first.data.user?.phone)}`)
  check('账号名默认微信用户+尾号', /^微信用户/.test(first.data.user?.name || ''), `name=${first.data.user?.name}`)
  const token = first.data.token
  const uid = first.data.user?.id

  // 2. 二次微信登录 → 同一账号
  const second = await post('/auth/wechat/login', { code: 'e2e-2', mockOpenid: MOCK_OPENID })
  check('二次微信登录返回同一账号', second.status === 200 && second.data.user?.id === uid, `uid=${second.data.user?.id}`)

  // 3. 登录态下绑定手机号（短信验证码）
  await post('/auth/sms/send', { phone: NEW_PHONE })
  const bind = await post('/auth/wechat/bind', { phone: NEW_PHONE, code: '123456' }, token)
  check('登录态绑定手机号成功', bind.status === 200 && bind.data.user?.phone === NEW_PHONE, JSON.stringify(bind.data).slice(0, 140))

  // 4. 已有手机号再绑 → 409（无需短信，接口先查自身状态）
  const rebind = await post('/auth/wechat/bind', { phone: NEW_PHONE, code: '000000' }, token)
  check('已绑定手机号再次绑定被拒(409)', rebind.status === 409, `status=${rebind.status}`)

  // 5. 另一新微信账号绑到已注册手机号 → 409
  const other = await post('/auth/wechat/login', { code: 'e2e-3', mockOpenid: MOCK_OPENID + 'b' })
  await post('/auth/sms/send', { phone: OLD_PHONE }).catch(() => {})
  const taken = await post('/auth/wechat/bind', { phone: OLD_PHONE, code: '123456' }, other.data.token)
  check('绑定已注册手机号被拒(409)', taken.status === 409, `status=${taken.status}`)

  // 6. 验证码错误 → 401（用独立手机号发码后提交错误码）
  const wrongPhone = '136' + String(Date.now() % 1e8).padStart(8, '0')
  await post('/auth/sms/send', { phone: wrongPhone }).catch(() => {})
  const wrong = await post('/auth/wechat/bind', { phone: wrongPhone, code: '000000' }, other.data.token)
  check('验证码错误被拒(401)', wrong.status === 401, `status=${wrong.status}`)

  // 7. 未登录调用绑定 → 401
  const anon = await post('/auth/wechat/bind', { phone: NEW_PHONE, code: '123456' })
  check('未登录绑定被拒(401)', anon.status === 401, `status=${anon.status}`)

  if (failures) { console.log(`\n${failures} 项失败`); process.exit(1) }
  console.log('\n✅ 微信登录后端 E2E 全部通过（直进式 + 可选绑定）')
}

main().catch((e) => { console.error('E2E 异常:', e.message); process.exit(1) })
