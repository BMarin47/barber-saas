import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Proyecto activo de respaldo en Supabase por si el proyecto original (dskpizbcwwelbwqjakro) se encuentra pausado
const FALLBACK_SUPABASE_URL = 'https://juxbbesoptasgfinthyl.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_8pPqy44iRWvBMxVGlrmVRw_fq-5CJgz'

function deriveSupabaseUrlFromDatabaseUrl(): string | null {
  const candidates = [process.env.DATABASE_URL, process.env.DIRECT_URL]
  for (const raw of candidates) {
    if (!raw) continue
    // Formato pooler: postgresql://postgres.[PROJECT-REF]:...@...pooler.supabase.com
    const poolerMatch = raw.match(/postgres\.([a-z0-9]{15,25})[:@]/i)
    if (poolerMatch?.[1]) {
      return `https://${poolerMatch[1]}.supabase.co`
    }
    // Formato directo: postgresql://postgres:...@db.[PROJECT-REF].supabase.co
    const directMatch = raw.match(/@db\.([a-z0-9]{15,25})\.supabase\.co/i)
    if (directMatch?.[1]) {
      return `https://${directMatch[1]}.supabase.co`
    }
  }
  return null
}

export function getServerSupabaseCredentials(): { url: string | null; anonKey: string | null } {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    deriveSupabaseUrlFromDatabaseUrl() ||
    FALLBACK_SUPABASE_URL

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    FALLBACK_SUPABASE_ANON_KEY

  return { url, anonKey }
}

export async function checkSupabaseHostReachable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    const cleanUrl = url.replace(/\/$/, '')
    const res = await fetch(`${cleanUrl}/auth/v1/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    }).finally(() => clearTimeout(timeoutId))
    return res.status > 0
  } catch {
    return false
  }
}

/**
 * Resuelve las credenciales activas de Supabase verificando conectividad DNS/HTTP.
 * Si el proyecto configurado en variables de entorno está pausado, conmuta automáticamente
 * al proyecto activo de respaldo para que Google Sign-In nunca quede fuera de servicio.
 */
export async function resolveActiveSupabaseCredentials(): Promise<{
  url: string | null
  anonKey: string | null
  reachable: boolean
  usingFallback: boolean
}> {
  const primary = getServerSupabaseCredentials()

  if (primary.url && primary.anonKey) {
    const primaryReachable = await checkSupabaseHostReachable(primary.url)
    if (primaryReachable) {
      return {
        url: primary.url,
        anonKey: primary.anonKey,
        reachable: true,
        usingFallback: false,
      }
    }
  }

  // Failover automático al proyecto activo si el primario está pausado
  if (primary.url !== FALLBACK_SUPABASE_URL) {
    const fallbackReachable = await checkSupabaseHostReachable(FALLBACK_SUPABASE_URL)
    if (fallbackReachable) {
      return {
        url: FALLBACK_SUPABASE_URL,
        anonKey: FALLBACK_SUPABASE_ANON_KEY,
        reachable: true,
        usingFallback: true,
      }
    }
  }

  return {
    url: primary.url,
    anonKey: primary.anonKey,
    reachable: false,
    usingFallback: false,
  }
}

export async function GET() {
  const { url, anonKey, reachable, usingFallback } = await resolveActiveSupabaseCredentials()
  const configured = Boolean(url && anonKey)

  return NextResponse.json(
    {
      configured,
      reachable,
      usingFallback,
      url,
      anonKey,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  )
}
