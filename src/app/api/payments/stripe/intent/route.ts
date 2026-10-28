import { NextResponse } from 'next/server'
import { getBookingById, updateBookingPayment } from '@/lib/bookings'
import { PAYMENT_METHOD_GPAY } from '@/lib/pricing'
import { getStripe, STRIPE_CURRENCY, toStripeAmount } from '@/lib/stripe'

/**
 * Crea el PaymentIntent de Stripe para una reserva con Google Pay.
 * El monto sale de la reserva guardada, nunca del navegador.
 */
export async function POST(req: Request) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ success: false, error: 'Stripe no está configurado.' }, { status: 503 })
    }

    const { bookingId } = await req.json()
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Falta la reserva' }, { status: 400 })
    }

    const booking = await getBookingById(bookingId)
    if (!booking || booking.status === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'La reserva no existe o fue cancelada' }, { status: 404 })
    }
    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json({ success: false, error: 'Esta reserva ya fue abonada' }, { status: 409 })
    }
    if (booking.paymentMethod !== PAYMENT_METHOD_GPAY) {
      return NextResponse.json(
        { success: false, error: 'La reserva no fue creada para pagar con Google Pay' },
        { status: 400 }
      )
    }
    const total = Number(booking.totalPrice || 0)
    if (total <= 0) {
      return NextResponse.json({ success: false, error: 'Monto inválido para cobrar' }, { status: 400 })
    }

    const intent = await stripe.paymentIntents.create({
      amount: toStripeAmount(total),
      currency: STRIPE_CURRENCY,
      automatic_payment_methods: { enabled: true },
      description: `${booking.serviceName} - ${booking.clientName}`,
      metadata: { bookingId },
      ...(booking.clientEmail ? { receipt_email: booking.clientEmail } : {}),
    })

    await updateBookingPayment(bookingId, { paymentStatus: 'PENDING', paymentId: intent.id })

    return NextResponse.json({ success: true, clientSecret: intent.client_secret })
  } catch (error) {
    console.error('Error en POST /api/payments/stripe/intent:', error)
    return NextResponse.json({ success: false, error: 'No se pudo iniciar el pago' }, { status: 500 })
  }
}
