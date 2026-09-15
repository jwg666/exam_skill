# 题海拾贝 · 后续开发任务计划

> 基于 2026-09 代码现状制定。核心结论：项目处于「LocalStorage → MySQL」迁移的中间态，
> 阶段 0 / 1 必须先做（安全 + 数据闭环），之后才适合进入 PRD 中的功能迭代。
>
> **执行状态（2026-09-15）**：阶段 0 / 1 / 2 / 3（T3.1~T3.6）/ 4（T4.1~T4.4）全部完成，
> T3.3 深色模式与 T3.7 社交功能未实施。已通过 57 项端到端冒烟测试（`pnpm smoke`，嵌入式本地 MySQL）。
> 注意：远程生产库（39.97.112.184）在当前网络不可达，上线前需在可达环境执行 `pnpm migrate`
> 并确认远程库可从部署环境访问；数据库口令已随 git 历史泄露，务必先在库侧改密。

---

## 阶段 0：安全与规范整改（P0，预计 1~1.5 天）

| # | 任务 | 说明 | 涉及文件 | 粗估 |
|---|---|---|---|---|
| T0.1 | 密码哈希存储 | 注册改为 bcrypt 哈希入库，登录比对哈希；存量明文用户做一次性迁移脚本（或强制重置） | `server/api/auth/register.post.ts`、`login.post.ts`，新增迁移脚本；`package.json` 加依赖 | 0.5d |
| T0.2 | 数据库凭据环境变量化 | 凭据已随 git 历史泄露：先在数据库侧改密码；再改用 `.env` + `runtimeConfig` 注入，三个文件全部去硬编码，`.gitignore` 补 `.env` | `server/utils/db.ts`、`init_tables.js`、`seed_data.js`、`nuxt.config.ts`、`.gitignore` | 0.5d |
| T0.3 | 接口鉴权 | 目前 `/api/quiz/submit` 直接信任 body 里的 `userId`，任何人可伪造他人数据。登录时签发 token（JWT 或简单签名），服务端校验并从 token 取 userId | `auth/*.ts`、`quiz/submit.post.ts`、新增 `server/utils/auth.ts` | 0.5d |

**验收**：数据库中无明文密码；代码与 git 新提交中不含任何真实凭据；不带 token 无法调用写接口。

---

## 阶段 1：完成数据闭环——LocalStorage 全部迁入数据库（P0 主体，预计 4~6 天）

> 现状：`checkins`、`favorites`、`user_achievements` 三张表已建但无任何 API 读写；
> 错题本/收藏/历史/成就/打卡全在前端 localStorage，换设备即丢失，且与 DB 中的数据双轨不一致。

| # | 任务 | 说明 | 涉及文件 | 粗估 |
|---|---|---|---|---|
| T1.1 | 打卡接口 | `POST /api/checkin`（利用 `checkins` 唯一键防重复；按昨日是否打卡计算 streak 并更新 `users.streak`，事务）、`GET /api/checkins?userId=`（近 7 天记录）。首页 `handleCheckin` 改调接口，去掉 `checkedDays` 本地存储 | 新增 `server/api/checkins/*.ts`；`pages/index.vue`、`stores/app.ts` | 1d |
| T1.2 | 错题本接口 | `GET /api/wrong-book?userId=&bankId=`（联表 questions 返回题干/选项/解析）、`DELETE /api/wrong-book/:id`（"已掌握"移除）、`DELETE /api/wrong-book?userId=`（一键清空）。`wrong.vue` 改读接口 | 新增 `server/api/wrong-book/*.ts`；`pages/wrong.vue` | 1d |
| T1.3 | 收藏接口 | `GET / POST / DELETE /api/favorites`。答题页收藏按钮与收藏页改走接口 | 新增 `server/api/favorites/*.ts`；`pages/quiz.vue`、`pages/favorites.vue` | 0.5d |
| T1.4 | 历史记录接口 | `GET /api/histories?userId=`（联 banks 取名称）；`history.vue` 改读接口；删除 `quiz.vue` 交卷后的本地 `appStore.history.push` 双写 | 新增 `server/api/histories.get.ts`；`pages/history.vue`、`pages/quiz.vue` | 0.5d |
| T1.5 | 题库刷题进度落库 | 新表 `user_bank_progress(user_id, bank_id, last_index, done)`；交卷时更新；题库详情页完成度、顺序练习「从上次继续」读接口（现用 `bankProgress` 本地存储） | `init_tables.js` 加表、`quiz/submit.post.ts`、`pages/bank/[id].vue`、`pages/quiz.vue` | 1d |
| T1.6 | 成就系统上后端 | 成就定义保留前端 `utils/data.ts`，解锁记录写 `user_achievements`：在交卷/打卡接口内由服务端判定并落库，返回 `newlyUnlocked` 列表由前端弹 Toast；`GET /api/achievements?userId=` 供成就页与首页计数 | `quiz/submit.post.ts`、`checkins` 接口、新增 `server/api/achievements.get.ts`；`stores/app.ts`、`pages/achievements.vue` | 1d |
| T1.7 | 学习报告服务端聚合 | stats 页三项数据全部改由 histories 聚合：本周练习柱状图（按 `date_str`）、各科目正确率（join banks 按 type 分组）、答题时段分布（用 `created_at` 小时）。**前置依赖 T2.3 统一日期格式** | 新增 `server/api/stats.get.ts`；`pages/stats.vue` | 1d |
| T1.8 | 首页排行榜真实化 | `GET /api/ranking`（users 按 total_correct / 答题数排序，取前 N）；首页排行榜板块去 mock | 新增 `server/api/ranking.get.ts`；`pages/index.vue` | 0.5d |
| T1.9 | 登录后拉取全量用户数据 | `syncUserData` 扩展：登录成功后并行拉取错题/收藏/历史/进度/成就/打卡，替代 `useStorage` 的本地初始值；登出清空 | `stores/app.ts`、`pages/login.vue` | 0.5d |

