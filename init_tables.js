import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function initDB() {
  const connection = await mysql.createConnection({
    host: '39.97.112.184',
    port: 3306,
    user: 'exam_skill',
    password: 'exam_skill@yhjz',
    database: 'exam_skill'
  });

  const sql = `
  -- 用户表
  CREATE TABLE IF NOT EXISTS \`users\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`phone\` VARCHAR(20) NOT NULL UNIQUE,
    \`name\` VARCHAR(50) NOT NULL,
    \`password\` VARCHAR(100) NOT NULL,
    \`total_answered\` INT DEFAULT 0,
    \`total_correct\` INT DEFAULT 0,
    \`streak\` INT DEFAULT 0,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- 题库表
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

  -- 题目表
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

  -- 每日打卡表
  CREATE TABLE IF NOT EXISTS \`checkins\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`user_id\` INT NOT NULL,
    \`date_str\` VARCHAR(20) NOT NULL,
    FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
    UNIQUE KEY \`uniq_user_date\` (\`user_id\`, \`date_str\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- 错题本表
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

  -- 收藏表
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

  -- 答题历史表
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

  -- 成就表
  CREATE TABLE IF NOT EXISTS \`user_achievements\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`user_id\` INT NOT NULL,
    \`achievement_id\` VARCHAR(50) NOT NULL,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
    UNIQUE KEY \`uniq_user_achieve\` (\`user_id\`, \`achievement_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    const queries = sql.split(';').filter(q => q.trim() !== '');
    for (const q of queries) {
      await connection.query(q);
    }
    console.log('Tables created successfully!');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await connection.end();
  }
}

initDB();