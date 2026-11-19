import Database from 'better-sqlite3';
import type { Database as SqliteDb, Statement } from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// SQLite 适配层：对外保持 mysql2 的调用形状（execute/query 返回 [rows, fields]、
// getConnection 提供 beginTransaction/commit/rollback/release、写语句暴露
// insertId/affectedRows），业务代码零改动。
// better-sqlite3 是同步 API，而事务块内存在 await 会 yield 出去；为避免其他请求的
// 语句混入未提交事务，用一把全局互斥串行所有语句：普通语句即取即还，
// getConnection() 占住互斥直到 release()，事务内语句直行。
let sqlite: SqliteDb | null = null;

let chain: Promise<void> = Promise.resolve();
let gate: (() => void) | null = null;

// 排队等待互斥；返回的 resolve 函数用于释放（事务持有者跨 await 占用）
function acquire(): { wait: Promise<void>; release: () => void } {
  const wait = chain;
  let release!: () => void;
  gate = new Promise<void>((r) => { release = r; });
  chain = gate;
  return { wait, release };
}

function open(): SqliteDb {
  if (!sqlite) {
    const config = useRuntimeConfig();
    const env = (k: string, fallback: string) => {
      const v = process.env[k];
      return v !== undefined ? v : fallback;
    };
    const file = resolve(env('DATABASE_FILE', config.databaseFile || './data/exam.sqlite'));
    mkdirSync(dirname(file), { recursive: true });
    const db = new Database(file);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    db.pragma('synchronous = NORMAL');
    sqlite = db;
  }
  return sqlite;
}

const stmtCache = new Map<string, Statement>();

function prep(sql: string): Statement {
  const db = open();
  let stmt = stmtCache.get(sql);
  if (!stmt) {
    stmt = db.prepare(sql);
    stmtCache.set(sql, stmt);
  }
  return stmt;
}

// mysql2 形状的结果：SELECT → [rows, fields]；写语句 → [{ affectedRows, insertId }, fields]
function runStatement(sql: string, params: any[]): [any, any] {
  const stmt = prep(sql);
  try {
    if (stmt.reader) {
      return [stmt.all(...params), undefined];
    }
    const info = stmt.run(...params);
    return [{
      affectedRows: Number(info.changes),
      insertId: Number(info.lastInsertRowid || 0)
    }, undefined];
  } catch (err: any) {
    // 业务层按 mysql2 的错误码判断唯一键冲突（如分类 code 重复 → 409），统一转译
    if (typeof err?.code === 'string' && err.code.startsWith('SQLITE_CONSTRAINT')) {
      err.code = 'ER_DUP_ENTRY';
    }
    throw err;
  }
}

async function execDirect(sql: string, params?: any[]): Promise<[any, any]> {
  const { wait, release } = acquire();
  try {
    await wait;
    return runStatement(sql, params || []);
  } finally {
    release();
  }
}

class Connection {
  constructor(private releaseMutex: () => void) {}
  execute(sql: string, params?: any[]): Promise<[any, any]> {
    return Promise.resolve(runStatement(sql, params || []));
  }
  query(sql: string, params?: any[]): Promise<[any, any]> {
    return Promise.resolve(runStatement(sql, params || []));
  }
  async beginTransaction(): Promise<void> {
    runStatement('BEGIN IMMEDIATE', []);
  }
  commit(): Promise<void> {
    return Promise.resolve(runStatement('COMMIT', []));
  }
  rollback(): Promise<void> {
    try { runStatement('ROLLBACK', []); } catch { /* 已无活动事务 */ }
    return Promise.resolve();
  }
  release(): void {
    this.releaseMutex();
  }
}

export function useDb() {
  return {
    execute: execDirect,
    query: execDirect,
    async getConnection(): Promise<Connection> {
      // 事务持有者跨 await 占住互斥：gate 在 release() 前保持未决，
      // 后续 acquire 都排队其上，直到本连接 release
      const { wait, release } = acquire();
      await wait;
      return new Connection(release);
    }
  };
}

// 业务统一使用东八区日期（服务器可能运行在 UTC，new Date() 直接取会错天）
export function cstDateStr(d: Date = new Date()): string {
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

export function cstHour(d: Date = new Date()): number {
  return new Date(d.getTime() + 8 * 3600 * 1000).getUTCHours();
}
