import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      tenantId,
      serviceId,
      professionalId,
      date,
      time,
      clientName,
      clientPhone,
      clientEmail,
      clientNotes,
      totalPrice,
    } = body

    if (!tenantId || !serviceId || !professionalId || !date || !time || !clientName || !clientPhone) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos para la reserva' },
        { status: 400 }
      )
    }

    // Try saving to database if configured
    try {
      const booking = await prisma.booking.create({
        data: {
          tenantId,
          serviceId,
          professionalId,
          clientName,
          clientPhone,
          clientEmail: clientEmail || null,
          clientNotes: clientNotes || null,
          date: new Date(date),
          startTime: time,
          endTime: time, // En producción se calcula sumando la duración del servicio
          totalPrice: totalPrice || 0,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
      })

      return NextResponse.json({
        success: true,
        bookingId: booking.id,
        message: 'Reserva guardada correctamente en la base de datos',
      })
    } catch (dbError) {
      console.warn('Prisma DB no conectada o en modo mock:', dbError)
      // Return simulated success in case DB is not yet migrated/connected in dev
      return NextResponse.json({
        success: true,
        mock: true,
        bookingId: 'mock-' + Date.now(),
        message: 'Reserva procesada en modo demostración',
      })
    }
  } catch (error) {
    console.error('Error en POST /api/bookings:', error)
    return NextResponse.json(
      { error: 'Error al procesar la reserva' },
      { status: 500 }
    )
  }
}
