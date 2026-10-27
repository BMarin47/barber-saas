import { NextResponse } from 'next/server'
import { createPreference } from '@/lib/mercadopago'
import { getBookingById, updateBookingPayment } from '@/lib/bookings'
import { PAYMENT_METHOD_MP } from '@/lib/pricing'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // El monto NO se toma del navegador: se usa el total final (con descuento) guardado en la reserva.
    const { bookingId, tenantSlug } = body

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos para generar el pago' },
        { status: 400 }
      )
    }

    // 1. La reserva debe existir y estar activa
    const existing = await getBookingById(bookingId)
    if (!existing || existing.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'La reserva no existe o fue cancelada' },
        { status: 404 }
      )
    }
    if (existing.paymentStatus === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Esta reserva ya fue abonada' },
        { status: 409 }
      )
    }
    if (existing.paymentMethod !== PAYMENT_METHOD_MP) {
      return NextResponse.json(
        { success: false, error: 'La reserva no fue creada para pagar con Mercado Pago' },
        { status: 400 }
      )
    }
    const finalPrice = Number(existing.totalPrice || 0)
    if (finalPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'La reserva no tiene un monto válido para cobrar' },
        { status: 400 }
      )
    }

    // 2. Generar preferencia en Mercado Pago con el monto final guardado en la base
    const result = await createPreference({
      bookingId,
      title: existing.serviceName || 'Corte de Pelo',
      price: finalPrice,
      clientName: existing.clientName || 'Cliente',
      clientPhone: existing.clientPhone || '',
      clientEmail: existing.clientEmail || undefined,
      tenantSlug: tenantSlug || 'golden-blade',
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        configured: result.configured,
        error: result.error,
      })
    }

    // 3. Guardar el ID de preferencia en la reserva
    if (result.preferenceId) {
      await updateBookingPayment(bookingId, {
        preferenceId: result.preferenceId,
        paymentStatus: 'PENDING',
      })
    }

    return NextResponse.json({
      success: true,
      preferenceId: result.preferenceId,
      initPoint: result.initPoint,
      sandboxInitPoint: result.sandboxInitPoint,
    })
  } catch (error: any) {
    console.error('Error en POST /api/payments/create-preference:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al procesar el pago' },
      { status: 500 }
    )
  }
}