**验收**：清空浏览器 localStorage 重新登录后，首页/错题本/收藏/历史/统计/成就数据完整不变；换浏览器登录同一账号数据一致。

---

## 阶段 2：Bug 修复与数据一致性清理（P1，穿插在阶段 1 进行）

| # | 任务 | 说明 | 涉及文件 |
|---|---|---|---|
| T2.1 | 修复 `user.username` 字段错误 | store 里存的是 `name`，`index.vue:51`、`profile.vue:17` 读 `username` 导致问候语和资料页昵称为空 | `pages/index.vue`、`pages/profile.vue` |
| T2.2 | 日期格式统一 | `dateStr` 目前用 `toLocaleDateString()`，不同环境产出 `2026/9/14` 与 `2026-09-14` 等不同格式，周聚合必然出错。统一 `YYYY-MM-DD`（服务端生成为准，前端不传） | `pages/quiz.vue`、`quiz/submit.post.ts` |
| T2.3 | 移除重复题库数据 | `utils/data.ts` 中的 `questionBanks` 与 `seed_data.js` 双轨维护，删掉前端题库数据（保留 `achievementDefs`），题库唯一来源为 DB | `utils/data.ts` |
| T2.4 | 交卷接口参数校验 | `total/correct/timeSpent` 加类型与范围校验（h3 `readValidatedBody` 或手动），防止脏数据入库 | `quiz/submit.post.ts` |
| T2.5 | 删除对 computed 的无效赋值 | `handleCheckin` 中 `appStore.checkedInToday = true` 是给无 setter 的 computed 赋值，T1.1 重构时自然消除 | `pages/index.vue` |

---

## 阶段 3：功能迭代（P1~P2，按 PRD 规划，每个为独立小迭代）

| # | 任务 | 说明 | 粗估 |
|---|---|---|---|
| T3.1 | 题型扩展：判断题、多选题 | `questions` 加 `type` 字段（single/judge/multi），多选答案改为存答案集合；`quiz.vue` 适配两种新交互与判分；`submit.post.ts` 判分逻辑适配（多选须全对才算对） | 2~3d |
| T3.2 | 题目分页与抽题接口 | `GET /api/banks/[id]` 现在一次返回全部题目，题量上来后拆分：题目列表分页接口 + `GET /api/banks/[id]/random?n=10`；quiz 页按需取题 | 1d |
| T3.3 | 深色模式 | PRD 遗留项：Tailwind `dark` class 策略 + CSS 变量，设置页开关持久化 | 1d |
| T3.4 | 个人信息编辑 | `PUT /api/users/:id`（昵称、头像），PRD 中「手机号脱敏展示」 | 0.5d |
| T3.5 | 消息通知真实化 | 通知页目前为静态：由成就解锁、排行榜变动、系统公告生成通知记录（新表或复用） | 1~2d |
| T3.6 | 题库管理后台 | 题库/题目 CRUD 接口 + 简单管理页（目前加题只能改 seed 脚本重跑），需管理员鉴权 | 2~3d |
| T3.7 | 社交属性（PRD 远期） | 好友系统、成就分享卡片、错题讨论区——建议在数据闭环稳定后立项 | 待排期 |

---

## 阶段 4：工程化与部署（P2）

| # | 任务 | 说明 |
|---|---|---|
| T4.1 | Serverless 数据库连接治理 | `.vercel` 表明部署在 Vercel：serverless 函数是无状态短生命周期，`mysql2.createPool` 每个实例各建一个池（当前 limit=10），并发一高就会耗尽数据库连接。需调低 `connectionLimit`，或改用支持 HTTP/边缘访问的托管 MySQL（如 PlanetScale 类方案） |
| T4.2 | 环境区分 | dev / prod 两套数据库与 `.env` 约定，避免本地调试污染线上数据 |
| T4.3 | API 冒烟测试 | 至少覆盖注册→登录→打卡→刷题→交卷→错题本的主链路，防回归 |
| T4.4 | README 更新 | 当前 README 还是 Nuxt 脚手架默认内容，补充：项目简介、本地启动步骤（建表/灌数据/环境变量）、目录结构 |

---

## 建议排期

```
里程碑 M1（约 1.5~2 周）：数据闭环上线
  第 1 周   阶段 0（安全）→ T1.1 打卡 → T1.2 错题本 → T1.3 收藏 → T2.x 穿插修 bug
  第 2 周   T1.4 历史 → T1.5 进度 → T1.6 成就 → T1.7 统计 → T1.8 排行 → T1.9 登录同步
里程碑 M2：阶段 3 按 T3.1（题型）→ T3.2（分页）→ T3.3~T3.6 顺序迭代
里程碑 M3：阶段 4 工程化收尾 + PRD 远期社交功能立项
```

**原则**：M1 完成前不加任何新功能——当前最大的产品风险不是功能少，而是数据不可信（清缓存即丢、可伪造）。
