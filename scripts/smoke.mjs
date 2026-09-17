// 端到端冒烟测试：嵌入式 MySQL + 生产构建 + HTTP 全链路
// 前置：pnpm build 已完成（.output/ 存在）
import { createDB } from 'mysql-memory-server'
import { spawnSync, spawn } from 'node:child_process'
import mysql from 'mysql2/promise'

const PORT = 3210
const results = []
let passed = 0
let failed = 0

function check(name, cond, detail = '') {
  if (cond) {
    passed++
    results.push(`  ✓ ${name}`)
  } else {
    failed++
    results.push(`  ✗ ${name}${detail ? ' —— ' + detail : ''}`)
  }
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch { /* not ready */ }
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error('server did not start in time')
}

console.log('[1/5] 启动嵌入式 MySQL…')
const db = await createDB({ dbName: 'exam_skill', logLevel: 'ERROR' })
console.log(`  MySQL ${db.mysql.version} 就绪，端口 ${db.port}`)

const env = {
  ...process.env,
  DATABASE_HOST: '127.0.0.1',
  DATABASE_PORT: String(db.port),
  DATABASE_USER: db.username,
  DATABASE_PASSWORD: '',
  DATABASE_NAME: db.dbName,
  AUTH_SECRET: 'smoke-test-secret',
  SMS_PROVIDER: 'mock',
  SMS_SEND_INTERVAL_MS: '2'
}

