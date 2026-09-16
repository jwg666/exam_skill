# 题海拾贝（极客考证）

移动端优先的智能刷题应用：题库中心、答题引擎（单选/判断/多选）、错题本、收藏、打卡、成就、排行榜、学习报告、消息通知与题库管理后台。

技术栈：Nuxt 3 + Vue 3 + TypeScript + Tailwind CSS + Pinia/VueUse + MySQL（mysql2）。所有业务数据存于 MySQL，前端仅持久化登录 token 与用户基础信息。

## 快速开始

```bash
pnpm install
```

1. 复制 `.env.example` 为 `.env`，填入数据库连接信息与 `AUTH_SECRET`（可用 `openssl rand -hex 32` 生成）。
2. 初始化数据库结构并迁移存量明文密码（幂等，可重复执行）：

```bash
node scripts/migrate.js
```

3. （可选）灌入种子题库数据：

```bash
node seed_data.js
```

4. 启动开发服务器：

```bash
pnpm dev
```

## 目录结构

```
├── pages/                 # 页面（首页/题库/答题/错题本/收藏/历史/统计/成就/通知/我的/管理后台）
├── server/
│   ├── api/               # REST 接口（auth/checkins/wrong-book/favorites/histories/quiz/stats/ranking/achievements/notifications/admin）
│   └── utils/             # db（连接池，会话时区 +08:00）、auth（HMAC token 鉴权）、game（成就/通知）
├── stores/                # Pinia：app（会话与用户数据）、quiz（答题现场）
├── shared/achievements.ts # 前后端共用的成就定义
├── middleware/auth.global.ts  # 登录拦截
├── scripts/migrate.js     # 幂等建表/补列/密码哈希迁移
└── seed_data.js           # 种子题库（含判断/多选示例）
```

## 关键设计

- **鉴权**：登录签发 HMAC 签名 token（30 天），写接口统一经 `requireUserId` 校验，前端由 `$api` 插件自动附加 `Authorization` 头，401 自动踢回登录页。
- **注册/登录**：注册使用手机号 + 短信验证码（昵称选填，默认手机号），不设置密码；登录支持「验证码登录」与「密码登录」（存量账号/管理员）双模式。短信注册账号的密码字段写入不可登录的随机哈希占位。
- **短信验证码**：与 rixingyishan 项目同一阿里云通道（环境变量名一致）。`SMS_PROVIDER=aliyun` 为真实下发（需填 `ALIYUN_ACCESS_KEY_ID/SECRET`、`ALIYUN_SMS_SIGN_NAME/TEMPLATE_CODE`，模板参数 `{"code":"xxxxxx"}`）；其他值为 mock（固定 `123456`，开发用）。验证码 6 位、TTL 300 秒、最多验证 5 次、同号 60 秒限频、单号每日 10 条上限。
- **密码**：bcrypt 哈希存储；存量明文账号在登录时自动升级，也可跑 `scripts/migrate.js` 一次性迁移。
- **成就**：服务端在交卷/打卡/收藏/清空错题本/注册登录时判定并落库（`user_achievements`），返回 `newlyUnlocked` 由前端弹 Toast。
- **题型**：`questions.type` 支持 single/judge/multi，多选答案存 `answer_multi` JSON 数组，判分须完全一致。
- **时区**：连接池统一会话时区为东八区，日期统一 `YYYY-MM-DD`，历史/统计按库内时间聚合。

## 管理后台

`users.is_admin = 1` 的账号登录后，「我的 → 题库管理」可新建/删除题库、增删题目（支持三种题型）。设置管理员：

```sql
UPDATE users SET is_admin = 1 WHERE phone = '你的手机号';
```
