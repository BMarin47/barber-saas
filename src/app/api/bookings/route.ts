import { NextResponse } from 'next/server'
import { createBooking, getBookings } from '@/lib/bookings'

export async function GET() {
  try {
    const bookings = await getBookings()
    return NextResponse.json({ success: true, bookings })
  } catch (error) {
    console.error('Error en GET /api/bookings:', error)
    return NextResponse.json(
      { error: 'Error al obtener las reservas' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      serviceName,
      professionalName,
      date,
      time,
      clientName,
      clientPhone,
      clientEmail,
      clientNotes,
      totalPrice,
      paymentMethod,
    } = body

    if (!date || !time || !clientName || !clientPhone) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos para la reserva' },
        { status: 400 }
      )
    }

    const booking = await createBooking({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      serviceName: serviceName || 'Corte de Pelo',
      professionalName: professionalName || 'Facundo "El Maestro" Rossi',
      date,
      time,
      totalPrice: totalPrice ? Number(totalPrice) : 0,
      paymentMethod: paymentMethod || 'Efectivo / Transferencia en el local',
      clientEmail: clientEmail?.trim() || undefined,
      clientNotes: clientNotes?.trim() || undefined,
      status: 'CONFIRMED',
    })

    return NextResponse.json({
      success: true,
      booking,
      bookingId: booking.id,
      message: 'Reserva guardada correctamente en la base de datos',
    })
  } catch (error) {
    console.error('Error en POST /api/bookings:', error)
    return NextResponse.json(
      { error: 'Error al procesar la reserva' },
      { status: 500 }
    )
  }
}
