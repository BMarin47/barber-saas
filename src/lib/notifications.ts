import { sendBookingConfirmationEmails, type EmailSendResult } from '@/lib/email'
import { mockTenant } from '@/data/mock-tenant'
import type { BookingData } from '@/lib/bookings'

/**
 * Envía los correos de confirmación (cliente + dueño) de una reserva.
 * Nunca lanza: un fallo de Resend no debe revertir la reserva ni el pago.
 */
export async function sendConfirmationForBooking(
  booking: BookingData,
  origin: string
): Promise<EmailSendResult> {
  const empty: EmailSendResult = { sent: false, customerSent: false, adminSent: false, errors: [] }
  try {
    const base = (process.env.NEXT_PUBLIC_APP_URL || origin).replace(/\/$/, '')
    return await sendBookingConfirmationEmails({
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
      paymentMethod: booking.paymentMethod || '',
      amount: Number(booking.totalPrice || 0),
      notes: booking.clientNotes,
      cancelUrl: `${base}/cancelar/${booking.id}`,
    })
  } catch (err) {
    console.error('Error enviando correos de confirmación:', err)
    empty.errors.push(err instanceof Error ? err.message : String(err))
    return empty
  }
}
