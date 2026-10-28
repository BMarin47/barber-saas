import { NextResponse } from 'next/server'
import { createBooking, getBookings, SlotTakenError } from '@/lib/bookings'
import { calculateTotal, normalizePaymentMethod, isCashPayment, PAYMENT_METHOD_GPAY } from '@/lib/pricing'
import type { EmailSendResult } from '@/lib/email'
import { sendConfirmationForBooking } from '@/lib/notifications'
import { mockServices, mockTenant } from '@/data/mock-tenant'
import { generateTimeSlots } from '@/utils/generateTimeSlots'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  try {
    // 1. Proteger ruta privada: Verificar sesión de administrador válida
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado. Se requiere inicio de sesión de administrador.',
        },
        { status: 401 }
      )
    }

    // 2. Aislamiento multi-tenant: el admin sólo ve las reservas de SU barbería (tenant de la sesión);
    //    el tenantId de la query string se ignora para impedir lecturas cruzadas.
    const tenantParam = session.tenantId

    const bookings = await getBookings(tenantParam)
    return NextResponse.json({ success: true, bookings, tenantId: tenantParam })
  } catch (error) {
    console.error('Error en GET /api/bookings:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener las reservas' },
      { status: 500 }
    )
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      tenantId,
      serviceName,
      professionalName,
      date,
      time,
      clientName,
      clientPhone,
      clientEmail,
      clientNotes,
      paymentMethod,
    } = body

    if (!date || !time || !clientName || !clientPhone) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos para la reserva' },
        { status: 400 }
      )
    }

    if (!DATE_RE.test(String(date)) || !generateTimeSlots(String(date), true).includes(String(time))) {
      return NextResponse.json(
        { success: false, code: 'INVALID_SLOT', error: 'El horario elegido no es válido o ya venció' },
        { status: 400 }
      )
    }

    const cleanEmail = typeof clientEmail === 'string' ? clientEmail.trim() : ''
    if (cleanEmail && !EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'El correo electrónico no es válido' },
        { status: 400 }
      )
    }

    // El precio NUNCA se toma del navegador: se busca el servicio en el catálogo del servidor
    // y se recalcula el total.
    const service = mockServices.find((s) => s.name === serviceName)
    if (!service) {
      return NextResponse.json(
        { success: false, error: 'El servicio seleccionado no existe' },
        { status: 400 }
      )
    }
    const method = normalizePaymentMethod(paymentMethod)
    if (method === PAYMENT_METHOD_GPAY && !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'El pago con Google Pay no está disponible por el momento' },
        { status: 400 }
      )
    }
    const total = calculateTotal(service.price)
    const resolvedTenantId = tenantId?.trim() || mockTenant.id

    let booking
    try {
      booking = await createBooking({
        tenantId: resolvedTenantId,
        clientName: String(clientName).trim(),
        clientPhone: String(clientPhone).trim(),
        serviceName: service.name,
        professionalName: professionalName || undefined,
        date,
        time,
        totalPrice: total, // valor total (100%)
        paymentMethod: method,
        paymentStatus: 'PENDING',
        clientEmail: cleanEmail || undefined,
        clientNotes: clientNotes?.trim() || undefined,
        status: 'CONFIRMED',
      })
    } catch (err) {
      if (err instanceof SlotTakenError) {
        return NextResponse.json(
          { success: false, code: 'SLOT_TAKEN', error: err.message },
          { status: 409 }
        )
      }
      throw err
    }

    // Correos: sólo pago presencial se confirma de inmediato. En pagos online el correo sale
    // desde el webhook del procesador cuando el pago queda PAID + CONFIRMED.
    let emailNotification: EmailSendResult = { sent: false, customerSent: false, adminSent: false, errors: [] }
    if (isCashPayment(method)) {
      emailNotification = await sendConfirmationForBooking(booking, new URL(req.url).origin)
    }
    return NextResponse.json({
      success: true,
      booking,
      bookingId: booking.id,
      total,
      requiresOnlinePayment: !isCashPayment(method),
      emailNotification: { sent: emailNotification.sent, errors: emailNotification.errors },
      message: 'Reserva guardada correctamente en la base de datos',
    })
  } catch (error) {
    console.error('Error en POST /api/bookings:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar la reserva' },
      { status: 500 }
    )
  }
}