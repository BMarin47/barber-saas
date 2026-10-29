import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null
let initPromise: Promise<SupabaseClient | null> | null = null

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient) return browserClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (supabaseUrl && supabaseAnonKey) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
    return browserClient
  }

  return null
}

/**
 * Obtiene el cliente de Supabase en el navegador; si las variables NEXT_PUBLIC_*
 * no estaban disponibles en build-time, consulta /api/auth/config en runtime.
 */
export async function resolveSupabaseBrowserClient(): Promise<SupabaseClient | null> {
  const sync = getSupabaseBrowserClient()
  if (sync) return sync

  if (!initPromise) {
    initPromise = fetch('/api/auth/config')
      .then((res) => res.json())
      .then((data) => {
        if (data?.url && data?.anonKey) {
          browserClient = createBrowserClient(data.url, data.anonKey)
          return browserClient
        }
        return null
      })
      .catch(() => null)
  }

  return initPromise
}
