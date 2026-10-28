import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getBookingById, updateBookingPayment } from '@/lib/bookings'
import { getMercadoPagoAccessToken } from '@/lib/mercadopago'
import { PAYMENT_METHOD_MP } from '@/lib/pricing'

/**
 * Procesa el pago enviado por el Payment Brick.
 * El monto, la referencia y la URL de notificación los define el servidor:
 * nunca se confía en el monto que llega del navegador.
 */
export async function POST(req: Request) {
  try {
    const accessToken = getMercadoPagoAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Mercado Pago no está configurado.' },
        { status: 503 }
      )
    }

    const { bookingId, formData } = await req.json()
    if (!bookingId || !formData || typeof formData !== 'object') {
      return NextResponse.json({ success: false, error: 'Datos de pago incompletos' }, { status: 400 })
    }

    const booking = await getBookingById(bookingId)
    if (!booking || booking.status === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'La reserva no existe o fue cancelada' }, { status: 404 })
    }
    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json({ success: false, error: 'Esta reserva ya fue abonada' }, { status: 409 })
    }
    if (booking.paymentMethod !== PAYMENT_METHOD_MP) {
      return NextResponse.json(
        { success: false, error: 'La reserva no fue creada para pagar online' },
        { status: 400 }
      )
    }
    const amount = Number(booking.totalPrice || 0)
    if (amount <= 0) {
      return NextResponse.json({ success: false, error: 'Monto inválido para cobrar' }, { status: 400 })
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, '')

    const body = {
      token: formData.token,
      issuer_id: formData.issuer_id,
      payment_method_id: formData.payment_method_id,
      installments: formData.installments,
      payer: {
        email: formData.payer?.email || booking.clientEmail || 'cliente@barbersaas.com',
        identification: formData.payer?.identification,
      },
      transaction_amount: amount,
      description: booking.serviceName || 'Servicio de Barbería',
      external_reference: bookingId,
      statement_descriptor: 'BARBERSAAS',
      notification_url: `${appUrl}/api/payments/webhook`,
    }

    const res = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        // Evita cobros duplicados ante reintentos del mismo intento de pago
        'X-Idempotency-Key': crypto
          .createHash('sha256')
          .update(`${bookingId}:${formData.token || formData.payment_method_id}`)
          .digest('hex'),
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()

    if (!res.ok) {
      console.error('[MP Process] Error al crear el pago:', data)
      return NextResponse.json(
        { success: false, error: data.message || 'Mercado Pago rechazó la operación' },
        { status: 502 }
      )
    }

    // Misma regla que el webhook; el webhook queda como respaldo idempotente.
    if (data.status === 'approved') {
      await updateBookingPayment(bookingId, {
        paymentStatus: 'PAID',
        paymentId: String(data.id),
        status: 'CONFIRMED',
      })
    } else if (data.status === 'in_process' || data.status === 'pending') {
      await updateBookingPayment(bookingId, { paymentStatus: 'PENDING', paymentId: String(data.id) })
    }
    // Si fue rechazado no se cancela la reserva: el cliente puede reintentar con otra tarjeta.

    return NextResponse.json({
      success: true,
      status: data.status,
      statusDetail: data.status_detail,
      paymentId: data.id,
    })
  } catch (error) {
    console.error('Error en POST /api/payments/process:', error)
    return NextResponse.json({ success: false, error: 'Error interno al procesar el pago' }, { status: 500 })
  }
}
