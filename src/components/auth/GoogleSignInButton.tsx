'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { LogOut, Loader2 } from 'lucide-react'
import { resolveSupabaseBrowserClient } from '@/lib/supabase/client'

export interface GoogleUserProfile {
  name: string
  email: string
  avatarUrl?: string
}

interface GoogleSignInButtonProps {
  variant?: 'navbar' | 'form' | 'login'
  onUserAuthenticated?: (profile: GoogleUserProfile | null) => void
}

export function extractUserProfile(user: SupabaseUser | null): GoogleUserProfile | null {
  if (!user) return null
  const meta = user.user_metadata || {}
  const name =
    meta.full_name ||
    meta.name ||
    [meta.given_name, meta.family_name].filter(Boolean).join(' ') ||
    (user.email ? user.email.split('@')[0] : '')
  const email = user.email || meta.email || ''
  const avatarUrl = meta.avatar_url || meta.picture || undefined

  return { name, email, avatarUrl }
}

const GoogleLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  variant = 'navbar',
  onUserAuthenticated,
}) => {
  const router = useRouter()
  const [profile, setProfile] = useState<GoogleUserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const callbackRef = useRef(onUserAuthenticated)
  callbackRef.current = onUserAuthenticated

  useEffect(() => {
    let isMounted = true
    let unsubscribe: (() => void) | null = null

    resolveSupabaseBrowserClient().then((supabase) => {
      if (!isMounted || !supabase) return

      // Si Google/Supabase redirigió con ?code= directamente a la página actual, intercambiarlo
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ data }) => {
          if (!isMounted) return
          if (data?.session?.user) {
            const extracted = extractUserProfile(data.session.user)
            setProfile(extracted)
            callbackRef.current?.(extracted)
          }
          const cleanUrl = window.location.pathname
          window.history.replaceState({}, '', cleanUrl)
        })
      }

      // 1. Lectura inmediata de la sesión actual desde cookies/storage
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!isMounted) return
        const extracted = extractUserProfile(session?.user ?? null)
        setProfile(extracted)
        callbackRef.current?.(extracted)
        if (extracted && variant === 'login') {
          router.replace('/')
        }
      })

      // 2. Suscripción en tiempo real a cambios de autenticación (login, logout, token refresh)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return
        const extracted = extractUserProfile(session?.user ?? null)
        setProfile(extracted)
        callbackRef.current?.(extracted)
        if (extracted && variant === 'login') {
          router.replace('/')
        }
      })

      unsubscribe = () => subscription.unsubscribe()
    })

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [router, variant])

  const handleSignIn = useCallback(async () => {
    setError('')
    setLoading(true)

    try {
      const supabase = await resolveSupabaseBrowserClient()
      if (!supabase) {
        const msg =
          'Falta configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en las variables de entorno de Vercel.'
        setError(msg)
        if (variant === 'navbar') {
          window.alert(msg)
        }
        setLoading(false)
        return
      }

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signInError) {
        setError(signInError.message)
        if (variant === 'navbar') window.alert(signInError.message)
        setLoading(false)
        return
      }

      if (data?.url) {
        window.location.assign(data.url)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión con Google'
      setError(msg)
      if (variant === 'navbar') window.alert(msg)
      setLoading(false)
    }
  }, [variant])

  const handleSignOut = useCallback(async () => {
    const supabase = await resolveSupabaseBrowserClient()
    if (!supabase) return
    setLoading(true)
    await supabase.auth.signOut()
    setProfile(null)
    callbackRef.current?.(null)
    setLoading(false)
    router.push('/login')
    router.refresh()
  }, [router])

  if (variant === 'navbar') {
    if (profile) {
      return (
        <div className="flex items-center gap-2 bg-zinc-900/80 border border-white/[0.1] rounded-full pl-2 pr-2.5 py-1 text-xs">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-5 h-5 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold">
              {(profile.name || profile.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-zinc-200 font-medium max-w-[120px] truncate hidden sm:inline">
            {profile.name || profile.email}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            title="Cerrar sesión"
            className="text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer ml-0.5"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }

    return (
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        title={error || 'Iniciar sesión con Google'}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GoogleLogo className="w-3.5 h-3.5" />}
        <span>Iniciar sesión con Google</span>
      </button>
    )
  }

  if (variant === 'login') {
    return (
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm sm:text-base flex items-center justify-center gap-3 shadow-lg shadow-white/5 transition-all cursor-pointer disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleLogo className="w-5 h-5" />}
          <span>Iniciar sesión con Google</span>
        </button>
        {error && (
          <p className="text-xs text-rose-400 text-center">{error}</p>
        )}
      </div>
    )
  }

  // Variant: 'form' (StepConfirmation)
  if (profile) {
    return (
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
        <div className="flex items-center gap-3 min-w-0">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-8 h-8 rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {(profile.name || profile.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-300 truncate">
              Conectado como {profile.name || profile.email}
            </p>
            <p className="text-[11px] text-zinc-400 truncate">
              Tus datos (nombre y correo) se completaron automáticamente
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-white/[0.08] text-[11px] font-medium text-zinc-300 hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Salir</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleLogo className="w-4 h-4" />}
        <span>Iniciar sesión con Google para autocompletar</span>
      </button>
      {error && (
        <p className="text-xs text-amber-400 text-center">{error}</p>
      )}
    </div>
  )
}
