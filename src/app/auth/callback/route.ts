import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSupabaseCredentials } from '@/app/api/auth/config/route'

function resolveBaseOrigin(request: NextRequest, fallbackOrigin: string): string {
  if (process.env.NODE_ENV === 'development') {
    return fallbackOrigin || 'http://localhost:3000'
  }
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  if (forwardedHost && !forwardedHost.includes('localhost')) {
    return `${forwardedProto}://${forwardedHost}`
  }
  const host = request.headers.get('host')
  if (host && !host.includes('localhost')) {
    return `https://${host}`
  }
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configuredUrl && !configuredUrl.includes('localhost')) {
    return configuredUrl.replace(/\/$/, '')
  }
  return fallbackOrigin
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const retry = searchParams.get('retry')
  const next = searchParams.get('next') ?? '/'
  const safeNext = next.startsWith('/') ? next : '/'
  const baseOrigin = resolveBaseOrigin(request, origin)
  const redirectUrl = `${baseOrigin}${safeNext}`

  if (error) {
    console.error('[Auth Callback] OAuth Provider Error:', error, errorDescription)
    const errUrl = new URL(`${baseOrigin}/login`)
    errUrl.searchParams.set('error', error)
    if (errorDescription) {
      errUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(errUrl.toString())
  }

  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getServerSupabaseCredentials()

  if (code && supabaseUrl && supabaseAnonKey) {
    const cookieStore = await cookies()
    const cookieMap = new Map<string, string>()
    request.cookies.getAll().forEach((c) => cookieMap.set(c.name, c.value))
    cookieStore.getAll().forEach((c) => cookieMap.set(c.name, c.value))

    const cookiesToApply: Array<{
      name: string
      value: string
      options: {
        path: string
        sameSite: 'lax' | 'strict' | 'none'
        secure: boolean
        maxAge?: number
        domain?: string
        httpOnly?: boolean
      }
    }> = []

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookieOptions: {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
      cookies: {
        getAll() {
          return Array.from(cookieMap.entries()).map(([name, value]) => ({
            name,
            value,
          }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (!value || options?.maxAge === 0) {
              cookieMap.delete(name)
            } else {
              cookieMap.set(name, value)
            }
            const normalizedOptions = {
              ...options,
              path: options?.path || '/',
              sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') || 'lax',
              secure: options?.secure ?? process.env.NODE_ENV === 'production',
            }
            cookiesToApply.push({ name, value, options: normalizedOptions })
            try {
              cookieStore.set(name, value, normalizedOptions)
            } catch {
              // Ignorar si el contexto no permite mutar cookieStore directamente
            }
          })
        },
      },
    })

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      const successResponse = NextResponse.redirect(redirectUrl)
      cookiesToApply.forEach(({ name, value, options }) => {
        successResponse.cookies.set(name, value, options)
      })
      return successResponse
    }

    // Verificar si la sesión ya quedó activa por una petición paralela previa
    const {
      data: { user: existingUser },
    } = await supabase.auth.getUser()

    if (existingUser) {
      const alreadyAuthResponse = NextResponse.redirect(redirectUrl)
      cookiesToApply.forEach(({ name, value, options }) => {
        alreadyAuthResponse.cookies.set(name, value, options)
      })
      return alreadyAuthResponse
    }

    console.error('[Auth Callback] Error intercambiando code por sesión:', exchangeError.message)

    // Fallback same-origin si el navegador retuvo el code-verifier en localStorage
    if (!retry && exchangeError.message?.toLowerCase().includes('code verifier')) {
      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Completando inicio de sesión...</title>
</head>
<body style="background:#09090b;color:#f4f4f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <div style="text-align:center;padding:24px;">
    <p style="font-size:14px;color:#a1a1aa;">Sincronizando sesión segura con Google...</p>
  </div>
  <script>
    (function() {
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key && key.indexOf('code-verifier') !== -1) {
            var val = localStorage.getItem(key);
            if (val) {
              document.cookie = key + '=' + encodeURIComponent(val) + '; path=/; SameSite=Lax; Secure';
            }
          }
        }
        if (document.cookie && document.cookie.indexOf('code-verifier') !== -1) {
          var currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('retry', '1');
          window.location.replace(currentUrl.toString());
          return;
        }
      } catch (e) {}
      window.location.replace(${JSON.stringify(redirectUrl)});
    })();
  </script>
</body>
</html>`
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      })
    }
  }

  return NextResponse.redirect(redirectUrl)
}
