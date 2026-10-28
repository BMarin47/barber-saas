import { NextResponse } from 'next/server'
import { createBooking, getBookings, SlotTakenError } from '@/lib/bookings'
import { calculateTotal, normalizePaymentMethod, PAYMENT_METHOD_MP } from '@/lib/pricing'
import { sendBookingConfirmationEmails, type EmailSendResult } from '@/lib/email'
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

    // Correos: aislados con try/catch, un fallo de Resend nunca revierte la reserva.
    let emailNotification: EmailSendResult = { sent: false, customerSent: false, adminSent: false, errors: [] }
    try {
      const origin = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, '')
      emailNotification = await sendBookingConfirmationEmails({
        bookingId: booking.id as string,
        tenantName: mockTenant.name,
        tenantAddress: mockTenant.address,
        clientName: booking.clientName,
        clientPhone: booking.clientPhone,
        clientEmail: booking.clientEmail,
        serviceName: booking.serviceName,
        professionalName: booking.professionalName || '',
        date: booking.date,
        time: booking.time,
        paymentMethod: method,
        amount: total,
        notes: booking.clientNotes,
        cancelUrl: `${origin}/cancelar/${booking.id}`,
      })
    } catch (emailErr) {
      console.error('Error enviando correos de confirmación:', emailErr)
      emailNotification.errors.push(emailErr instanceof Error ? emailErr.message : String(emailErr))
    }

    return NextResponse.json({
      success: true,
      booking,
      bookingId: booking.id,
      total,
      requiresOnlinePayment: method === PAYMENT_METHOD_MP,
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