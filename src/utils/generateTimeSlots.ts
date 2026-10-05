/**
 * Utilidad de disponibilidad de horarios para BarberSaaS
 * 
 * Reglas de Negocio:
 * - Duración del turno: 30 minutos
 * - Lunes a Viernes: 09:00 a 13:00 y de 17:00 a 21:00 (Turnos cortados)
 * - Sábados: 09:00 a 13:00 (Medio día)
 * - Domingos: Cerrado (Sin horarios)
 */

export interface GroupedTimeSlots {
  morning: string[]
  afternoon: string[]
  all: string[]
  isClosed: boolean
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
 * El último turno termina en endHour.
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
 * Función principal generadora de turnos
 * @param date Objeto Date o string representativo de la fecha
 * @returns Array de strings con los horarios disponibles (ej: ["09:00", "09:30", ...])
 */
export function generateTimeSlots(date: Date | string): string[] {
  const dayOfWeek = getDayOfWeekFromDate(date)

  // Domingo (0): Cerrado
  if (dayOfWeek === 0) {
    return []
  }

  // Sábado (6): Medio día (solo mañana)
  if (dayOfWeek === 6) {
    return [...MORNING_SLOTS]
  }

  // Lunes a Viernes (1 - 5): Horario cortado (mañana y tarde)
  return [...MORNING_SLOTS, ...AFTERNOON_SLOTS]
}

/**
 * Retorna los horarios clasificados por turnos de mañana y tarde
 * para facilitar el renderizado en la interfaz.
 */
export function getTimeSlotsGrouped(date: Date | string): GroupedTimeSlots {
  const dayOfWeek = getDayOfWeekFromDate(date)

  if (dayOfWeek === 0) {
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
  const dayOfWeek = getDayOfWeekFromDate(date)
  return dayOfWeek !== 0
}
