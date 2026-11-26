import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null
let initPromise: Promise<SupabaseClient | null> | null = null

function buildBrowserClient(url: string, anonKey: string): SupabaseClient {
  return createBrowserClient(url, anonKey, {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      secure:
        typeof window !== 'undefined'
          ? window.location.protocol === 'https:'
          : process.env.NODE_ENV === 'production',
    },
  })
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  return browserClient
}

/**
 * Obtiene el cliente de Supabase en el navegador consultando /api/auth/config
 * para garantizar que siempre se utilice el proyecto activo y verificado (con failover automático si el primario está pausado).
 */
export async function resolveSupabaseBrowserClient(): Promise<SupabaseClient | null> {
  if (browserClient) return browserClient

  if (!initPromise) {
    initPromise = fetch('/api/auth/config', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.url && data?.anonKey && data?.reachable !== false) {
          browserClient = buildBrowserClient(data.url, data.anonKey)
          return browserClient
        }
        return null
      })
      .catch(() => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
        if (supabaseUrl && supabaseAnonKey) {
          browserClient = buildBrowserClient(supabaseUrl, supabaseAnonKey)
          return browserClient
        }
        return null
      })
  }

  return initPromise
}
