// 测评/趣味题库扩充后的 E2E 验证：登录 → 取题 → 提交 → 校验报告
const BASE = process.env.E2E_BASE || 'http://localhost:3000/api'

async function api(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${JSON.stringify(data).slice(0, 200)}`)
  return data
}

async function loginTestUser() {
  // 优先密码登录（存量账号），失败则短信登录 / 注册（mock 短信固定验证码 123456）
  const phone = '13800001234'
  try {
    const login = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password: '123456' })
    })
    return login.token || login.data?.token
  } catch { /* 走短信通道 */ }
  // 短信验证码需先触发发送（mock 模式固定 123456）
  await api('/auth/sms/send', { method: 'POST', body: JSON.stringify({ phone }) })
  try {
    const login = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, code: '123456' })
    })
    return login.token || login.data?.token
  } catch { /* 账号不存在，注册（验证码未校验不会消耗，直接复用） */ }
  const reg = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ phone, code: '123456', name: '题库验证' })
  })
  return reg.token || reg.data?.token
}

async function main() {
  // 1. 登录测试账号
  const token = await loginTestUser()
  if (!token) throw new Error('无法获取测试账号 token')
  const auth = { Authorization: 'Bearer ' + token }

  // 2. MBTI：120 题，全选第 0 项（每题左项 = E/S/T/J 极）→ 预期 ESTJ
  const mbtiBank = await api('/banks/mbti', { headers: auth })
  const mQs = mbtiBank.questions
  console.log(`MBTI 取题: ${mQs.length} 题（bank.total=${mbtiBank.bank?.total ?? mbtiBank.total}）`)
  if (mQs.length !== 120) throw new Error('MBTI 题数不是 120: ' + mQs.length)
  const mbtiRes = await api('/quiz/submit', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ bankId: 'mbti', timeSpent: 600, answers: mQs.map(() => 0) })
  })
  const mr = mbtiRes.report
  console.log('MBTI 提交: typeCode=' + mr.typeCode, 'typeName=' + mr.typeName)
  console.log('  dims:', mr.dims.map((d) => `${d.dim}:${d.left}/${d.rightPct}`).join(' '))
  if (mr.typeCode !== 'ESTJ') throw new Error('MBTI 报告类型错误: ' + mr.typeCode)
  if (!mr.dims.every((d) => d.leftPct === 100)) throw new Error('MBTI 维度百分比异常')

  // 3. IQ：90 题。接口不返回答案（防作弊），从库中按 sort_order 取正确答案构造全对作答
  const iqBank = await api('/banks/iq', { headers: auth })
  const iQs = iqBank.questions
  console.log(`IQ 取题: ${iQs.length} 题（bank.total=${iqBank.bank?.total ?? iqBank.total}）`)
  if (iQs.length !== 90) throw new Error('IQ 题数不是 90: ' + iQs.length)

  const { default: Database } = await import('better-sqlite3')
  const { resolve } = await import('node:path')
  const file = resolve(process.env.DATABASE_FILE || './data/exam.sqlite')
  const db = new Database(file, { readonly: true })
  const rows = db.prepare("SELECT answer_index FROM questions WHERE bank_id = 'iq' ORDER BY sort_order ASC").all()
  db.close()
  const answers = rows.map((r) => r.answer_index)

  const iqRes = await api('/quiz/submit', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ bankId: 'iq', timeSpent: 1500, answers })
  })
  const ir = iqRes.report
  console.log(`IQ 提交: iq=${ir.iq} tier=${ir.tier} percentile=${ir.percentile}`)
  console.log('  byCat:', ir.byCat.map((c) => `${c.cat}:${c.correct}/${c.total}`).join(' '))
  if (ir.iq !== 145) throw new Error('IQ 满分应为 145: ' + ir.iq)
  if (ir.byCat.length !== 6 || ir.byCat.some((c) => c.pct !== 100)) throw new Error('IQ 分类报告异常')

  // 4. 趣味测验：普通题库 API 下发答案，直接构造全对作答，验证单选/判断/多选混合判分
  const funBank = await api('/banks/fun', { headers: auth })
  const fQs = funBank.questions
  console.log(`趣味测验取题: ${fQs.length} 题（bank.total=${funBank.bank?.total ?? funBank.total}）`)
  if (fQs.length !== 52) throw new Error('趣味测验题数不是 52: ' + fQs.length)
  const byType = fQs.reduce((acc, q) => { acc[q.type || 'single'] = (acc[q.type || 'single'] || 0) + 1; return acc }, {})
  if (!(byType.single === 44 && byType.judge === 4 && byType.multi === 4)) {
    throw new Error('趣味测验题型分布异常: ' + JSON.stringify(byType))
  }
  const funRes = await api('/quiz/submit', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      bankId: 'fun', timeSpent: 300,
      answers: fQs.map((q) => (Array.isArray(q.ans) ? [...q.ans].sort() : q.ans))
    })
  })
  if (funRes.accuracy !== 100) throw new Error('趣味测验全对应为 100%: ' + funRes.accuracy)
  if (funRes.report) throw new Error('普通题库不应返回测评报告')
  console.log('趣味测验提交: accuracy=' + funRes.accuracy + '%  题型分布:', JSON.stringify(byType))

  console.log('\n✅ E2E 验证全部通过：题数、判分、维度交错、分类报告、题型混合均正常')
}

main().catch((e) => {
  console.error('❌ E2E 验证失败:', e.message)
  process.exit(1)
})
