import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

// 惰性初始化：等首次请求时 runtimeConfig 就绪后再建池。
// serverless 环境（Vercel）函数实例生命周期短，connectionLimit 必须调小，避免耗尽数据库连接数。
let pool: Pool | null = null;

export function useDb(): Pool {
  if (!pool) {
    const config = useRuntimeConfig();
    // 环境变量只要存在就采用（允许空字符串密码），否则回退到构建时默认值
    const env = (k: string, fallback: string) => {
      const v = process.env[k];
      return v !== undefined ? v : fallback;
    };
    pool = mysql.createPool({
      host: env('DATABASE_HOST', config.databaseHost),
      port: Number(env('DATABASE_PORT', config.databasePort)) || 3306,
      user: env('DATABASE_USER', config.databaseUser),
      password: env('DATABASE_PASSWORD', config.databasePassword),
      database: env('DATABASE_NAME', config.databaseName),
      waitForConnections: true,
      connectionLimit: 3,
      queueLimit: 0,
      connectTimeout: 10000,
      timezone: 'Z',
      // 业务统一按东八区处理日期/小时（DATE/NOW/HOUR 等结果不再受服务器时区影响）
      supportBigNumbers: true
    });
    pool.on('connection', (conn) => {
      conn.query("SET time_zone = '+08:00'");
    });
  }
  return pool;
}

// 业务统一使用东八区日期（服务器可能运行在 UTC，new Date() 直接取会错天）
export function cstDateStr(d: Date = new Date()): string {
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

export function cstHour(d: Date = new Date()): number {
  return new Date(d.getTime() + 8 * 3600 * 1000).getUTCHours();
}
