'use client'

import React, { useEffect, useState } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import { Loader2, Shield } from 'lucide-react'

interface PaymentBrickPanelProps {
  bookingId: string
  amount: number
  publicKey: string
  preferenceId?: string | null
  payerEmail?: string
  onPaid: () => void
  /** Pago pendiente de acreditación (in_process / pending). */
  onPending: () => void
}

/** Payment Brick embebido de Mercado Pago (tarjetas y dinero en cuenta). */
export const PaymentBrickPanel: React.FC<PaymentBrickPanelProps> = ({
  bookingId,
  amount,
  publicKey,
  preferenceId,
  payerEmail,
  onPaid,
  onPending,
}) => {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    initMercadoPago(publicKey, { locale: 'es-AR' })
  }, [publicKey])

  return (
    <div className="rounded-3xl bg-zinc-900/30 border border-white/[0.08] p-5 sm:p-6 backdrop-blur-xl space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Pagá tu turno online</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Tu horario ya está reservado. Completá el pago para finalizar.
        </p>
      </div>

      {!ready && (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando medios de pago...
        </div>
      )}

      <div className="rounded-2xl bg-white p-2">
        <Payment
          initialization={{
            amount,
            ...(preferenceId ? { preferenceId } : {}),
            ...(payerEmail ? { payer: { email: payerEmail } } : {}),
          }}
          customization={{
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all',
              ...(preferenceId ? { mercadoPago: 'all' as const } : {}),
            },
          }}
          onReady={() => setReady(true)}
          onError={(err) => {
            console.error('Payment Brick error:', err)
            setError('No se pudo cargar el formulario de pago. Intentá nuevamente.')
          }}
          onSubmit={async ({ formData }) => {
            setError('')
            try {
              const res = await fetch('/api/payments/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, formData }),
              })
              const data = await res.json().catch(() => ({}))
              if (!res.ok || !data.success) {
                throw new Error(data.error || 'No se pudo procesar el pago')
              }
              if (data.status === 'approved') {
                onPaid()
              } else if (data.status === 'in_process' || data.status === 'pending') {
                onPending()
              } else {
                const msg = 'El pago fue rechazado. Probá con otro medio de pago.'
                setError(msg)
                throw new Error(msg)
              }
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Error al procesar el pago')
              throw e
            }
          }}
        />
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Shield className="w-4 h-4 text-violet-400 shrink-0" />
        <span>Pago seguro procesado por Mercado Pago.</span>
      </div>
    </div>
  )
}
