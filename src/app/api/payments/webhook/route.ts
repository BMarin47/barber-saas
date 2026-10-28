import { NextResponse } from 'next/server'
import { getPaymentDetails, verifyMercadoPagoSignature } from '@/lib/mercadopago'
import { updateBookingPayment, getBookingById } from '@/lib/bookings'

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const topic = searchParams.get('topic') || searchParams.get('type')
    // Mercado Pago firma el manifest con el data.id de la query string.
    const queryDataId = searchParams.get('data.id') || searchParams.get('id')

    let bodyData: any = {}
    try {
      bodyData = await req.json()
    } catch {
      // Mercado Pago a veces envía solo query parameters
    }

    const eventType = bodyData.type || bodyData.action || topic
    const paymentId = queryDataId || bodyData.data?.id

    // 1. Validar firma de seguridad si está configurado MP_WEBHOOK_SECRET
    const xSignature = req.headers.get('x-signature')
    const xRequestId = req.headers.get('x-request-id')

    if (process.env.MP_WEBHOOK_SECRET && paymentId) {
      const isValid = verifyMercadoPagoSignature(xSignature, xRequestId, String(paymentId))
      if (!isValid) {
        console.warn('Firma de webhook de Mercado Pago no válida o manipulada:', {
          xSignature,
          xRequestId,
          paymentId,
        })
        return NextResponse.json(
          { error: 'Firma de webhook inválida' },
          { status: 401 }
        )
      }
    } else if (!process.env.MP_WEBHOOK_SECRET) {
      console.warn('[MP Webhook] MP_WEBHOOK_SECRET no configurado: la firma no se está validando.')
    }

    // 2. Procesar eventos relacionados con pagos
    const isPaymentEvent =
      eventType === 'payment' ||
      eventType === 'payment.created' ||
      eventType === 'payment.updated' ||
      topic === 'payment'

    if (isPaymentEvent && paymentId) {
      // 3. Consultar a la API oficial de Mercado Pago para verificar la información genuina
      const paymentInfo = await getPaymentDetails(paymentId)

      if (paymentInfo) {
        const bookingId = paymentInfo.externalReference

        if (bookingId) {
          const booking = await getBookingById(bookingId)

          if (booking) {
            let newPaymentStatus = 'PENDING'
            let newBookingStatus = booking.status

            if (paymentInfo.status === 'approved') {
              // Validar que lo cobrado coincide con el total final (con descuento) de la reserva
              const expected = Number(booking.totalPrice || 0)
              const paid = Number(paymentInfo.transactionAmount || 0)
              if (expected > 0 && Math.abs(paid - expected) > 0.01) {
                console.error(
                  `[Mercado Pago Webhook] Monto inconsistente en turno ${bookingId}: esperado ${expected}, cobrado ${paid}. Revisar manualmente.`
                )
                return NextResponse.json({ received: true, warning: 'amount_mismatch' }, { status: 200 })
              }
              if (booking.status === 'CANCELLED') {
                // El turno fue cancelado y el horario pudo ser reasignado: no se reactiva.
                console.error(
                  `[Mercado Pago Webhook] Pago ${paymentInfo.id} aprobado para turno CANCELADO ${bookingId}. Requiere reembolso manual.`
                )
                await updateBookingPayment(bookingId, {
                  paymentStatus: 'PAID',
                  paymentId: String(paymentInfo.id),
                })
                return NextResponse.json({ received: true }, { status: 200 })
              }
              newPaymentStatus = 'PAID'
              newBookingStatus = 'CONFIRMED'
            } else if (paymentInfo.status === 'rejected') {
              newPaymentStatus = 'REJECTED'
              // Libera el horario para que otro cliente pueda reservarlo
              if (booking.paymentStatus !== 'PAID') newBookingStatus = 'CANCELLED'
            } else if (paymentInfo.status === 'in_process' || paymentInfo.status === 'pending') {
              newPaymentStatus = 'PENDING'
            } else if (paymentInfo.status === 'cancelled' || paymentInfo.status === 'refunded') {
              newPaymentStatus = 'CANCELLED'
              if (booking.paymentStatus !== 'PAID' || paymentInfo.status === 'refunded') {
                newBookingStatus = 'CANCELLED'
              }
            }

            // Idempotencia: un evento tardío no debe degradar un pago ya acreditado
            if (booking.paymentStatus === 'PAID' && newPaymentStatus === 'PENDING') {
              return NextResponse.json({ received: true }, { status: 200 })
            }

            await updateBookingPayment(bookingId, {
              paymentStatus: newPaymentStatus,
              paymentId: String(paymentInfo.id),
              status: newBookingStatus,
            })

            console.log(`[Mercado Pago Webhook] Turno ${bookingId} actualizado: pago=${newPaymentStatus}, status=${newBookingStatus}`)
          }
        }
      }
    }

    // Responder siempre HTTP 200 con prontitud a Mercado Pago para confirmar recepción
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error procesando webhook de Mercado Pago:', error)
    return NextResponse.json({ error: 'Error procesando notificación' }, { status: 500 })
  }
}

export async function GET() {
  // Verificación de disponibilidad de endpoint para webhooks
  return NextResponse.json({ status: 'Mercado Pago Webhook Endpoint Active' })
}
