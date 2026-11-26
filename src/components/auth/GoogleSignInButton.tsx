'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { LogOut, Loader2, X, Check } from 'lucide-react'
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

export const GOOGLE_PROFILE_STORAGE_KEY = 'barberSaaS_googleProfile'
export const CLIENT_STORAGE_KEY = 'barberSaaS_clientData'
export const GOOGLE_AUTH_EVENT = 'barber-google-auth-changed'

export function getStoredGoogleProfile(): GoogleUserProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(GOOGLE_PROFILE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && (parsed.email || parsed.name)) {
      return {
        name: String(parsed.name || ''),
        email: String(parsed.email || ''),
        avatarUrl: parsed.avatarUrl ? String(parsed.avatarUrl) : undefined,
      }
    }
  } catch {
    // ignore
  }
  return null
}

export function setStoredGoogleProfile(profile: GoogleUserProfile | null): void {
  if (typeof window === 'undefined') return
  try {
    if (profile) {
      localStorage.setItem(GOOGLE_PROFILE_STORAGE_KEY, JSON.stringify(profile))
      // Sincronizar también con la memoria inteligente del formulario
      const existingRaw = localStorage.getItem(CLIENT_STORAGE_KEY)
      const existing = existingRaw ? JSON.parse(existingRaw) : {}
      localStorage.setItem(
        CLIENT_STORAGE_KEY,
        JSON.stringify({
          ...existing,
          name: profile.name || existing.name || '',
          email: profile.email || existing.email || '',
        })
      )
      document.cookie = `barber_client_auth=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
    } else {
      localStorage.removeItem(GOOGLE_PROFILE_STORAGE_KEY)
      document.cookie = 'barber_client_auth=; path=/; max-age=0; SameSite=Lax'
    }
    window.dispatchEvent(new CustomEvent(GOOGLE_AUTH_EVENT, { detail: profile }))
  } catch {
    // ignore
  }
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
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [modalEmail, setModalEmail] = useState('')
  const [modalName, setModalName] = useState('')
  const [savedCandidate, setSavedCandidate] = useState<GoogleUserProfile | null>(null)
  const callbackRef = useRef(onUserAuthenticated)

  useEffect(() => {
    callbackRef.current = onUserAuthenticated
  }, [onUserAuthenticated])

  useEffect(() => {
    let isMounted = true
    let unsubscribe: (() => void) | null = null

    // 0. Cargar sesión local si existe
    const initTimer = setTimeout(() => {
      if (!isMounted) return
      const stored = getStoredGoogleProfile()
      if (stored) {
        setProfile(stored)
        callbackRef.current?.(stored)
        if (variant === 'login') {
          router.replace('/')
        }
      }
    }, 0)

    // Escuchar eventos de sincronización entre botones (navbar / form / login)
    const handleCustomAuth = (e: Event) => {
      if (!isMounted) return
      const customEvent = e as CustomEvent<GoogleUserProfile | null>
      const nextProfile = customEvent.detail ?? getStoredGoogleProfile()
      setProfile(nextProfile)
      callbackRef.current?.(nextProfile)
      if (nextProfile && variant === 'login') {
        router.replace('/')
      }
    }
    window.addEventListener(GOOGLE_AUTH_EVENT, handleCustomAuth)

    resolveSupabaseBrowserClient().then((supabase) => {
      if (!isMounted || !supabase) return

      // 1. Lectura inmediata de la sesión actual desde cookies/storage de Supabase
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          if (!isMounted) return
          const extracted = extractUserProfile(session?.user ?? null)
          if (extracted) {
            setProfile(extracted)
            setStoredGoogleProfile(extracted)
            callbackRef.current?.(extracted)
            if (variant === 'login') {
              router.replace('/')
            }
          }
        })
        .catch(() => {
          // Ignorar errores de red si el proyecto de Supabase está pausado
        })

      // 2. Suscripción en tiempo real a cambios de autenticación (login, logout, token refresh)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return
        const extracted = extractUserProfile(session?.user ?? null)
        if (extracted) {
          setProfile(extracted)
          setStoredGoogleProfile(extracted)
          callbackRef.current?.(extracted)
          if (variant === 'login') {
            router.replace('/')
          }
        }
      })

      unsubscribe = () => subscription.unsubscribe()
    })

    return () => {
      isMounted = false
      clearTimeout(initTimer)
      window.removeEventListener(GOOGLE_AUTH_EVENT, handleCustomAuth)
      unsubscribe?.()
    }
  }, [router, variant])

  const openFallbackAccountSelector = useCallback(() => {
    try {
      const clientRaw = localStorage.getItem(CLIENT_STORAGE_KEY)
      if (clientRaw) {
        const parsed = JSON.parse(clientRaw)
        if (parsed?.email || parsed?.name) {
          setModalName(parsed.name || '')
          setModalEmail(parsed.email || '')
          if (parsed.email && parsed.name) {
            setSavedCandidate({ name: parsed.name, email: parsed.email })
          }
        }
      }
    } catch {
      // ignore
    }
    setLoading(false)
    setShowAccountModal(true)
  }, [])

  const handleModalSubmit = useCallback(
    (selected?: GoogleUserProfile) => {
      const finalEmail = (selected?.email ?? modalEmail).trim()
      const derivedName =
        (selected?.name ?? modalName).trim() ||
        (finalEmail.includes('@')
          ? finalEmail
              .split('@')[0]
              .replace(/[._-]+/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase())
          : 'Cliente')

      if (!finalEmail || !finalEmail.includes('@')) {
        setError('Ingresá un correo de Google válido')
        return
      }

      const newProfile: GoogleUserProfile = {
        name: derivedName,
        email: finalEmail,
      }
      setError('')
      setShowAccountModal(false)
      setProfile(newProfile)
      setStoredGoogleProfile(newProfile)
      callbackRef.current?.(newProfile)
      if (variant === 'login') {
        router.replace('/')
      }
    },
    [modalEmail, modalName, router, variant]
  )

  const handleSignIn = useCallback(async () => {
    setError('')
    setLoading(true)

    try {
      // Verificar estado y conectividad real del proyecto Supabase antes de redirigir el navegador
      let configData: { configured?: boolean; reachable?: boolean; url?: string | null } | null = null
      try {
        const cfgRes = await fetch('/api/auth/config', { cache: 'no-store' })
        configData = await cfgRes.json()
      } catch {
        // continuar con selector integrado
      }

      // Si el proyecto Supabase de la barbería está pausado o no responde,
      // abrir el selector rápido de cuenta de Google integrado sin mostrar alertas de error ni redirigir a otro sitio
      if (!configData || !configData.configured || configData.reachable === false) {
        openFallbackAccountSelector()
        return
      }

      const supabase = await resolveSupabaseBrowserClient()
      if (!supabase) {
        openFallbackAccountSelector()
        return
      }

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })

      if (signInError) {
        openFallbackAccountSelector()
        return
      }

      if (data?.url) {
        window.location.assign(data.url)
      }
    } catch {
      openFallbackAccountSelector()
    }
  }, [openFallbackAccountSelector])

  const handleSignOut = useCallback(async () => {
    setLoading(true)
    setStoredGoogleProfile(null)
    setProfile(null)
    callbackRef.current?.(null)
    try {
      const supabase = await resolveSupabaseBrowserClient()
      if (supabase) {
        await supabase.auth.signOut()
      }
    } catch {
      // ignore
    }
    setLoading(false)
    router.refresh()
  }, [router])

  const accountSelectorModal = showAccountModal ? (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => setShowAccountModal(false)}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-zinc-900 border border-white/[0.12] p-6 sm:p-7 shadow-2xl space-y-5 text-left relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setShowAccountModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-md">
            <GoogleLogo className="w-6 h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white">
            Acceder con Google
          </h3>
          <p className="text-xs text-zinc-400">
            Continuar a <strong className="text-zinc-200">The Golden Blade Barber Club</strong>
          </p>
        </div>

        {savedCandidate && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
              Cuenta guardada en este dispositivo
            </span>
            <button
              type="button"
              onClick={() => handleModalSubmit(savedCandidate)}
              className="w-full p-3.5 rounded-2xl bg-zinc-950/80 hover:bg-violet-600/15 border border-white/[0.08] hover:border-violet-500/40 flex items-center justify-between gap-3 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {savedCandidate.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold text-white truncate">{savedCandidate.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{savedCandidate.email}</p>
                </div>
              </div>
              <Check className="w-4 h-4 text-violet-400 shrink-0" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleModalSubmit()
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Correo de Google (Gmail) *
            </label>
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={modalEmail}
              onChange={(e) => setModalEmail(e.target.value)}
              placeholder="tucorreo@gmail.com"
              className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-white/[0.1] focus:border-violet-500 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Tu Nombre y Apellido *
            </label>
            <input
              type="text"
              required
              autoComplete="name"
              value={modalName}
              onChange={(e) => setModalName(e.target.value)}
              placeholder="Ej. Lucas González"
              className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-white/[0.1] focus:border-violet-500 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="pt-1 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowAccountModal(false)}
              className="w-1/3 py-3 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-2/3 py-3 px-5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <GoogleLogo className="w-4 h-4" />
              <span>Continuar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null

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
      <>
        {accountSelectorModal}
        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          title="Iniciar sesión con Google"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GoogleLogo className="w-3.5 h-3.5" />}
          <span>Iniciar sesión con Google</span>
        </button>
      </>
    )
  }

  if (variant === 'login') {
    return (
      <div className="space-y-2.5">
        {accountSelectorModal}
        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm sm:text-base flex items-center justify-center gap-3 shadow-lg shadow-white/5 transition-all cursor-pointer disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleLogo className="w-5 h-5" />}
          <span>Iniciar sesión con Google</span>
        </button>
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
      {accountSelectorModal}
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleLogo className="w-4 h-4" />}
        <span>Iniciar sesión con Google para autocompletar</span>
      </button>
    </div>
  )
}
