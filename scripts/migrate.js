// 统一幂等迁移脚本：建表、默认分类、存量密码哈希。可重复执行。
// 用法：node scripts/migrate.js  （读取 .env 或环境变量，DATABASE_FILE 指定库文件）
import 'dotenv/config';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import bcrypt from 'bcryptjs';

// 东八区时间串（与原 MySQL 会话时区 +08:00 的行为一致）
const CST_NOW = "(datetime('now', '+8 hours'))";

const BASE_TABLES = `
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INTEGER PRIMARY KEY AUTOINCREMENT,
  \`phone\` TEXT NULL UNIQUE,
  \`name\` TEXT NOT NULL,
  \`password\` TEXT NOT NULL,
  \`total_answered\` INTEGER DEFAULT 0,
  \`total_correct\` INTEGER DEFAULT 0,
  \`streak\` INTEGER DEFAULT 0,
  \`is_admin\` INTEGER DEFAULT 0,
  \`created_at\` TEXT DEFAULT ${CST_NOW}
);

CREATE TABLE IF NOT EXISTS \`banks\` (
  \`id\` TEXT PRIMARY KEY,
  \`kind\` TEXT NOT NULL DEFAULT 'quiz',
  \`name\` TEXT NOT NULL,
  \`icon\` TEXT,
  \`color\` TEXT,
  \`type\` TEXT,
  \`type_name\` TEXT,
  \`description\` TEXT,
  \`total\` INTEGER DEFAULT 0,
  \`difficulty\` TEXT,
  \`created_at\` TEXT DEFAULT ${CST_NOW}
);

CREATE TABLE IF NOT EXISTS \`questions\` (
  \`id\` INTEGER PRIMARY KEY AUTOINCREMENT,
  \`bank_id\` TEXT NOT NULL,
  \`type\` TEXT NOT NULL DEFAULT 'single',
  \`content\` TEXT NOT NULL,
  \`options\` TEXT NOT NULL,
  \`answer_index\` INTEGER NOT NULL,
  \`answer_multi\` TEXT,
  \`explanation\` TEXT,
  \`meta\` TEXT,
  \`sort_order\` INTEGER DEFAULT 0,
  FOREIGN KEY (\`bank_id\`) REFERENCES \`banks\`(\`id\`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS \`checkins\` (
  \`id\` INTEGER PRIMARY KEY AUTOINCREMENT,
  \`user_id\` INTEGER NOT NULL,
  \`date_str\` TEXT NOT NULL,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  UNIQUE (\`user_id\`, \`date_str\`)
);

CREATE TABLE IF NOT EXISTS \`wrong_books\` (
  \`id\` INTEGER PRIMARY KEY AUTOINCREMENT,
  \`user_id\` INTEGER NOT NULL,
  \`bank_id\` TEXT NOT NULL,
  \`question_id\` INTEGER NOT NULL,
  \`created_at\` TEXT DEFAULT ${CST_NOW},
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`bank_id\`) REFERENCES \`banks\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`question_id\`) REFERENCES \`questions\`(\`id\`) ON DELETE CASCADE,
  UNIQUE (\`user_id\`, \`question_id\`)
);

CREATE TABLE IF NOT EXISTS \`favorites\` (
  \`id\` INTEGER PRIMARY KEY AUTOINCREMENT,
  \`user_id\` INTEGER NOT NULL,
  \`bank_id\` TEXT NOT NULL,
  \`question_id\` INTEGER NOT NULL,
  \`created_at\` TEXT DEFAULT ${CST_NOW},
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`bank_id\`) REFERENCES \`banks\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`question_id\`) REFERENCES \`questions\`(\`id\`) ON DELETE CASCADE,
  UNIQUE (\`user_id\`, \`question_id\`)
);

CREATE TABLE IF NOT EXISTS \`histories\` (
  \`id\` INTEGER PRIMARY KEY AUTOINCREMENT,
  \`user_id\` INTEGER NOT NULL,
  \`bank_id\` TEXT NOT NULL,
  \`date_str\` TEXT NOT NULL,
  \`total\` INTEGER NOT NULL,
  \`correct\` INTEGER NOT NULL,
  \`time_spent\` INTEGER NOT NULL,
  \`accuracy\` INTEGER NOT NULL,
  \`report\` TEXT,
  \`created_at\` TEXT DEFAULT ${CST_NOW},
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`bank_id\`) REFERENCES \`banks\`(\`id\`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS \`user_achievements\` (
  \`id\` INTEGER PRIMARY KEY AUTOINCREMENT,
  \`user_id\` INTEGER NOT NULL,
  \`achievement_id\` TEXT NOT NULL,
  \`created_at\` TEXT DEFAULT ${CST_NOW},
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  UNIQUE (\`user_id\`, \`achievement_id\`)
);

CREATE TABLE IF NOT EXISTS \`user_bank_progress\` (
  \`user_id\` INTEGER NOT NULL,
  \`bank_id\` TEXT NOT NULL,
  \`last_index\` INTEGER DEFAULT 0,
  \`done\` INTEGER DEFAULT 0,
  \`updated_at\` TEXT DEFAULT ${CST_NOW},
  PRIMARY KEY (\`user_id\`, \`bank_id\`),
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`bank_id\`) REFERENCES \`banks\`(\`id\`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS \`notifications\` (
  \`id\` INTEGER PRIMARY KEY AUTOINCREMENT,
  \`user_id\` INTEGER NOT NULL,
  \`type\` TEXT DEFAULT 'system',
  \`title\` TEXT NOT NULL,
  \`content\` TEXT,
  \`is_read\` INTEGER DEFAULT 0,
  \`created_at\` TEXT DEFAULT ${CST_NOW},
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS \`bank_categories\` (
  \`id\` INTEGER PRIMARY KEY AUTOINCREMENT,
  \`code\` TEXT NOT NULL UNIQUE,
  \`name\` TEXT NOT NULL,
  \`sort\` INTEGER DEFAULT 0,
  \`created_at\` TEXT DEFAULT ${CST_NOW}
);
`;

