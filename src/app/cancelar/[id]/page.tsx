'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Scissors,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react'

interface BookingInfo {
  id: string
  clientName: string
  clientPhone: string
  serviceName: string
  professionalName?: string
  date: string
  time: string
  status: string
  totalPrice?: number
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CancelarTurnoPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [cancelling, setCancelling] = useState<boolean>(false)
  const [cancelled, setCancelled] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBooking() {
      try {
        setLoading(true)
        const res = await fetch(`/api/bookings/${id}`)
        const data = await res.json()
        if (data.success && data.booking) {
          setBooking(data.booking)
          if (data.booking.status === 'CANCELLED' || data.booking.status === 'Cancelado') {
            setCancelled(true)
          }
        } else {
          setError(data.error || 'Turno no encontrado')
        }
      } catch (err) {
        console.error(err)
        setError('Error al consultar el turno')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchBooking()
    }
  }, [id])

  const handleCancelBooking = async () => {
    setCancelling(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setCancelled(true)
        if (booking) {
          setBooking({ ...booking, status: 'CANCELLED' })
        }
      } else {
        setError(data.error || 'No se pudo cancelar el turno')
      }
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error al intentar cancelar')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-rose-600/10 via-violet-600/5 to-transparent blur-[120px] pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 text-zinc-300 hover:text-white transition-colors">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">BarberSaaS</span>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-zinc-900/40 border border-white/[0.08] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              <p className="text-sm text-zinc-400">Buscando información de tu turno...</p>
            </div>
          ) : error && !booking ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <XCircle className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">Turno no encontrado</h2>
              <p className="text-sm text-zinc-400">
                El enlace de cancelación puede ser incorrecto o el turno ya no existe en el sistema.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
              </Link>
            </div>
          ) : cancelled ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-5 py-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-2">
                  Estado: Cancelado
                </span>
                <h2 className="text-2xl font-bold text-white">¡Turno Cancelado con Éxito!</h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-xs mx-auto">
                  Tu horario ha sido liberado en el sistema para que otro cliente pueda utilizarlo.
                </p>
              </div>

              {booking && (
                <div className="bg-zinc-950/60 rounded-2xl p-4 border border-white/[0.06] text-left text-xs space-y-2">
                  <div className="flex justify-between text-zinc-400">
                    <span>Cliente:</span>
                    <strong className="text-zinc-200">{booking.clientName}</strong>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Servicio:</span>
                    <strong className="text-zinc-200">{booking.serviceName}</strong>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Fecha y hora:</span>
                    <strong className="text-zinc-200">{booking.date} • {booking.time} hs</strong>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/"
                  className="w-full py-3.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/25"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Reservar un nuevo turno</span>
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">¿Deseas cancelar tu turno?</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Esta acción liberará tu lugar en la agenda inmediatamente.
                </p>
              </div>

              {/* Booking Card */}
              {booking && (
                <div className="rounded-2xl bg-zinc-950/60 border border-white/[0.06] p-4 space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-violet-400" />
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Cliente</span>
                      <strong className="text-zinc-200">{booking.clientName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-white/[0.04]">
                    <Scissors className="w-4 h-4 text-violet-400" />
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Servicio</span>
                      <strong className="text-zinc-200">{booking.serviceName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-white/[0.04]">
                    <Clock className="w-4 h-4 text-violet-400" />
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Fecha & Horario</span>
                      <strong className="text-zinc-200">{booking.date} a las {booking.time} hs</strong>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <motion.button
                  type="button"
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Cancelando turno...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      <span>Cancelar mi turno</span>
                    </>
                  )}
                </motion.button>

                <Link
                  href="/"
                  className="w-full py-3 px-4 rounded-xl bg-transparent hover:bg-white/[0.04] text-zinc-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>No, mantener mi turno</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
