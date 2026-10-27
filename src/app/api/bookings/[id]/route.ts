import { NextResponse } from 'next/server'
import { getBookingById, cancelBooking } from '@/lib/bookings'

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: RouteProps) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Identificador de reserva no proporcionado' },
        { status: 400 }
      )
    }

    const booking = await getBookingById(id)

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error('Error en GET /api/bookings/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error al buscar la reserva' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request, { params }: RouteProps) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Identificador de reserva no proporcionado' },
        { status: 400 }
      )
    }

    const updated = await cancelBooking(id)

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'No se pudo cancelar el turno o no existe' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Turno cancelado correctamente. El horario ha sido liberado.',
      booking: updated,
    })
  } catch (error) {
    console.error('Error en POST /api/bookings/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error al cancelar la reserva' },
      { status: 500 }
    )
  }
}
