'use client'

import React, { useMemo, useRef, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Coffee,
  Info,
} from 'lucide-react'
import { ServiceItem, ProfessionalItem } from '@/types/booking'
import {
  generateTimeSlots,
  getTimeSlotsGrouped,
  getDayOfWeekFromDate,
  isBusinessOpen,
  getArgentinaNow,
  isPastDateArgentina,
  isPastTimeTodayArgentina,
} from '@/utils/generateTimeSlots'

interface StepDateTimeProps {
  service: ServiceItem
  professional: ProfessionalItem
  selectedDate: string
  selectedTime: string
  onSelectDate: (date: string) => void
  onSelectTime: (time: string) => void
  onNext: () => void
  onBack: () => void
}

interface DayOption {
  dateStr: string // YYYY-MM-DD
  dayName: string // "Lun", "Mar"
  dayNumber: number // 5, 6
  monthName: string // "Oct"
  isToday: boolean
  isTomorrow: boolean
  isSunday: boolean
  isOpen: boolean
  isPast: boolean
}

export const StepDateTime: React.FC<StepDateTimeProps> = ({
  service,
  professional,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  onNext,
  onBack,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null)

  // Obtener fecha y hora actual en zona horaria Argentina (America/Argentina/Buenos_Aires, UTC-3)
  const argentinaNow = useMemo(() => getArgentinaNow(), [])
  const minDateArgentina = argentinaNow.dateStr

  // Generar los próximos 14 días con minDate anclado a HOY en Argentina
  const availableDays: DayOption[] = useMemo(() => {
    const days: DayOption[] = []
    const baseDate = new Date(argentinaNow.year, argentinaNow.month - 1, argentinaNow.day)

    const dayFormatter = new Intl.DateTimeFormat('es-AR', { weekday: 'short' })
    const monthFormatter = new Intl.DateTimeFormat('es-AR', { month: 'short' })

    for (let i = 0; i < 14; i++) {
      const d = new Date(baseDate)
      d.setDate(baseDate.getDate() + i)

      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`

      const dayOfWeek = d.getDay()
      const isSunday = dayOfWeek === 0
      const isPast = dateStr < minDateArgentina
      const open = !isPast && !isSunday

      const rawDayName = dayFormatter.format(d).replace('.', '')
      const dayName = rawDayName.charAt(0).toUpperCase() + rawDayName.slice(1)
      const rawMonth = monthFormatter.format(d).replace('.', '')
      const monthName = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1)

      days.push({
        dateStr,
        dayName,
        dayNumber: d.getDate(),
        monthName,
        isToday: dateStr === minDateArgentina,
        isTomorrow: i === 1,
        isSunday,
        isOpen: open,
        isPast,
      })
    }
    return days
  }, [argentinaNow, minDateArgentina])

  // Auto-seleccionar primer día abierto válido si ninguno está seleccionado o si se seleccionó uno cerrado/pasado
  useEffect(() => {
    const isSelectedInvalid =
      !selectedDate ||
      isPastDateArgentina(selectedDate) ||
      !isBusinessOpen(selectedDate)

    if (isSelectedInvalid && availableDays.length > 0) {
      const firstValidDay = availableDays.find((d) => d.isOpen)
      if (firstValidDay) {
        onSelectDate(firstValidDay.dateStr)
      }
    }
  }, [selectedDate, availableDays, onSelectDate])

  // Obtener turnos vigentes filtrados por zona horaria de Argentina
  const availableSlotsList = useMemo(() => {
    if (!selectedDate) return []
    return generateTimeSlots(selectedDate, true)
  }, [selectedDate])

  // Obtener slots agrupados por mañana y tarde
  const groupedSlots = useMemo(() => {
    if (!selectedDate) {
      return { morning: [], afternoon: [], all: [], isClosed: true }
    }
    return getTimeSlotsGrouped(selectedDate)
  }, [selectedDate])

  // Si el horario seleccionado ya venció o no está disponible en la fecha elegida, se resetea
  useEffect(() => {
    if (selectedTime && !availableSlotsList.includes(selectedTime)) {
      onSelectTime('')
    }
  }, [selectedDate, availableSlotsList, selectedTime, onSelectTime])

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Formato amigable de fecha
  const selectedDayInfo = availableDays.find((d) => d.dateStr === selectedDate)
  const friendlyDateText = selectedDayInfo
    ? `${selectedDayInfo.isToday ? 'Hoy, ' : selectedDayInfo.isTomorrow ? 'Mañana, ' : ''}${selectedDayInfo.dayName} ${selectedDayInfo.dayNumber} de ${selectedDayInfo.monthName}`
    : selectedDate

  const dayOfWeekNumber = selectedDate ? getDayOfWeekFromDate(selectedDate) : -1
  const isSaturday = dayOfWeekNumber === 6
  const isSunday = dayOfWeekNumber === 0
  const isToday = selectedDate === minDateArgentina
  const allTodaySlotsPassed = isToday && availableSlotsList.length === 0

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <CalendarIcon className="w-5 h-5 text-violet-400" />
            <span>Fecha y Horario</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Turnos de 30 minutos para <span className="text-white font-semibold">{service.name}</span> con{' '}
            <span className="text-white font-semibold">{professional.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] text-zinc-300 hover:text-white hover:border-zinc-700 text-sm font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Atrás</span>
          </button>

          {selectedTime && (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-600/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>Continuar a Confirmación</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Date Carousel Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            1. Selecciona el Día (Hora oficial de Argentina)
          </label>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollCarousel('left')}
              className="p-1.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] hover:border-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
              aria-label="Días anteriores"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel('right')}
              className="p-1.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] hover:border-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
              aria-label="Próximos días"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Container (Bloqueo estricto de días pasados con minDate) */}
        <div
          ref={carouselRef}
          className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory"
        >
          {availableDays.map((d) => {
            const isSelected = selectedDate === d.dateStr
            const isDisabled = d.isPast || !d.isOpen

            return (
              <button
                key={d.dateStr}
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onSelectDate(d.dateStr)}
                className={`snap-start shrink-0 w-24 sm:w-28 py-3 px-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 border ${
                  isDisabled
                    ? 'bg-zinc-950/40 border-zinc-900 text-zinc-600 opacity-40 cursor-not-allowed select-none'
                    : isSelected
                    ? 'bg-violet-600 border-violet-400 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] scale-[1.02] cursor-pointer'
                    : 'bg-white/[0.03] border-white/[0.08] hover:border-zinc-700 hover:bg-white/[0.05] text-zinc-300 cursor-pointer'
                }`}
              >
                {/* Badge for Today / Tomorrow / Closed / Past */}
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider mb-1 px-2 py-0.5 rounded-full ${
                    d.isPast
                      ? 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                      : d.isSunday
                      ? 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                      : isSelected
                      ? 'bg-white/20 text-white'
                      : d.isToday
                      ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                      : 'text-zinc-500'
                  }`}
                >
                  {d.isPast ? 'Pasado' : d.isSunday ? 'Cerrado' : d.isToday ? 'Hoy' : d.isTomorrow ? 'Mañana' : d.monthName}
                </span>

                <span
                  className={`text-xs font-semibold ${
                    isDisabled
                      ? 'text-zinc-600'
                      : isSelected
                      ? 'text-white'
                      : 'text-zinc-400'
                  }`}
                >
                  {d.dayName}
                </span>

                <span
                  className={`text-2xl font-black tracking-tight my-0.5 ${
                    isDisabled
                      ? 'text-zinc-600'
                      : 'text-white'
                  }`}
                >
                  {d.dayNumber}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time Slots Section */}
      <div className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.08] pb-2 gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            2. Horarios Disponibles ({friendlyDateText})
          </label>

          {selectedTime && (
            <span className="text-xs font-bold text-violet-300 bg-violet-500/15 px-2.5 py-1 rounded-full border border-violet-500/30 self-start sm:self-auto">
              Horario elegido: {selectedTime} hs
            </span>
          )}
        </div>

        {/* Aviso si todos los turnos de hoy ya pasaron */}
        {allTodaySlotsPassed && (
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.08] text-zinc-300 flex items-start gap-3">
            <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-sm text-white">
                Todos los turnos de hoy ({argentinaNow.timeStr} hs) han finalizado
              </p>
              <p className="text-zinc-400">
                Por favor selecciona el día de mañana en el calendario superior para reservar tu horario.
              </p>
            </div>
          </div>
        )}

        {/* If Sunday / Closed */}
        {isSunday && (
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/[0.08] text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto" />
            <h4 className="text-base font-bold text-white">El salón permanece cerrado los domingos</h4>
            <p className="text-xs text-zinc-400">
              Por favor selecciona un día de Lunes a Sábado en el calendario superior.
            </p>
          </div>
        )}

        {/* Morning Shifts: 09:00 - 13:00 (Always on Mon-Sat) */}
        {!isSunday && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-violet-400" />
                <span>Turnos de Mañana (09:00 - 13:00)</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">30 min c/u</span>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {groupedSlots.morning.map((timeSlot) => {
                const isSelected = selectedTime === timeSlot
                const isPast = isPastTimeTodayArgentina(timeSlot, selectedDate)

                return (
                  <button
                    key={timeSlot}
                    type="button"
                    disabled={isPast}
                    onClick={() => !isPast && onSelectTime(timeSlot)}
                    className={`py-3 px-2 rounded-2xl text-xs md:text-sm font-bold transition-all duration-200 border ${
                      isPast
                        ? 'opacity-40 cursor-not-allowed line-through text-zinc-600 bg-zinc-950/40 border-zinc-900/60 select-none'
                        : isSelected
                        ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-600/30 scale-[1.02] cursor-pointer'
                        : 'bg-white/[0.03] border-white/[0.08] text-zinc-200 hover:border-zinc-600 hover:bg-white/[0.05] cursor-pointer'
                    }`}
                  >
                    {timeSlot} hs
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Afternoon Shifts: 17:00 - 21:00 (Mon-Fri only) */}
        {!isSunday && !isSaturday && (
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-violet-400" />
                <span>Turnos de Tarde (17:00 - 21:00)</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">30 min c/u</span>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {groupedSlots.afternoon.map((timeSlot) => {
                const isSelected = selectedTime === timeSlot
                const isPast = isPastTimeTodayArgentina(timeSlot, selectedDate)

                return (
                  <button
                    key={timeSlot}
                    type="button"
                    disabled={isPast}
                    onClick={() => !isPast && onSelectTime(timeSlot)}
                    className={`py-3 px-2 rounded-2xl text-xs md:text-sm font-bold transition-all duration-200 border ${
                      isPast
                        ? 'opacity-40 cursor-not-allowed line-through text-zinc-600 bg-zinc-950/40 border-zinc-900/60 select-none'
                        : isSelected
                        ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-600/30 scale-[1.02] cursor-pointer'
                        : 'bg-white/[0.03] border-white/[0.08] text-zinc-200 hover:border-zinc-600 hover:bg-white/[0.05] cursor-pointer'
                    }`}
                  >
                    {timeSlot} hs
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Saturday Afternoon Notice */}
        {isSaturday && (
          <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/[0.08] flex items-center gap-3 text-xs text-zinc-400">
            <Coffee className="w-4 h-4 text-violet-400 shrink-0" />
            <span>
              <strong>Sábados por la tarde cerrado:</strong> Atención exclusiva de 09:00 a 13:00 hs.
            </span>
          </div>
        )}
      </div>

      {/* Sticky Mobile Next Button */}
      {selectedTime && (
        <div className="pt-4 flex sm:hidden">
          <button
            type="button"
            onClick={onNext}
            className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25"
          >
            <span>Continuar a Confirmación</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
