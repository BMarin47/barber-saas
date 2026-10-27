import { cookies } from 'next/headers'
import crypto from 'crypto'

export const AUTH_COOKIE_NAME = 'barber_admin_session'
const DEFAULT_SESSION_EXPIRY_SECONDS = 60 * 60 * 24 // 24 horas

interface SessionPayload {
  role: 'admin'
  tenantId: string
  exp: number
  createdAt: number
}

function getSecretKey(): string {
  // Se utiliza SESSION_SECRET si está configurado, o ADMIN_PASS como fallback
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASS || 'barber-saas-secure-default-key-change-in-prod'
  return crypto.createHash('sha256').update(secret).digest('hex')
}

/**
 * Crea un token de sesión firmado criptográficamente (HMAC-SHA256)
 */
export function createSessionToken(tenantId: string = 'tenant-golden-blade'): string {
  const secret = getSecretKey()
  const exp = Math.floor(Date.now() / 1000) + DEFAULT_SESSION_EXPIRY_SECONDS
  const payload: SessionPayload = {
    role: 'admin',
    tenantId,
    exp,
    createdAt: Date.now(),
  }

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url')

  return `${encodedPayload}.${signature}`
}

/**
 * Verifica y valida el token de sesión
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null

    const [encodedPayload, signature] = parts
    const secret = getSecretKey()

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64url')

    // Evitar ataques de tiempo con comparación segura
    const sigBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null
    }

    const payloadText = Buffer.from(encodedPayload, 'base64url').toString('utf8')
    const payload = JSON.parse(payloadText) as SessionPayload

    // Verificar expiración
    const currentEpoch = Math.floor(Date.now() / 1000)
    if (payload.exp < currentEpoch) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

/**
 * Verifica si la solicitud actual en Next.js tiene una sesión de admin válida
 */
export async function getAdminSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)
    if (!sessionCookie || !sessionCookie.value) {
      return null
    }

    return verifySessionToken(sessionCookie.value)
  } catch {
    return null
  }
}
