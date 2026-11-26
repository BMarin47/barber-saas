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
  const { pathname, searchParams } = request.nextUrl

  // 1. NUNCA interceptar ni mutar cookies en /auth/callback, /api/*, /qr, /admin o /cancelar/*
  if (
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/api/') ||
    pathname === '/qr' ||
    pathname.startsWith('/qr/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/cancelar/')
  ) {
    return NextResponse.next({
      request,
    })
  }

  // 2. Si Supabase OAuth redirigió con ?code= a la raíz (/) u otra ruta que no sea /auth/callback,
  // redirigir inmediatamente a /auth/callback preservando todas las cookies (incluido el code_verifier PKCE).
  if (
    searchParams.has('code') &&
    !searchParams.has('error') &&
    !pathname.startsWith('/auth/callback')
  ) {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = '/auth/callback'
    if (!callbackUrl.searchParams.has('next') && pathname !== '/login') {
      callbackUrl.searchParams.set('next', pathname)
    }

    const redirectResponse = NextResponse.redirect(callbackUrl)
    request.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    })
    return redirectResponse
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = deriveSupabaseUrl()
  const supabaseAnonKey = deriveSupabaseAnonKey()

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  try {
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
            supabaseResponse.cookies.set(name, value, {
              ...options,
              path: options?.path || '/',
              sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') || 'lax',
              secure: options?.secure ?? process.env.NODE_ENV === 'production',
            })
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
      const redirectRes = NextResponse.redirect(homeUrl)
      supabaseResponse.cookies.getAll().forEach((c) => {
        redirectRes.cookies.set(c.name, c.value)
      })
      return redirectRes
    }
  } catch (err) {
    console.warn('[Supabase Middleware] Error refrescando sesión:', err)
  }

  return supabaseResponse
}
