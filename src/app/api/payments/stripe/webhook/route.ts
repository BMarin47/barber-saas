import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getBookingById, updateBookingPayment } from '@/lib/bookings'
import { sendConfirmationForBooking } from '@/lib/notifications'
import { getStripe, STRIPE_CURRENCY, toStripeAmount } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!stripe || !secret) {
    console.error('[Stripe Webhook] STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET no configurados.')
    return NextResponse.json({ error: 'Webhook no configurado' }, { status: 503 })
  }

  // La firma se valida sobre el cuerpo crudo, sin parsear.
  const signature = req.headers.get('stripe-signature')
  const rawBody = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature || '', secret)
  } catch (err) {
    console.warn('[Stripe Webhook] Firma inválida:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent
      const bookingId = intent.metadata?.bookingId
      const booking = bookingId ? await getBookingById(bookingId) : null
      if (!booking || !bookingId) return NextResponse.json({ received: true })

      // Idempotencia: Stripe puede reenviar el evento
      if (booking.paymentStatus === 'PAID') return NextResponse.json({ received: true })

      const expected = toStripeAmount(Number(booking.totalPrice || 0))
      if (
        intent.currency !== STRIPE_CURRENCY ||
        intent.amount_received !== expected ||
        expected <= 0
      ) {
        console.error(
          `[Stripe Webhook] Monto inconsistente en turno ${bookingId}: esperado ${expected} ${STRIPE_CURRENCY}, cobrado ${intent.amount_received} ${intent.currency}. Revisar manualmente.`
        )
        return NextResponse.json({ received: true, warning: 'amount_mismatch' })
      }

      if (booking.status === 'CANCELLED') {
        console.error(`[Stripe Webhook] Pago ${intent.id} para turno CANCELADO ${bookingId}. Requiere reembolso manual.`)
        await updateBookingPayment(bookingId, { paymentStatus: 'PAID', paymentId: intent.id })
        return NextResponse.json({ received: true })
      }

      const updated = await updateBookingPayment(bookingId, {
        paymentStatus: 'PAID',
        paymentId: intent.id,
        status: 'CONFIRMED',
      })

      // Recién ahora (PAID + CONFIRMED) se envía el correo al cliente.
      await sendConfirmationForBooking(updated ?? { ...booking, paymentStatus: 'PAID', status: 'CONFIRMED' }, new URL(req.url).origin)
      console.log(`[Stripe Webhook] Turno ${bookingId} pagado y confirmado.`)
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent
      const bookingId = intent.metadata?.bookingId
      const booking = bookingId ? await getBookingById(bookingId) : null
      // No se cancela la reserva: el cliente puede reintentar.
      if (booking && bookingId && booking.paymentStatus !== 'PAID') {
        await updateBookingPayment(bookingId, { paymentStatus: 'REJECTED', paymentId: intent.id })
      }
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook] Error procesando evento:', error)
    return NextResponse.json({ error: 'Error procesando evento' }, { status: 500 })
  }
}
