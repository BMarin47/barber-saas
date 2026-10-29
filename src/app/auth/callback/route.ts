import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServerSupabaseCredentials } from '@/app/api/auth/config/route'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const safeNext = next.startsWith('/') ? next : '/'
  const redirectUrl = `${origin}${safeNext}`

  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getServerSupabaseCredentials()

  if (code && supabaseUrl && supabaseAnonKey) {
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
    console.error('[Auth Callback] Error intercambiando code por sesión:', error.message)
  }

  return NextResponse.redirect(redirectUrl)
}
