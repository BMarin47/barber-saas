'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scissors,
  Calendar,
  Clock,
  User,
  Phone,
  Search,
  Lock,
  LogOut,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  QrCode,
  DollarSign,
  CalendarDays,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'

interface Booking {
  id: string
  clientName: string
  clientPhone: string
  serviceName: string
  professionalName?: string
  date: string
  time: string
  status: string
  totalPrice?: number
  paymentMethod?: string
  clientNotes?: string
  createdAt?: string
}

const AUTH_STORAGE_KEY = 'barber_admin_authenticated'

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [passwordInput, setPasswordInput] = useState<string>('')
  const [authError, setAuthError] = useState<string>('')
  const [authLoading, setAuthLoading] = useState<boolean>(false)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'all' | 'cancelled'>('today')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Check initial authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = sessionStorage.getItem(AUTH_STORAGE_KEY)
      if (savedAuth === 'true') {
        setIsAuthenticated(true)
      }
    }
  }, [])

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/bookings')
      const data = await res.json()
      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings)
      }
    } catch (err) {
      console.error('Error fetching bookings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings()
    }
  }, [isAuthenticated, fetchBookings])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      })
      const data = await res.json()

      if (data.success) {
        setIsAuthenticated(true)
        sessionStorage.setItem(AUTH_STORAGE_KEY, 'true')
      } else {
        setAuthError(data.error || 'Contraseña incorrecta')
      }
    } catch (err) {
      console.error(err)
      setAuthError('Error de conexión al verificar contraseña')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    setPasswordInput('')
  }

  const handleCancelBooking = async (id: string) => {
    if (!confirm('¿Seguro que deseas cancelar este turno? El horario quedará liberado.')) {
      return
    }

    try {
      setActionLoadingId(id)
      const res = await fetch(`/api/bookings/${id}`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' } : b))
        )
      } else {
        alert(data.error || 'Error al cancelar turno')
      }
    } catch (err) {
      console.error(err)
      alert('Error de conexión al cancelar')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCopyCancelLink = (id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://barber-saas-nu.vercel.app'
    const url = `${origin}/cancelar/${id}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Tab filter
      if (activeTab === 'today') {
        if (b.date !== todayStr) return false
      } else if (activeTab === 'upcoming') {
        if (b.date <= todayStr || b.status === 'CANCELLED') return false
      } else if (activeTab === 'cancelled') {
        if (b.status !== 'CANCELLED' && b.status !== 'Cancelado') return false
      }

      // Search query filter
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        b.clientName.toLowerCase().includes(q) ||
        b.clientPhone.toLowerCase().includes(q) ||
        b.serviceName.toLowerCase().includes(q) ||
        (b.professionalName && b.professionalName.toLowerCase().includes(q))
      )
    })
  }, [bookings, activeTab, todayStr, searchQuery])

  // KPIs
  const stats = useMemo(() => {
    const todayBookings = bookings.filter((b) => b.date === todayStr)
    const todayConfirmed = todayBookings.filter((b) => b.status !== 'CANCELLED' && b.status !== 'Cancelado')
    const todayRevenue = todayConfirmed.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    const totalCancelled = bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'Cancelado').length

    return {
      todayCount: todayConfirmed.length,
      todayRevenue,
      totalCount: bookings.length,
      cancelledCount: totalCancelled,
    }
  }, [bookings, todayStr])

  // ==========================================
  // PANTALLA DE LOGIN PROTEGIDA (ADMIN_PASS)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-violet-600/15 to-transparent blur-[120px] pointer-events-none" />

        <div className="w-full max-w-sm">
          <div className="rounded-3xl bg-zinc-900/50 border border-white/[0.08] p-8 backdrop-blur-2xl shadow-2xl relative space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Panel de Administración
              </h1>
              <p className="text-xs text-zinc-400">
                Ingresa tu contraseña de administrador para gestionar los turnos
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Contraseña de Acceso
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Contraseña (ej. admin123)"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950/70 border border-white/[0.08] focus:border-violet-500 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                  />
                </div>
                {authError && (
                  <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{authError}</span>
                  </p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={authLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {authLoading ? (
                  <span>Verificando...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Ingresar al Panel</span>
                  </>
                )}
              </motion.button>

              <div className="pt-2 text-center">
                <Link
                  href="/"
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  ← Volver a la App Principal
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    )
  }

  // ==========================================
  // DASHBOARD PRINCIPAL TECH MINIMALIST
  // ==========================================
  return (
    <main className="min-h-screen bg-black text-zinc-100 flex flex-col relative overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-violet-600/10 via-indigo-600/5 to-transparent blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <nav className="border-b border-white/[0.08] bg-black/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-600/20">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">BarberSaaS</span>
                <span className="text-[10px] font-semibold text-violet-400 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                  Panel Admin
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">The Golden Blade Barber Club</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/qr"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Generar QR</span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver App</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 flex-1">
        {/* Dashboard Title & Realtime Reload */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Agenda de Turnos</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Supervisa y gestiona los turnos en tiempo real con actualización instantánea.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchBookings}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-violet-400' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* KPI Metrics Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl bg-zinc-900/40 border border-white/[0.08] p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-medium">Turnos de Hoy</span>
              <CalendarDays className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.todayCount}</div>
            <span className="text-[11px] text-zinc-500">Agendados para hoy</span>
          </div>

          <div className="rounded-2xl bg-zinc-900/40 border border-white/[0.08] p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-medium">Facturación Estimada Hoy</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">
              ${stats.todayRevenue.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-emerald-400/80">Turnos confirmados</span>
          </div>

          <div className="rounded-2xl bg-zinc-900/40 border border-white/[0.08] p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-medium">Total de Reservas</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.totalCount}</div>
            <span className="text-[11px] text-zinc-500">Historial completo</span>
          </div>

          <div className="rounded-2xl bg-zinc-900/40 border border-white/[0.08] p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-medium">Turnos Cancelados</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.cancelledCount}</div>
            <span className="text-[11px] text-rose-400/80">Horarios liberados</span>
          </div>
        </div>

        {/* Controls: Search & Filter Tabs */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900/70 border border-white/[0.08] overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'today'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Agenda de Hoy ({bookings.filter((b) => b.date === todayStr && b.status !== 'CANCELLED').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'upcoming'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Próximos Días
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos ({bookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cancelled')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'cancelled'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cancelados ({stats.cancelledCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente, teléfono o servicio..."
              className="w-full px-3.5 py-2 pl-9 rounded-xl bg-zinc-900/60 border border-white/[0.08] focus:border-violet-500 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Bookings Agenda List */}
        <div className="rounded-3xl bg-zinc-900/30 border border-white/[0.08] overflow-hidden backdrop-blur-xl shadow-xl">
          {loading ? (
            <div className="py-16 text-center text-zinc-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-violet-400" />
              <p className="text-xs">Cargando agenda de turnos...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No hay turnos en esta vista</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {searchQuery
                  ? 'No se encontraron reservas que coincidan con la búsqueda.'
                  : activeTab === 'today'
                  ? 'Aún no hay turnos agendados para el día de hoy.'
                  : 'No hay reservas registradas en esta categoría.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filteredBookings.map((b) => {
                const isCancelled = b.status === 'CANCELLED' || b.status === 'Cancelado'
                const cleanPhone = b.clientPhone.replace(/\D/g, '')

                return (
                  <div
                    key={b.id}
                    className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                      isCancelled ? 'bg-rose-950/10 opacity-75' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Left: Time & Client Details */}
                    <div className="flex items-start gap-3.5">
                      {/* Time Badge */}
                      <div
                        className={`w-14 sm:w-16 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border font-mono ${
                          isCancelled
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : 'bg-violet-600/15 border-violet-500/30 text-violet-300'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-black">{b.time}</span>
                        <span className="text-[10px] text-zinc-400 font-sans">hs</span>
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-bold text-white">
                            {b.clientName}
                          </h4>

                          {/* Status Badge */}
                          {isCancelled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <XCircle className="w-3 h-3" /> Cancelado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Confirmado
                            </span>
                          )}

                          {b.date !== todayStr && (
                            <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-md">
                              📅 {b.date}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                          <span className="font-semibold text-zinc-200">
                            ✂️ {b.serviceName}
                          </span>
                          <span>•</span>
                          <span>💈 {b.professionalName || 'Facundo "El Maestro" Rossi'}</span>
                          {b.totalPrice ? (
                            <>
                              <span>•</span>
                              <span className="font-bold text-emerald-400">
                                ${b.totalPrice.toLocaleString('es-AR')}
                              </span>
                            </>
                          ) : null}
                        </div>

                        {b.clientNotes && (
                          <p className="text-[11px] text-zinc-500 italic">
                            💬 &ldquo;{b.clientNotes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {/* WhatsApp Link */}
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        title="Contactar al cliente por WhatsApp"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>

                      {/* Copy Cancel Link */}
                      <button
                        type="button"
                        onClick={() => handleCopyCancelLink(b.id)}
                        className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Copiar link de cancelación para este cliente"
                      >
                        {copiedId === b.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="hidden sm:inline text-emerald-400">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Link Cancelar</span>
                          </>
                        )}
                      </button>

                      {/* Cancel Action */}
                      {!isCancelled && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(b.id)}
                          disabled={actionLoadingId === b.id}
                          className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Cancelar Turno</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
