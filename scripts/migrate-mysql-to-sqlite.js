// 一次性数据迁移：MySQL(60.205.1.17) → SQLite。在服务器上执行。
// 用法：DATABASE_FILE=./data/exam.sqlite node scripts/migrate-mysql-to-sqlite.js [--force]
// 依赖环境变量：DATABASE_HOST/PORT/USER/PASSWORD/NAME（源库）+ DATABASE_FILE（目标文件）
// 只读源库，不写 MySQL。目标文件已存在且非空时拒绝执行，--force 删除重建。
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const force = process.argv.includes('--force');
const file = resolve(process.env.DATABASE_FILE || './data/exam.sqlite');

if (!process.env.DATABASE_HOST) {
  console.error('缺少 DATABASE_* 环境变量（源 MySQL 配置）');
  process.exit(1);
}

// 外键顺序写入
const ORDER = [
  'users',
  'bank_categories',
  'banks',
  'questions',
  'checkins',
  'wrong_books',
  'favorites',
  'histories',
  'user_achievements',
  'user_bank_progress',
  'notifications'
];

if (!existsSync(file)) {
  console.error(`目标库不存在: ${file} —— 先运行 node migrate.js 建表再迁移`);
  process.exit(1);
}
mkdirSync(dirname(file), { recursive: true });

// dateStrings: 时间列按会话时区返回原始字符串，不做 JS Date 转换；
// timezone '+08:00' 与应用原行为一致（东八区）
const my = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 3306),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  dateStrings: true,
  timezone: '+08:00'
});

const sq = new Database(file);
sq.pragma('journal_mode = WAL');
sq.pragma('foreign_keys = OFF'); // 导入期间关外键，完成后逐表对账
sq.pragma('busy_timeout = 5000');

// 目标库已有数据（如 migrate.js 灌入的默认分类）时，清空各表后重灌，保证与源库完全一致
let totalRows = 0;
for (const t of ORDER) {
  const has = sq.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name=?").get(t);
  if (has.c > 0) totalRows += sq.prepare(`SELECT COUNT(*) AS c FROM \`${t}\``).get().c;
}
if (totalRows > 0 && !force) {
  console.error(`目标库已有 ${totalRows} 行数据，拒绝覆盖（--force 清空重灌）`);
  sq.close();
  process.exit(1);
}
if (totalRows > 0) {
  for (const t of ORDER) {
    sq.prepare(`DELETE FROM \`${t}\``).run();
  }
  console.log(`--force: 已清空目标库 ${totalRows} 行，重灌开始`);
}

const results = [];
try {
  for (const table of ORDER) {
    const [rows] = await my.query(`SELECT * FROM \`${table}\``);
    const colsInfo = sq.prepare(`PRAGMA table_info(\`${table}\`)`).all();
    const sqliteCols = new Set(colsInfo.map((c) => c.name));
    const cols = Object.keys(rows[0] || {}).filter((c) => sqliteCols.has(c));
    if (!cols.length) {
      results.push({ table, mysql: rows.length, sqlite: 0 });
      console.log(`> ${table}: MySQL ${rows.length} 行（无可写列，跳过写入）`);
      continue;
    }
    const placeholders = cols.map(() => '?').join(', ');
    const ins = sq.prepare(
      `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${placeholders})`
    );
    const write = sq.transaction((batch) => {
      for (const row of batch) ins.run(...cols.map((c) => row[c]));
    });
    write(rows);
    const count = sq.prepare(`SELECT COUNT(*) AS c FROM \`${table}\``).get().c;
    results.push({ table, mysql: rows.length, sqlite: count });
    console.log(`> ${table}: MySQL ${rows.length} 行 → SQLite ${count} 行`);
  }

  const mismatches = results.filter((r) => r.mysql !== r.sqlite);
  if (mismatches.length) {
    console.error('对账失败:', mismatches.map((r) => `${r.table} ${r.mysql}/${r.sqlite}`).join(', '));
    process.exitCode = 1;
  } else {
    console.log('✓ 全部表对账一致');
  }
} finally {
  sq.pragma('foreign_keys = ON');
  sq.close();
  await my.end();
}
