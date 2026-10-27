import { randomUUID } from 'crypto'
import prisma from '@/lib/prisma'
import { mockProfessionals } from '@/data/mock-tenant'
import { PAYMENT_METHOD_CASH } from '@/lib/pricing'

export interface BookingData {
  id?: string
  tenantId?: string
  clientName: string
  clientPhone: string
  serviceName: string
  professionalName?: string | null
  date: string
  time: string
  status?: string
  totalPrice?: number | null
  paymentMethod?: string | null
  paymentStatus?: string
  paymentId?: string | null
  preferenceId?: string | null
  clientEmail?: string | null
  clientNotes?: string | null
  createdAt?: string | Date
  updatedAt?: string | Date
}

// Fallback en memoria en caso de entorno serverless con filesystem de sólo lectura
declare const globalThis: {
  __memoryBookings?: BookingData[]
} & typeof global

const initialSampleBookings: BookingData[] = [
  {
    id: 'sample-1',
    tenantId: 'tenant-golden-blade',
    clientName: 'Lucas González',
    clientPhone: '5492604654255',
    serviceName: 'Corte y Barba',
    professionalName: 'Facundo "El Maestro" Rossi',
    date: new Date().toISOString().split('T')[0],
    time: '16:00',
    status: 'CONFIRMED',
    totalPrice: 18000,
    paymentMethod: 'Efectivo / Transferencia en el local',
    paymentStatus: 'PENDING',
    clientNotes: 'Degradé medio y toalla caliente',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'sample-2',
    tenantId: 'tenant-golden-blade',
    clientName: 'Martín Morales',
    clientPhone: '5492604889911',
    serviceName: 'Corte de Pelo',
    professionalName: 'Mateo "Fade King" Benítez',
    date: new Date().toISOString().split('T')[0],
    time: '17:30',
    status: 'CONFIRMED',
    totalPrice: 15000,
    paymentMethod: 'Mercado Pago',
    paymentStatus: 'PAID',
    paymentId: 'mp_pay_9823412',
    clientNotes: 'Skin fade al ras',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

if (!globalThis.__memoryBookings) {
  globalThis.__memoryBookings = [...initialSampleBookings]
}

export const ANY_PROFESSIONAL_NAME = 'Cualquier Profesional'

/** Se lanza cuando el horario ya tiene una reserva activa (cupo = 1 por barbero). */
export class SlotTakenError extends Error {
  constructor(message = 'Ese horario ya fue reservado. Por favor elegí otro.') {
    super(message)
    this.name = 'SlotTakenError'
  }
}

/** Barberos reales (excluye la opción comodín "Cualquier Profesional"). */
const REAL_PROFESSIONAL_NAMES = mockProfessionals
  .filter((p) => p.name !== ANY_PROFESSIONAL_NAME)
  .map((p) => p.name)

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  )
}

/**
 * Reservas activas (no canceladas) de un día. La memoria sólo se usa si la base de datos
 * no responde, para que los datos de demo nunca bloqueen horarios reales.
 */
async function getActiveBookingsForDate(
  tenantId: string,
  date: string
): Promise<Pick<BookingData, 'professionalName' | 'time'>[]> {
  try {
    return await prisma.booking.findMany({
      where: { tenantId, date, status: { not: 'CANCELLED' } },
      select: { professionalName: true, time: true },
    })
  } catch (error) {
    console.warn('Prisma getActiveBookingsForDate fallback a memoria:', error)
    return (globalThis.__memoryBookings || []).filter(
      (b) => b.tenantId === tenantId && b.date === date && b.status !== 'CANCELLED'
    )
  }
}

/**
 * Horarios ocupados de un día para un barbero. Para "Cualquier Profesional" un horario
 * está ocupado sólo cuando TODOS los barberos ya tienen turno en ese horario.
 */
export async function getBookedTimes(
  tenantId: string,
  professionalName: string | null | undefined,
  date: string
): Promise<string[]> {
  const active = await getActiveBookingsForDate(tenantId, date)

  if (!professionalName || professionalName === ANY_PROFESSIONAL_NAME) {
    const byTime = new Map<string, Set<string>>()
    for (const b of active) {
      const set = byTime.get(b.time) || new Set<string>()
      set.add(b.professionalName || '')
      byTime.set(b.time, set)
    }
    return [...byTime.entries()]
      .filter(([, pros]) => REAL_PROFESSIONAL_NAMES.every((n) => pros.has(n)))
      .map(([time]) => time)
  }

  return active.filter((b) => b.professionalName === professionalName).map((b) => b.time)
}

/**
 * Crea una reserva garantizando 1 sola reserva activa por barbero/fecha/hora:
 *  1) pre-chequeo de disponibilidad (respuesta rápida y clara);
 *  2) índice único parcial en la base de datos (ver prisma/supabase-hardening.sql),
 *     que es la barrera real contra reservas simultáneas (error P2002 -> SlotTakenError).
 * Lanza SlotTakenError si el horario ya no está libre.
 */
