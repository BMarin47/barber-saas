import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
    null

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    null

  return { url, anonKey }
}

export async function checkSupabaseHostReachable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2500)
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

export async function GET() {
  const { url, anonKey } = getServerSupabaseCredentials()
  const configured = Boolean(url && anonKey)
  const reachable = configured && url ? await checkSupabaseHostReachable(url) : false

  return NextResponse.json(
    {
      configured,
      reachable,
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
