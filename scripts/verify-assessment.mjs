// 测评题库扩充后的 E2E 验证：登录 → 取题 → 提交 → 校验报告
const BASE = 'http://localhost:3000/api'

async function api(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${JSON.stringify(data).slice(0, 200)}`)
  return data
}

async function main() {
  // 1. 登录测试账号
  const login = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone: '13800001234', password: '123456' })
  })
  const token = login.token || login.data?.token
  if (!token) throw new Error('登录未返回 token: ' + JSON.stringify(login).slice(0, 200))
  const auth = { Authorization: 'Bearer ' + token }

  // 2. MBTI：56 题，全选第 0 项（每题左项 = E/S/T/J 极）→ 预期 ESTJ
  const mbtiBank = await api('/banks/mbti', { headers: auth })
  const mQs = mbtiBank.questions
  console.log(`MBTI 取题: ${mQs.length} 题（bank.total=${mbtiBank.bank?.total ?? mbtiBank.total}）`)
  if (mQs.length !== 56) throw new Error('MBTI 题数不是 56: ' + mQs.length)
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

  // 3. IQ：60 题。接口不返回答案（防作弊），从库中按 sort_order 取正确答案构造全对作答
  const iqBank = await api('/banks/iq', { headers: auth })
  const iQs = iqBank.questions
  console.log(`IQ 取题: ${iQs.length} 题（bank.total=${iqBank.bank?.total ?? iqBank.total}）`)
  if (iQs.length !== 60) throw new Error('IQ 题数不是 60: ' + iQs.length)

  const { default: mysql } = await import('mysql2/promise')
  const { default: dotenv } = await import('dotenv')
  dotenv.config()
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST, port: +process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD, database: process.env.DATABASE_NAME
  })
  const [rows] = await conn.execute(
    "SELECT answer_index FROM questions WHERE bank_id = 'iq' ORDER BY sort_order ASC"
  )
  await conn.end()
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

  console.log('\n✅ E2E 验证全部通过：题数、判分、维度交错、分类报告均正常')
}

main().catch((e) => {
  console.error('❌ E2E 验证失败:', e.message)
  process.exit(1)
})
