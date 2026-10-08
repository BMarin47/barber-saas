import prisma from '@/lib/prisma'

export interface BookingData {
  id?: string
  clientName: string
  clientPhone: string
  serviceName: string
  professionalName?: string | null
  date: string
  time: string
  status?: string
  totalPrice?: number | null
  paymentMethod?: string | null
  clientEmail?: string | null
  clientNotes?: string | null
  createdAt?: string | Date
  updatedAt?: string | Date
}

// Global in-memory storage fallback for serverless environments where local filesystem might be read-only
declare const globalThis: {
  __memoryBookings?: BookingData[]
} & typeof global

const initialSampleBookings: BookingData[] = [
  {
    id: 'sample-1',
    clientName: 'Lucas González',
    clientPhone: '5492604654255',
    serviceName: 'Corte y Barba',
    professionalName: 'Facundo "El Maestro" Rossi',
    date: new Date().toISOString().split('T')[0],
    time: '16:00',
    status: 'CONFIRMED',
    totalPrice: 18000,
    paymentMethod: 'Efectivo / Transferencia en el local',
    clientNotes: 'Degradé medio y toalla caliente',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'sample-2',
    clientName: 'Martín Morales',
    clientPhone: '5492604889911',
    serviceName: 'Corte de Pelo',
    professionalName: 'Mateo "Fade King" Benítez',
    date: new Date().toISOString().split('T')[0],
    time: '17:30',
    status: 'CONFIRMED',
    totalPrice: 15000,
    paymentMethod: 'Mercado Pago',
    clientNotes: 'Skin fade al ras',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'sample-3',
    clientName: 'Alejandro Domínguez',
    clientPhone: '5492604332211',
    serviceName: 'Solo Barba',
    professionalName: 'Lucas "Beard Boss" Silva',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    status: 'CONFIRMED',
    totalPrice: 10000,
    paymentMethod: 'Efectivo / Transferencia en el local',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

if (!globalThis.__memoryBookings) {
  globalThis.__memoryBookings = [...initialSampleBookings]
}

export async function createBooking(data: BookingData): Promise<BookingData> {
  const generatedId = 'bk_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
  const fullData: BookingData = {
    ...data,
    id: data.id || generatedId,
    status: data.status || 'CONFIRMED',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // 1. Intentar persistir en Prisma (SQLite o Postgres)
  try {
    const created = await prisma.booking.create({
      data: {
        id: fullData.id,
        clientName: fullData.clientName,
        clientPhone: fullData.clientPhone,
        serviceName: fullData.serviceName,
        professionalName: fullData.professionalName || 'Facundo "El Maestro" Rossi',
        date: fullData.date,
        time: fullData.time,
        status: fullData.status || 'CONFIRMED',
        totalPrice: fullData.totalPrice || 0,
        paymentMethod: fullData.paymentMethod || 'Efectivo / Transferencia en el local',
        clientEmail: fullData.clientEmail || null,
        clientNotes: fullData.clientNotes || null,
      },
    })
    // Guardar también en memoria para rápida sincronización
    if (globalThis.__memoryBookings) {
      const idx = globalThis.__memoryBookings.findIndex((b) => b.id === created.id)
      if (idx >= 0) {
        globalThis.__memoryBookings[idx] = created
      } else {
        globalThis.__memoryBookings.unshift(created)
      }
    }
    return created
  } catch (error) {
    console.warn('Prisma createBooking fallback a memoria:', error)
    if (globalThis.__memoryBookings) {
      globalThis.__memoryBookings.unshift(fullData)
    }
    return fullData
  }
}

export async function getBookings(): Promise<BookingData[]> {
  try {
    const list = await prisma.booking.findMany({
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })
    if (list.length > 0) {
      // Sincronizar bookings que estén en memoria y no en la lista
      const memory = globalThis.__memoryBookings || []
      const listIds = new Set(list.map((b) => b.id))
      const extraMemory = memory.filter((m) => m.id && !listIds.has(m.id))
      return [...list, ...extraMemory].sort((a, b) => {
        const d1 = `${a.date} ${a.time}`
        const d2 = `${b.date} ${b.time}`
        return d1.localeCompare(d2)
      })
    }
  } catch (error) {
    console.warn('Prisma getBookings fallback a memoria:', error)
  }

  return (globalThis.__memoryBookings || initialSampleBookings).sort((a, b) => {
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
    if (booking) return booking
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
    updatedBooking = updated
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
