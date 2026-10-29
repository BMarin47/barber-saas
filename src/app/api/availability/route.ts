import { NextResponse } from 'next/server'
import { getBookedTimes } from '@/lib/bookings'
import { mockTenant } from '@/data/mock-tenant'

export const dynamic = 'force-dynamic'

/**
 * GET /api/availability?date=YYYY-MM-DD&tenantId=<id>
 * Devuelve sólo los horarios ocupados (sin datos personales) para pintar "Ya ocupado".
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ success: false, error: 'Fecha inválida' }, { status: 400 })
    }
    const tenantId = searchParams.get('tenantId') || mockTenant.id

    const bookedTimes = await getBookedTimes(tenantId, date)
    return NextResponse.json(
      { success: true, bookedTimes },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Error en GET /api/availability:', error)
    return NextResponse.json(
      { success: false, error: 'No se pudo consultar la disponibilidad' },
      { status: 500 }
    )
  }
}
