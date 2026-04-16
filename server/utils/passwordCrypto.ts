import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

const VERSION_PREFIX = 'v1'

function deriveKey(secret: string) {
  return createHash('sha256').update(secret, 'utf8').digest()
}

export function encryptPassword(plain: string, secret: string) {
  if (!secret) {
    throw new Error('Missing password AES secret')
  }

  const iv = randomBytes(12)
  const key = deriveKey(secret)
  const cipher = createCipheriv('aes-256-gcm', key, iv)

  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [
    VERSION_PREFIX,
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64')
  ].join(':')
}

export function isEncryptedPassword(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const parts = value.split(':')
  return parts.length === 4 && parts[0] === VERSION_PREFIX
}

export function decryptPassword(payload: string, secret: string) {
  if (!secret) {
    throw new Error('Missing password AES secret')
  }

  const parts = payload.split(':')
  if (parts.length !== 4 || parts[0] !== VERSION_PREFIX) {
    throw new Error('Invalid password payload')
  }

  const iv = Buffer.from(parts[1], 'base64')
  const tag = Buffer.from(parts[2], 'base64')
  const data = Buffer.from(parts[3], 'base64')

  const key = deriveKey(secret)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return decrypted.toString('utf8')
}

export function verifyPassword(stored: unknown, input: string, secret: string) {
  if (typeof stored !== 'string') return { ok: false, needsUpgrade: false }

  if (isEncryptedPassword(stored)) {
    const plain = decryptPassword(stored, secret)
    return { ok: plain === input, needsUpgrade: false }
  }

  return { ok: stored === input, needsUpgrade: true }
}
