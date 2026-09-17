// 统一幂等迁移脚本：建表、补列、存量密码哈希。可重复执行。
// 用法：node scripts/migrate.js  （读取 .env 或环境变量）
import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const config = {
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: Number(process.env.DATABASE_PORT || 3306),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'exam_skill'
};

const BASE_TABLES = `
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`phone\` VARCHAR(20) NOT NULL UNIQUE,
  \`name\` VARCHAR(50) NOT NULL,
  \`password\` VARCHAR(100) NOT NULL,
  \`total_answered\` INT DEFAULT 0,
  \`total_correct\` INT DEFAULT 0,
  \`streak\` INT DEFAULT 0,
  \`is_admin\` TINYINT(1) DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`banks\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`icon\` VARCHAR(50),
  \`color\` VARCHAR(20),
  \`type\` VARCHAR(20),
  \`type_name\` VARCHAR(20),
  \`description\` TEXT,
  \`total\` INT DEFAULT 0,
  \`difficulty\` VARCHAR(20),
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`questions\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`bank_id\` VARCHAR(50) NOT NULL,
  \`content\` TEXT NOT NULL,
  \`options\` TEXT NOT NULL,
  \`answer_index\` INT NOT NULL,
  \`explanation\` TEXT,
  \`sort_order\` INT DEFAULT 0,
  FOREIGN KEY (\`bank_id\`) REFERENCES \`banks\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`checkins\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`date_str\` VARCHAR(20) NOT NULL,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  UNIQUE KEY \`uniq_user_date\` (\`user_id\`, \`date_str\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`wrong_books\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`bank_id\` VARCHAR(50) NOT NULL,
  \`question_id\` INT NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`bank_id\`) REFERENCES \`banks\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`question_id\`) REFERENCES \`questions\`(\`id\`) ON DELETE CASCADE,
  UNIQUE KEY \`uniq_user_q\` (\`user_id\`, \`question_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`favorites\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`bank_id\` VARCHAR(50) NOT NULL,
  \`question_id\` INT NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`bank_id\`) REFERENCES \`banks\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`question_id\`) REFERENCES \`questions\`(\`id\`) ON DELETE CASCADE,
  UNIQUE KEY \`uniq_user_fav_q\` (\`user_id\`, \`question_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`histories\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`bank_id\` VARCHAR(50) NOT NULL,
  \`date_str\` VARCHAR(20) NOT NULL,
  \`total\` INT NOT NULL,
  \`correct\` INT NOT NULL,
  \`time_spent\` INT NOT NULL,
  \`accuracy\` INT NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`bank_id\`) REFERENCES \`banks\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`user_achievements\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`achievement_id\` VARCHAR(50) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  UNIQUE KEY \`uniq_user_achieve\` (\`user_id\`, \`achievement_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`user_bank_progress\` (
  \`user_id\` INT NOT NULL,
  \`bank_id\` VARCHAR(50) NOT NULL,
  \`last_index\` INT DEFAULT 0,
  \`done\` INT DEFAULT 0,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`user_id\`, \`bank_id\`),
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`bank_id\`) REFERENCES \`banks\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`notifications\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`type\` VARCHAR(20) DEFAULT 'system',
  \`title\` VARCHAR(100) NOT NULL,
  \`content\` VARCHAR(255),
  \`is_read\` TINYINT(1) DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  KEY \`idx_user_read\` (\`user_id\`, \`is_read\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`bank_categories\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`code\` VARCHAR(20) NOT NULL UNIQUE,
  \`name\` VARCHAR(20) NOT NULL,
  \`sort\` INT DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [config.database, table, column]
  );
  return rows[0].c > 0;
}

const steps = [
  {
    name: '基础表结构（users/banks/questions/checkins/wrong_books/favorites/histories/user_achievements/user_bank_progress/notifications）',
    async up(conn) {
      for (const sql of BASE_TABLES.split(';')) {
        if (sql.trim()) await conn.query(sql);
      }
    }
  },
  {
    name: '列补齐：users.is_admin',
    async up(conn) {
      if (!(await columnExists(conn, 'users', 'is_admin'))) {
        await conn.query('ALTER TABLE `users` ADD COLUMN `is_admin` TINYINT(1) DEFAULT 0');
      }
    }
  },
  {
    name: '列补齐：questions.type / questions.answer_multi（题型扩展）',
    async up(conn) {
      if (!(await columnExists(conn, 'questions', 'type'))) {
        await conn.query("ALTER TABLE `questions` ADD COLUMN `type` VARCHAR(10) NOT NULL DEFAULT 'single' AFTER `bank_id`");
      }
      if (!(await columnExists(conn, 'questions', 'answer_multi'))) {
        await conn.query('ALTER TABLE `questions` ADD COLUMN `answer_multi` TEXT NULL AFTER `answer_index`');
      }
    }
  },
  {
    name: '列补齐：banks.kind / questions.meta / histories.report（测评支持）',
    async up(conn) {
      if (!(await columnExists(conn, 'banks', 'kind'))) {
        await conn.query("ALTER TABLE `banks` ADD COLUMN `kind` VARCHAR(10) NOT NULL DEFAULT 'quiz' AFTER `id`");
      }
      if (!(await columnExists(conn, 'questions', 'meta'))) {
        await conn.query('ALTER TABLE `questions` ADD COLUMN `meta` TEXT NULL AFTER `explanation`');
      }
      if (!(await columnExists(conn, 'histories', 'report'))) {
        await conn.query('ALTER TABLE `histories` ADD COLUMN `report` TEXT NULL AFTER `accuracy`');
      }
    }
  },
  {
    name: '题库分类表初始化（默认五类，幂等）',
    async up(conn) {
      const defaults = [
        ['exam', '考试类', 1],
        ['skill', '技能类', 2],
        ['license', '资格类', 3],
        ['language', '语言类', 4],
        ['interest', '兴趣类', 5]
      ];
      for (const [code, name, sort] of defaults) {
        await conn.execute('INSERT IGNORE INTO bank_categories (code, name, sort) VALUES (?, ?, ?)', [code, name, sort]);
      }
    }
  },
  {
    name: '存量明文密码迁移为 bcrypt 哈希',
    async up(conn) {
      const [rows] = await conn.query("SELECT id, password FROM users WHERE password NOT LIKE '$2%'");
      for (const row of rows) {
        const hashed = await bcrypt.hash(row.password, 10);
        await conn.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, row.id]);
        console.log(`  已哈希用户 #${row.id}`);
      }
      console.log(`  共处理 ${rows.length} 个明文密码账号`);
    }
  }
];

async function main() {
  const conn = await mysql.createConnection(config);
  try {
    for (const step of steps) {
      process.stdout.write(`> ${step.name} ... `);
      await step.up(conn);
      console.log('OK');
    }
    console.log('迁移完成。');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('迁移失败:', err.message);
  process.exit(1);
});
