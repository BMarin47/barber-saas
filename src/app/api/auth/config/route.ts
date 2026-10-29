import { NextResponse } from 'next/server'

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

export async function GET() {
  const { url, anonKey } = getServerSupabaseCredentials()
  return NextResponse.json({
    configured: Boolean(url && anonKey),
    url,
    anonKey,
  })
}