export async function createBooking(data: BookingData): Promise<BookingData> {
  const generatedId = 'bk_' + randomUUID().replace(/-/g, '').substring(0, 20)
  const tenantId = data.tenantId || 'tenant-golden-blade'

  const active = await getActiveBookingsForDate(tenantId, data.date)
  const takenBy = new Set(
    active.filter((b) => b.time === data.time).map((b) => b.professionalName || '')
  )

  // Candidatos: el barbero elegido o, si es "Cualquier Profesional", los barberos libres.
  const requested = data.professionalName || ANY_PROFESSIONAL_NAME
  const candidates =
    requested === ANY_PROFESSIONAL_NAME
      ? REAL_PROFESSIONAL_NAMES.filter((n) => !takenBy.has(n))
      : takenBy.has(requested)
      ? []
      : [requested]

  if (candidates.length === 0) throw new SlotTakenError()

  for (const professionalName of candidates) {
    const fullData: BookingData = {
      ...data,
      id: data.id || generatedId,
      tenantId,
      professionalName,
      status: data.status || 'CONFIRMED',
      paymentStatus: data.paymentStatus || 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    try {
      const created = await prisma.booking.create({
        data: {
          id: fullData.id,
          tenantId,
          clientName: fullData.clientName,
          clientPhone: fullData.clientPhone,
          serviceName: fullData.serviceName,
          professionalName,
          date: fullData.date,
          time: fullData.time,
          status: fullData.status || 'CONFIRMED',
          totalPrice: fullData.totalPrice || 0,
          paymentMethod: fullData.paymentMethod || PAYMENT_METHOD_CASH,
          paymentStatus: fullData.paymentStatus || 'PENDING',
          paymentId: fullData.paymentId || null,
          preferenceId: fullData.preferenceId || null,
          clientEmail: fullData.clientEmail || null,
          clientNotes: fullData.clientNotes || null,
        },
      })
      if (globalThis.__memoryBookings) {
        const idx = globalThis.__memoryBookings.findIndex((b) => b.id === created.id)
        if (idx >= 0) {
          globalThis.__memoryBookings[idx] = created as BookingData
        } else {
          globalThis.__memoryBookings.unshift(created as BookingData)
        }
      }
      return created as BookingData
    } catch (error) {
      if (isUniqueViolation(error)) {
        // Otro cliente tomó este barbero/horario en el mismo instante: probar el siguiente.
        continue
      }
      console.warn('Prisma createBooking fallback a memoria:', error)
      if (globalThis.__memoryBookings) {
        globalThis.__memoryBookings.unshift(fullData)
      }
      return fullData
    }
  }

  throw new SlotTakenError()
}

export async function getBookings(tenantId?: string): Promise<BookingData[]> {
  try {
    const whereClause = tenantId ? { tenantId } : {}
    const list = await prisma.booking.findMany({
      where: whereClause,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })
    if (list.length > 0) {
      // Sincronizar bookings que estén en memoria y no en la lista
      const memory = globalThis.__memoryBookings || []
      const listIds = new Set(list.map((b) => b.id))
      const extraMemory = memory.filter((m) => {
        if (!m.id || listIds.has(m.id)) return false
        if (tenantId && m.tenantId && m.tenantId !== tenantId) return false
        return true
      })
      return [...list, ...extraMemory].sort((a, b) => {
        const d1 = `${a.date} ${a.time}`
        const d2 = `${b.date} ${b.time}`
        return d1.localeCompare(d2)
      }) as BookingData[]
    }
  } catch (error) {
    console.warn('Prisma getBookings fallback a memoria:', error)
  }

  const memory = globalThis.__memoryBookings || initialSampleBookings
  const filtered = tenantId ? memory.filter((b) => !b.tenantId || b.tenantId === tenantId) : memory

  return [...filtered].sort((a, b) => {
    const d1 = `${a.date} ${a.time}`
    const d2 = `${b.date} ${b.time}`
    return d1.localeCompare(d2)
  })
}

export async function getBookingById(id: string): Promise<BookingData | null> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
    })
    if (booking) return booking as BookingData
  } catch (error) {
    console.warn('Prisma getBookingById fallback a memoria:', error)
  }

  const memory = globalThis.__memoryBookings || []
  const found = memory.find((b) => b.id === id)
  return found || null
}

export async function cancelBooking(id: string): Promise<BookingData | null> {
  let updatedBooking: BookingData | null = null

  try {
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })
    updatedBooking = updated as BookingData
  } catch (error) {
    console.warn('Prisma cancelBooking fallback a memoria:', error)
  }

  if (globalThis.__memoryBookings) {
    const idx = globalThis.__memoryBookings.findIndex((b) => b.id === id)
    if (idx >= 0) {
      globalThis.__memoryBookings[idx] = {
        ...globalThis.__memoryBookings[idx],
        status: 'CANCELLED',
        updatedAt: new Date(),
      }
      if (!updatedBooking) {
        updatedBooking = globalThis.__memoryBookings[idx]
      }
    }
  }

  return updatedBooking
}

export async function updateBookingPayment(
  id: string,
  paymentData: {
    paymentStatus: string
    paymentId?: string | null
    preferenceId?: string | null
    status?: string
  }
): Promise<BookingData | null> {
  let updatedBooking: BookingData | null = null

  try {
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        paymentStatus: paymentData.paymentStatus,
        ...(paymentData.paymentId ? { paymentId: paymentData.paymentId } : {}),
        ...(paymentData.preferenceId ? { preferenceId: paymentData.preferenceId } : {}),
        ...(paymentData.status ? { status: paymentData.status } : {}),
      },
    })
    updatedBooking = updated as BookingData
  } catch (error) {
    console.warn('Prisma updateBookingPayment fallback a memoria:', error)
  }

  if (globalThis.__memoryBookings) {
    const idx = globalThis.__memoryBookings.findIndex((b) => b.id === id)
    if (idx >= 0) {
      globalThis.__memoryBookings[idx] = {
        ...globalThis.__memoryBookings[idx],
        paymentStatus: paymentData.paymentStatus,
        paymentId: paymentData.paymentId || globalThis.__memoryBookings[idx].paymentId,
        preferenceId: paymentData.preferenceId || globalThis.__memoryBookings[idx].preferenceId,
        status: paymentData.status || globalThis.__memoryBookings[idx].status,
        updatedAt: new Date(),
      }
      if (!updatedBooking) {
        updatedBooking = globalThis.__memoryBookings[idx]
      }
    }
  }

  return updatedBooking
}
