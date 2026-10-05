/**
 * Utilidad de disponibilidad de horarios para BarberSaaS
 * 
 * Reglas de Negocio:
 * - Zona Horaria Estricta: Argentina (America/Argentina/Buenos_Aires, UTC-3)
 * - Duración del turno: 30 minutos
 * - Lunes a Viernes: 09:00 a 13:00 y de 17:00 a 21:00 (Turnos cortados)
 * - Sábados: 09:00 a 13:00 (Medio día)
 * - Domingos: Cerrado (Sin horarios)
 * - Bloqueo de fechas pasadas y slots vencidos del día de hoy
 */

export const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires'

export interface GroupedTimeSlots {
  morning: string[]
  afternoon: string[]
  all: string[]
  isClosed: boolean
}

export interface ArgentinaDateTime {
  dateStr: string // "YYYY-MM-DD"
  year: number
  month: number // 1-12
  day: number
  hour: number // 0-23
  minute: number // 0-59
  timeStr: string // "HH:mm"
}

/**
 * Obtiene la fecha y hora actual exacta en la zona horaria de Argentina (UTC-3).
 */
export function getArgentinaNow(): ArgentinaDateTime {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(now)
  const map: Record<string, string> = {}
  parts.forEach((p) => {
    map[p.type] = p.value
  })

  const year = parseInt(map.year, 10)
  const month = parseInt(map.month, 10)
  const day = parseInt(map.day, 10)
  const hour = parseInt(map.hour, 10)
  const minute = parseInt(map.minute, 10)
  const dateStr = `${map.year}-${map.month}-${map.day}`
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  return {
    dateStr,
    year,
    month,
    day,
    hour,
    minute,
    timeStr,
  }
}

/**
 * Normaliza cualquier entrada Date o string (YYYY-MM-DD) para obtener
 * el día de la semana sin problemas de desfase de zona horaria.
 * @param date Date | string
 * @returns number (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
 */
export function getDayOfWeekFromDate(date: Date | string): number {
  if (typeof date === 'string') {
    const parts = date.split('-').map(Number)
    if (parts.length === 3) {
      // Usar constructor local (año, mes base 0, día)
      return new Date(parts[0], parts[1] - 1, parts[2]).getDay()
    }
    return new Date(date).getDay()
  }
  return date.getDay()
}

/**
 * Genera intervalos de tiempo en formato "HH:mm" cada 30 minutos
 * entre startHour y endHour.
 */
function create30MinSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = []
  for (let hour = startHour; hour < endHour; hour++) {
    const hourStr = String(hour).padStart(2, '0')
    slots.push(`${hourStr}:00`)
    slots.push(`${hourStr}:30`)
  }
  return slots
}

// Horarios precomputados de 30 minutos
const MORNING_SLOTS = create30MinSlots(9, 13) // ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30"]
const AFTERNOON_SLOTS = create30MinSlots(17, 21) // ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"]

/**
 * Determina si una fecha dada en formato YYYY-MM-DD es anterior a hoy en Argentina
 */
export function isPastDateArgentina(date: Date | string): boolean {
  const { dateStr: minDate } = getArgentinaNow()
  const dateStr = typeof date === 'string' ? date : getArgentinaDateString(date)
  return dateStr < minDate
}

/**
 * Convierte un objeto Date a formato YYYY-MM-DD en zona horaria de Argentina
 */
export function getArgentinaDateString(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date)
}

/**
 * Evalúa si un slot de horario ("HH:mm") ya venció en la fecha indicada
 * según la hora actual de Argentina.
 */
export function isPastTimeTodayArgentina(slotTime: string, selectedDate: Date | string): boolean {
  const { dateStr: todayDateStr, timeStr: currentTimeStr } = getArgentinaNow()
  const dateStr = typeof selectedDate === 'string' ? selectedDate : getArgentinaDateString(selectedDate)

  // Si la fecha es anterior a hoy, todos los turnos están vencidos
  if (dateStr < todayDateStr) {
    return true
  }

  // Si la fecha es posterior a hoy, ningún turno está vencido
  if (dateStr > todayDateStr) {
    return false
  }

  // Si la fecha es HOY, comparar lexicológicamente "HH:mm" (ej: "15:30" <= "16:45")
  return slotTime <= currentTimeStr
}

/**
 * Función principal generadora de turnos.
 * Recibe una fecha y retorna los horarios disponibles de 30 minutos.
 * Filtra automáticamente los turnos que ya hayan pasado si la fecha es hoy en Argentina.
 * @param date Objeto Date o string representativo de la fecha
 * @returns Array de strings con los horarios disponibles
 */
export function generateTimeSlots(date: Date | string, filterPast: boolean = true): string[] {
  const dayOfWeek = getDayOfWeekFromDate(date)

  // Si es un día pasado o Domingo (0): sin turnos
  if (isPastDateArgentina(date) || dayOfWeek === 0) {
    return []
  }

  let rawSlots: string[] = []

  // Sábado (6): Medio día (solo mañana)
  if (dayOfWeek === 6) {
    rawSlots = [...MORNING_SLOTS]
  } else {
    // Lunes a Viernes (1 - 5): Horario cortado (mañana y tarde)
    rawSlots = [...MORNING_SLOTS, ...AFTERNOON_SLOTS]
  }

  // Si filterPast es true, descartar los horarios que ya pasaron hoy en Argentina
  if (filterPast) {
    return rawSlots.filter((slot) => !isPastTimeTodayArgentina(slot, date))
  }

  return rawSlots
}

/**
 * Retorna los horarios clasificados por turnos de mañana y tarde
 * para facilitar el renderizado en la interfaz.
 */
export function getTimeSlotsGrouped(date: Date | string): GroupedTimeSlots {
  const dayOfWeek = getDayOfWeekFromDate(date)

  if (isPastDateArgentina(date) || dayOfWeek === 0) {
    return {
      morning: [],
      afternoon: [],
      all: [],
      isClosed: true,
    }
  }

  if (dayOfWeek === 6) {
    return {
      morning: [...MORNING_SLOTS],
      afternoon: [],
      all: [...MORNING_SLOTS],
      isClosed: false,
    }
  }

  return {
    morning: [...MORNING_SLOTS],
    afternoon: [...AFTERNOON_SLOTS],
    all: [...MORNING_SLOTS, ...AFTERNOON_SLOTS],
    isClosed: false,
  }
}

/**
 * Indica si el local abre sus puertas en la fecha seleccionada
 */
export function isBusinessOpen(date: Date | string): boolean {
  if (isPastDateArgentina(date)) return false
  const dayOfWeek = getDayOfWeekFromDate(date)
  return dayOfWeek !== 0
}