try {
  console.log('[2/5] 执行迁移与种子数据…')
  const m = spawnSync('node', ['scripts/migrate.js'], { env, encoding: 'utf8' })
  if (m.status !== 0) throw new Error('migrate 失败: ' + m.stderr)
  const s = spawnSync('node', ['seed_data.js'], { env, encoding: 'utf8' })
  if (s.status !== 0) throw new Error('seed 失败: ' + s.stderr)
  console.log('  ' + (s.stdout.trim().split('\n').pop() || 'seeded'))

  console.log('[3/5] 启动生产构建服务器…')
  const server = spawn('node', ['.output/server/index.mjs'], {
    env: { ...env, PORT: String(PORT), HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  server.stderr.on('data', d => process.stderr.write('[server] ' + d))
  const base = `http://127.0.0.1:${PORT}`
  await waitForServer(`${base}/api/banks`)
  console.log(`  服务就绪: ${base}`)

  const api = async (path, opts = {}, token) => {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(base + path, { ...opts, headers })
    let body = null
    try { body = await res.json() } catch { /* empty */ }
    return { status: res.status, body }
  }

  console.log('[4/5] 执行接口断言…')
  let r
  // ---- 短信验证码注册 ----
  r = await api('/api/auth/sms/send', { method: 'POST', body: JSON.stringify({ phone: '13800138000' }) })
  check('发送验证码成功 (mock)', r.status === 200 && r.body?.provider === 'mock')

  r = await api('/api/auth/sms/send', { method: 'POST', body: JSON.stringify({ phone: '13800138000' }) })
  check('限频内重复发送返回 429', r.status === 429)
  await new Promise(s => setTimeout(s, 2100))

  r = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ phone: '13800138000', code: '000000' }) })
  check('错误验证码返回 400', r.status === 400)

  r = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ name: '测试用户', phone: '13800138000', code: '123456' }) })
  check('验证码注册成功返回 token', r.status === 200 && !!r.body?.token)
  const token = r.body?.token

  r = await api('/api/auth/sms/send', { method: 'POST', body: JSON.stringify({ phone: '13800138000' }) })
  check('已注册手机号可发送登录验证码', r.status === 200)

  r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone: '13800138000', password: 'whatever' }) })
  check('短信注册账号密码登录不可用 (401)', r.status === 401)

  // 注册去重：已注册手机号注册返回 409
  await new Promise(s => setTimeout(s, 2100))
  r = await api('/api/auth/sms/send', { method: 'POST', body: JSON.stringify({ phone: '13800138000' }) })
  check('A 再次发送验证码成功', r.status === 200)
  r = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ phone: '13800138000', code: '123456' }) })
  check('重复注册返回 409', r.status === 409)

  // 手机号 B：昵称为空默认手机号 + 验证码登录
  r = await api('/api/auth/sms/send', { method: 'POST', body: JSON.stringify({ phone: '13800138001' }) })
  check('B 发送验证码成功', r.status === 200)
  r = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ phone: '13800138001', code: '123456' }) })
  check('昵称为空默认填入手机号', r.status === 200 && r.body?.user?.name === '13800138001')
  await new Promise(s => setTimeout(s, 2100))
  r = await api('/api/auth/sms/send', { method: 'POST', body: JSON.stringify({ phone: '13800138001' }) })
  check('间隔后再次发送成功', r.status === 200)
  r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone: '13800138001', code: '123456' }) })
  check('短信验证码登录成功', r.status === 200 && !!r.body?.token)
  const adminTokenUnused = r.body?.token

  // 密码确为 bcrypt 哈希（短信注册账号为不可登录占位哈希）
  {
    const conn = await mysql.createConnection({ host: '127.0.0.1', port: db.port, user: db.username, database: db.dbName })
    const [rows] = await conn.query("SELECT password FROM users WHERE phone='13800138000'")
    check('密码为 bcrypt 哈希存储', String(rows[0].password).startsWith('$2'))
    await conn.end()
  }

  // ---- 鉴权拦截 ----
  r = await api('/api/checkins')
  check('无 token 访问打卡接口返回 401', r.status === 401)
  r = await api('/api/checkins', {}, 'bad.token.here')
  check('伪造 token 返回 401', r.status === 401)

  // ---- 打卡 ----
  r = await api('/api/checkins', {}, token)
  check('打卡状态初始为未打卡', r.status === 200 && r.body.checkedToday === false)

  r = await api('/api/checkins', { method: 'POST' }, token)
  check('打卡成功 streak=1', r.status === 200 && r.body.insertedLike === undefined && r.body.streak === 1 && r.body.alreadyChecked === false)

  r = await api('/api/checkins', { method: 'POST' }, token)
  check('重复打卡幂等', r.body.alreadyChecked === true && r.body.streak === 1)

  // ---- 题库与题目 ----
  r = await api('/api/banks')
  const bankIds = (r.body || []).map(b => b.id)
  check('题库列表含 6 个种子题库', r.status === 200 && bankIds.length === 6, `got ${bankIds.length}`)

  r = await api('/api/banks/js')
  const qs = r.body?.questions || []
  check('题库详情返回 12 题（含判断/多选）', qs.length === 12, `got ${qs.length}`)
  const judge = qs.find(q => q.type === 'judge')
  const multi = qs.find(q => q.type === 'multi')
  check('判断题/多选题字段正确', judge?.opts?.length === 2 && Array.isArray(multi?.ans))

  r = await api(`/api/banks/js/random?n=5`)
  check('随机抽题返回 5 题', r.status === 200 && r.body.questions.length === 5)

  // ---- 交卷 ----
  r = await api('/api/quiz/submit', { method: 'POST', body: JSON.stringify({ bankId: 'js', total: 12, correct: 9, timeSpent: 95, wrongQuestions: [qs[0].id, qs[1].id, qs[2].id] }) }, token)
  check('交卷成功 accuracy=75', r.status === 200 && r.body.accuracy === 75)
  check('交卷触发 first_quiz 成就', (r.body?.newlyUnlocked || []).some(a => a.id === 'first_quiz'))
  check('交卷不触发 acc_80（75<80）', !(r.body?.newlyUnlocked || []).some(a => a.id === 'acc_80'))

  r = await api('/api/quiz/submit', { method: 'POST', body: JSON.stringify({ bankId: 'js', total: -1, correct: 0, timeSpent: 0 }) }, token)
  check('交卷参数校验拒绝非法 total', r.status === 400)

  r = await api('/api/quiz/submit', { method: 'POST', body: JSON.stringify({ bankId: 'js', total: 12, correct: 0, timeSpent: 5 }) }, 'stolen.token')
  check('伪造 token 交卷被拒', r.status === 401)

  // ---- 错题本 ----
  r = await api('/api/wrong-book', {}, token)
  check('错题本收录 3 题', r.status === 200 && r.body.length === 3, `got ${r.body?.length}`)
  const wrongId = r.body?.[0]?.id

  r = await api(`/api/wrong-book?id=${wrongId}`, { method: 'DELETE' }, token)
  check('移除单条错题', r.body?.removed === 1)

  r = await api('/api/wrong-book', { method: 'DELETE' }, token)
  check('一键清空触发 wrong_clear 成就', (r.body?.newlyUnlocked || []).some(a => a.id === 'wrong_clear'))

  // ---- 收藏 ----
  r = await api('/api/favorites', { method: 'POST', body: JSON.stringify({ questionId: qs[0].id }) }, token)
  check('收藏成功', r.body?.favorited === true)
  r = await api('/api/favorites', { method: 'POST', body: JSON.stringify({ questionId: qs[0].id }) }, token)
  check('重复收藏为取消（toggle）', r.body?.favorited === false)

  // ---- 历史/进度/统计 ----
  r = await api('/api/histories', {}, token)
  if (!(r.body?.length === 2 && r.body[0].bankName === 'JavaScript高级')) {
    console.log('[debug] histories:', r.status, JSON.stringify(r.body)?.slice(0, 400))
  }
  check('历史记录 1 条且带题库名', r.body?.length === 1 && r.body[0].bankName === 'JavaScript高级')

  r = await api('/api/progress', {}, token)
  check('刷题进度 js=12', r.body?.js === 12)

  r = await api('/api/stats', {}, token)
  if (!(r.body?.accuracy === 75)) console.log('[debug] stats:', r.status, JSON.stringify(r.body)?.slice(0, 600))
  check('统计：正确率 75%', r.body?.accuracy === 75)
  check('统计：本周今日 12 题', (r.body?.week || []).some(w => w.total === 12))
  check('统计：科目分组存在', (r.body?.byType || []).length === 1)
  check('统计：时段分布总数 1', Object.values(r.body?.timeDistribution || {}).reduce((a, b) => a + b, 0) === 1)

  // ---- 排行榜 ----
  r = await api('/api/ranking', {}, token)
  check('排行榜含本人且排第 1', r.body?.list?.[0]?.isMe === true && r.body?.myRank === 1)

  // ---- 成就 ----
  r = await api('/api/achievements', {}, token)
  const byId = Object.fromEntries((r.body || []).map(a => [a.id, a]))
  check('成就接口：first_login/first_quiz 已解锁', byId.first_login?.unlocked && byId.first_quiz?.unlocked)
  check('成就接口：quiz_50 未解锁', byId.quiz_50?.unlocked === false)

  // ---- 通知 ----
  r = await api('/api/notifications', {}, token)
  const titles = (r.body?.list || []).map(n => n.title).join(',')
  check('通知含成就解锁记录', (r.body?.list || []).length >= 2 && titles.includes('解锁成就'))
  check('未读数正确', r.body?.unread >= 2)
  r = await api('/api/notifications/read-all', { method: 'POST' }, token)
  r = await api('/api/notifications', {}, token)
  check('全部已读后 unread=0', r.body?.unread === 0)

  // ---- 个人资料 ----
  r = await api('/api/users/me', { method: 'PUT', body: JSON.stringify({ name: '改名字' }) }, token)
  check('修改昵称成功', r.status === 200 && r.body?.user?.[0]?.name === '改名字')

  // ---- 管理端 ----
  r = await api('/api/admin/banks', {}, token)
  check('非管理员访问管理接口 403', r.status === 403)

  {
    const conn = await mysql.createConnection({ host: '127.0.0.1', port: db.port, user: db.username, database: db.dbName })
    await conn.query("UPDATE users SET is_admin=1 WHERE phone='13800138000'")
    await conn.end()
  }

  // 管理员用短信验证码重新登录获取 A 账号 token
  await new Promise(s => setTimeout(s, 2100))
  r = await api('/api/auth/sms/send', { method: 'POST', body: JSON.stringify({ phone: '13800138000' }) })
  if (r.status !== 200) console.log('[debug] 管理员短信发送:', r.status, JSON.stringify(r.body))
  check('管理员短信发送成功', r.status === 200)
  r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone: '13800138000', code: '123456' }) })
  check('管理员短信登录成功', r.status === 200 && r.body?.user?.isAdmin === true)
  const adminToken = r.body?.token

  r = await api('/api/admin/banks', {}, adminToken)
  check('管理员可列出题库', r.status === 200 && r.body.length >= 6)

  r = await api('/api/admin/banks', { method: 'POST', body: JSON.stringify({ id: 'vue3', name: 'Vue3 高级', type: 'skill', typeName: '技能类' }) }, adminToken)
  check('管理员创建题库', r.status === 200 && r.body?.id === 'vue3')

  r = await api('/api/admin/banks/vue3/questions', { method: 'POST', body: JSON.stringify({ type: 'multi', content: '以下哪些是 Vue3 响应式 API？', opts: ['ref()', 'reactive()', 'observe()'], ans: [0, 1], explanation: 'observe 不是' }) }, adminToken)
  check('管理员添加多选题', r.status === 200 && !!r.body?.id)
  const newQid = r.body?.id

  r = await api('/api/admin/questions/' + newQid, { method: 'PUT', body: JSON.stringify({ type: 'single', content: '修改后的题干', opts: ['A', 'B'], ans: 1, explanation: '' }) }, adminToken)
  check('管理员修改题目', r.status === 200)

  r = await api('/api/admin/questions/' + newQid, { method: 'DELETE' }, adminToken)
  check('管理员删除题目', r.status === 200)

  r = await api('/api/admin/banks/vue3', { method: 'DELETE' }, adminToken)
  check('管理员删除题库', r.status === 200)

  // ---- 分类管理 ----
  r = await api('/api/categories')
  check('分类接口返回默认五类', r.status === 200 && r.body.length === 5, `got ${r.body?.length}`)

  // B 账号始终为普通用户，用于验证权限拦截（A 在后续环节会被提升为管理员）
  r = await api('/api/admin/categories', { method: 'POST', body: JSON.stringify({ code: 'music', name: '音乐类', sort: 6 }) }, adminTokenUnused)
  check('非管理员新建分类 403', r.status === 403)

  r = await api('/api/admin/categories', { method: 'POST', body: JSON.stringify({ code: 'music', name: '音乐类', sort: 6 }) }, adminToken)
  check('管理员新建分类', r.status === 200)

  r = await api('/api/admin/categories', { method: 'POST', body: JSON.stringify({ code: 'music', name: '重复', sort: 6 }) }, adminToken)
  check('重复分类编码 409', r.status === 409)

  const musicCat = (await (await api('/api/categories')).body).find((c) => c.code === 'music')
  r = await api(`/api/admin/categories/${musicCat.id}`, { method: 'PUT', body: JSON.stringify({ name: '音乐大类', sort: 9 }) }, adminToken)
  const catsAfterRename = await (await api('/api/categories')).body
  check('修改分类名称与排序', r.status === 200 && catsAfterRename.find((c) => c.code === 'music')?.name === '音乐大类')

  const examCat = catsAfterRename.find((c) => c.code === 'exam')
  r = await api(`/api/admin/categories/${examCat.id}`, { method: 'DELETE' }, adminToken)
  check('删除被题库引用的分类 409', r.status === 409)

  r = await api(`/api/admin/categories/${musicCat.id}`, { method: 'DELETE' }, adminToken)
  check('删除未使用分类成功', r.status === 200)
  r = await api('/api/categories')
  check('删除后分类数恢复五类', r.body.length === 5)

  // ---- 页面渲染抽查 ----
  for (const p of ['/', '/login', '/bank', '/stats', '/achievements', '/notifications', '/profile', '/wrong', '/favorites', '/history', '/admin']) {
    const res = await fetch(base + p, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    check(`页面 /${p === '/' ? '' : p} 渲染 200`, res.status === 200, `status ${res.status}`)
  }

  console.log('[5/5] 清理…')
  server.kill()
} finally {
  await db.stop()
}

console.log('\n========== 冒烟测试结果 ==========')
console.log(results.join('\n'))
console.log(`\n通过 ${passed} / ${passed + failed}`)
process.exit(failed > 0 ? 1 : 0)
