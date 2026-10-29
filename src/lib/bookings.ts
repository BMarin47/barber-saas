import { randomUUID } from 'crypto'
import prisma from '@/lib/prisma'
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

// Valor por defecto invisible para la columna professionalName en la base de datos
export const DEFAULT_PROFESSIONAL_NAME = 'Barbería General'

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
    professionalName: DEFAULT_PROFESSIONAL_NAME,
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
    professionalName: DEFAULT_PROFESSIONAL_NAME,
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

/** Se lanza cuando el horario ya tiene una reserva activa. */
export class SlotTakenError extends Error {
  constructor(message = 'Ese horario ya fue reservado. Por favor elegí otro.') {
    super(message)
    this.name = 'SlotTakenError'
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  )
}

/**
 * Reservas activas (no canceladas) de un día.
 */
async function getActiveBookingsForDate(
  tenantId: string,
  date: string
): Promise<Pick<BookingData, 'time'>[]> {
  try {
    return await prisma.booking.findMany({
      where: { tenantId, date, status: { not: 'CANCELLED' } },
      select: { time: true },
    })
  } catch (error) {
    console.warn('Prisma getActiveBookingsForDate fallback a memoria:', error)
    return (globalThis.__memoryBookings || []).filter(
      (b) => b.tenantId === tenantId && b.date === date && b.status !== 'CANCELLED'
    )
  }
}

/**
 * Horarios ocupados de un día (cupo directo por horario).
 */
export async function getBookedTimes(
  tenantId: string,
  date: string
): Promise<string[]> {
  const active = await getActiveBookingsForDate(tenantId, date)
  return Array.from(new Set(active.map((b) => b.time)))
}

/**
 * Crea una reserva garantizando 1 sola reserva activa por fecha/hora.
 * Pasa un professionalName por defecto de forma invisible para mantener compatibilidad con la tabla.
 */
export async function createBooking(data: BookingData): Promise<BookingData> {
  const generatedId = 'bk_' + randomUUID().replace(/-/g, '').substring(0, 20)
  const tenantId = data.tenantId || 'tenant-golden-blade'

  const active = await getActiveBookingsForDate(tenantId, data.date)
  if (active.some((b) => b.time === data.time)) {
    throw new SlotTakenError()
  }

  const professionalName = data.professionalName || DEFAULT_PROFESSIONAL_NAME

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
      throw new SlotTakenError()
    }
    console.warn('Prisma createBooking fallback a memoria:', error)
    if (globalThis.__memoryBookings) {
      globalThis.__memoryBookings.unshift(fullData)
    }
    return fullData
  }
}

export async function getBookings(tenantId?: string): Promise<BookingData[]> {
  try {
    const whereClause = tenantId ? { tenantId } : {}
    const list = await prisma.booking.findMany({
      where: whereClause,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })
    if (list.length > 0) {
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
