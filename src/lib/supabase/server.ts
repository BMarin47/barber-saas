import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSupabaseCredentials } from '@/app/api/auth/config/route'

export async function createSupabaseServerClient() {
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getServerSupabaseCredentials()

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Ignorar cuando se invoca desde un Server Component de solo lectura
        }
      },
    },
  })
}
