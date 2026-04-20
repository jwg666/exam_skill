# exam_skill（题海拾贝）

本项目是“题海拾贝”刷题学习应用的工程实现，产品需求参考 `exam_skill/prd.md`。

## 主要需要完成的功能（来自 PRD 提要）

### 1) 账号与用户模块
- 手机号密码登录/注册
- 个人信息展示与编辑（头像、昵称、手机号脱敏）
- 退出登录
- 鉴权拦截：未登录访问非登录页需拦截/跳转

### 2) 首页（Home）
- 问候与用户基础信息
- 每日打卡与连续打卡记录
- 学习数据概览：已答题数、正确率、连续打卡天数
- 热门题库推荐（附学习进度）
- 最近练习记录（继续学习）
- 学习排行榜（按积分/答题数等）

### 3) 题库中心（Bank）
- 题库搜索
- 分类筛选（考试类/技能类/资格类/语言类/兴趣类等）
- 题库列表：难度、总题数、完成度
- 题库详情：总题/已完成/错题数、刷题入口（顺序/错题重练/随机 10 题）、章节/题目目录直达

### 4) 答题引擎（核心 Quiz）
- 出题策略：顺序、错题重练、随机抽题、单题查看
- 答题交互：单选题即时反馈对错与解析、锁定选项
- 答题辅助：倒计时、答题卡浮层、标记疑问、收藏本题
- 进度控制：上一题/下一题、退出确认、防漏答校验
- 结算页：得分评语、耗时、答对/答错、正确率；做错题自动进入错题本；更新题库进度

### 5) 学习管理与反馈闭环
- 错题本：筛选、回顾解析、掌握后移除、一键清空
- 收藏：列表、重做、取消收藏
- 学习报告（Stats）：本周练习、各科正确率、答题时段分布
- 答题历史（History）：测验流水记录

### 6) 游戏化与系统
- 等级与经验：答题/打卡增加经验升级
- 成就徽章：满足条件解锁并提示
- 消息通知：系统公告、排行更新、成就解锁通知
- 系统设置：深色模式、关于我们

## 数据与状态（现状约定）
PRD 中的第一版数据结构以本地存储为主（如 `appState`、`quizState` 等）；后续可接入真实后端接口与数据库（见 `exam_skill/prd.md` 的迭代规划）。

## 开发与运行

### Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Environment

Create a `.env` file and fill in values:

- `NUXT_PASSWORD_AES_SECRET`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## Database Scripts

```bash
node check_db.js
node init_tables.js
node seed_data.js
```

## Production

Build the application for production:

# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
