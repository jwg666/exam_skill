import { createHmac, timingSafeEqual } from 'node:crypto';

// 简单 HMAC 签名 token：base64url(payload).base64url(hmac)
// payload 仅含用户 id 与过期时间，无敏感信息；无状态、不依赖额外依赖。
export function signToken(userId: number, days = 30): string {
  const secret = process.env.AUTH_SECRET || useRuntimeConfig().authSecret;
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + days * 86400_000 })
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): number | null {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const secret = process.env.AUTH_SECRET || useRuntimeConfig().authSecret;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof data.uid !== 'number' || typeof data.exp !== 'number') return null;
    if (Date.now() > data.exp) return null;
    return data.uid;
  } catch {
    return null;
  }
}

// 需要登录的接口统一调用：从 Authorization: Bearer <token> 取用户 id，无效则 401
export function requireUserId(event: any): number {
  const auth = getHeader(event, 'authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const uid = verifyToken(token);
  if (!uid) {
    throw createError({ statusCode: 401, message: '未登录或登录已过期' });
  }
  return uid;
}

export async function requireAdmin(event: any): Promise<number> {
  const uid = requireUserId(event);
  const db = useDb();
  const [rows] = await db.execute('SELECT is_admin FROM users WHERE id = ?', [uid]);
  const users = rows as any[];
  if (!users.length || !users[0].is_admin) {
    throw createError({ statusCode: 403, message: '无管理员权限' });
  }
  return uid;
}