const INDEXES = `
CREATE UNIQUE INDEX IF NOT EXISTS \`uniq_user_date\` ON \`checkins\` (\`user_id\`, \`date_str\`);
CREATE UNIQUE INDEX IF NOT EXISTS \`uniq_user_q\` ON \`wrong_books\` (\`user_id\`, \`question_id\`);
CREATE UNIQUE INDEX IF NOT EXISTS \`uniq_user_fav_q\` ON \`favorites\` (\`user_id\`, \`question_id\`);
CREATE UNIQUE INDEX IF NOT EXISTS \`uniq_user_achieve\` ON \`user_achievements\` (\`user_id\`, \`achievement_id\`);
CREATE INDEX IF NOT EXISTS \`idx_user_read\` ON \`notifications\` (\`user_id\`, \`is_read\`);
`;

// MySQL 的 ON UPDATE CURRENT_TIMESTAMP 语义改由触发器实现
const TRIGGERS = `
CREATE TRIGGER IF NOT EXISTS \`trg_user_bank_progress_updated\`
AFTER UPDATE ON \`user_bank_progress\`
FOR EACH ROW
BEGIN
  UPDATE \`user_bank_progress\` SET \`updated_at\` = datetime('now', '+8 hours')
  WHERE \`user_id\` = NEW.\`user_id\` AND \`bank_id\` = NEW.\`bank_id\`;
END;
`;

const file = resolve(process.env.DATABASE_FILE || './data/exam.sqlite');
mkdirSync(dirname(file), { recursive: true });
const db = new Database(file);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const steps = [
  {
    name: '基础表结构（11 张表）',
    up() {
      db.exec(BASE_TABLES);
    }
  },
  {
    name: '唯一/普通索引（复合 UNIQUE 与通知索引）',
    up() {
      db.exec(INDEXES);
    }
  },
  {
    name: 'user_bank_progress.updated_at 触发器（ON UPDATE 语义）',
    up() {
      db.exec(TRIGGERS);
    }
  },
  {
    name: '题库分类初始化（默认五类，幂等）',
    up() {
      const defaults = [
        ['exam', '考试类', 1],
        ['skill', '技能类', 2],
        ['license', '资格类', 3],
        ['language', '语言类', 4],
        ['interest', '兴趣类', 5]
      ];
      const ins = db.prepare('INSERT OR IGNORE INTO bank_categories (code, name, sort) VALUES (?, ?, ?)');
      for (const [code, name, sort] of defaults) ins.run(code, name, sort);
    }
  },
  {
    name: '存量明文密码迁移为 bcrypt 哈希',
    up() {
      const rows = db.prepare("SELECT id, password FROM users WHERE password NOT LIKE '$2%'").all();
      const upd = db.prepare('UPDATE users SET password = ? WHERE id = ?');
      for (const row of rows) {
        upd.run(bcrypt.hashSync(row.password, 10), row.id);
        console.log(`  已哈希用户 #${row.id}`);
      }
      console.log(`  共处理 ${rows.length} 个明文密码账号`);
    }
  }
];

try {
  for (const step of steps) {
    process.stdout.write(`> ${step.name} ... `);
    step.up();
    console.log('OK');
  }
  console.log(`迁移完成: ${file}`);
} finally {
  db.close();
}
