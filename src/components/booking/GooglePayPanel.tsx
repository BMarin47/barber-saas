'use client'

import React, { useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, ExpressCheckoutElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { Shield } from 'lucide-react'

interface GooglePayPanelProps {
  bookingId: string
  /** Total en pesos (se multiplica por 100 para Stripe). */
  amount: number
  publishableKey: string
  onPaid: () => void
}

function GooglePayButton({ bookingId, onPaid }: Pick<GooglePayPanelProps, 'bookingId' | 'onPaid'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState(false)

  return (
    <div className="space-y-3">
      <ExpressCheckoutElement
        options={{
          paymentMethods: { googlePay: 'always', applePay: 'never', link: 'never', paypal: 'never', amazonPay: 'never' },
          buttonType: { googlePay: 'pay' },
          buttonHeight: 48,
        }}
        onReady={({ availablePaymentMethods }) => {
          setUnavailable(!availablePaymentMethods?.googlePay)
        }}
        onConfirm={async () => {
          if (!stripe || !elements) return
          setError('')
          const { error: submitError } = await elements.submit()
          if (submitError) {
            setError(submitError.message || 'No se pudo validar el pago')
            return
          }
          const res = await fetch('/api/payments/stripe/intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok || !data.clientSecret) {
            setError(data.error || 'No se pudo iniciar el pago')
            return
          }
          const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
            elements,
            clientSecret: data.clientSecret,
            confirmParams: { return_url: window.location.href },
            redirect: 'if_required',
          })
          if (confirmError) {
            setError(confirmError.message || 'El pago fue rechazado')
            return
          }
          if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') onPaid()
        }}
      />
      {unavailable && (
        <p className="text-xs text-amber-300">
          Google Pay no está disponible en este navegador o dispositivo (necesitás Chrome con una tarjeta guardada en
          Google). Podés volver y elegir otro medio de pago.
        </p>
      )}
      {error && (
        <div role="alert" className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
          {error}
        </div>
      )}
    </div>
  )
}

/** Botón nativo de Google Pay (Stripe Express Checkout Element). */
export const GooglePayPanel: React.FC<GooglePayPanelProps> = ({ bookingId, amount, publishableKey, onPaid }) => {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey])

  return (
    <div className="rounded-3xl bg-zinc-900/30 border border-white/[0.08] p-5 sm:p-6 backdrop-blur-xl space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Pagá tu turno con Google Pay</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Tu horario ya está reservado. Recibirás la confirmación por correo cuando el pago se acredite.
        </p>
      </div>
      <Elements
        stripe={stripePromise}
        options={{ mode: 'payment', amount: Math.round(amount * 100), currency: 'ars', locale: 'es' }}
      >
        <GooglePayButton bookingId={bookingId} onPaid={onPaid} />
      </Elements>
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Shield className="w-4 h-4 text-violet-400 shrink-0" />
        <span>Pago seguro procesado por Stripe.</span>
      </div>
    </div>
  )
}
