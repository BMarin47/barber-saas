import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function deriveSupabaseUrl(): string | null {
  const explicit =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim()
  if (explicit) return explicit

  const candidates = [process.env.DATABASE_URL, process.env.DIRECT_URL]
  for (const raw of candidates) {
    if (!raw) continue
    const poolerMatch = raw.match(/postgres\.([a-z0-9]{15,25})[:@]/i)
    if (poolerMatch?.[1]) return `https://${poolerMatch[1]}.supabase.co`
    const directMatch = raw.match(/@db\.([a-z0-9]{15,25})\.supabase\.co/i)
    if (directMatch?.[1]) return `https://${directMatch[1]}.supabase.co`
  }
  return null
}

function deriveSupabaseAnonKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    null
  )
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Rutas públicas que nunca deben redirigir a /login (evita bucles e interferencias con webhooks/admin)
  const isPublicRoute =
    pathname === '/login' ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/cancelar/')

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = deriveSupabaseUrl()
  const supabaseAnonKey = deriveSupabaseAnonKey()

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Si el usuario ya tiene sesión activa e intenta ir a /login, enviarlo a la raíz (/)
  if (user && pathname === '/login') {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/'
    homeUrl.search = ''
    return NextResponse.redirect(homeUrl)
  }

  // Si no hay sesión activa y la ruta es privada (incluyendo / y /[slug]), redirigir a /login
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}
