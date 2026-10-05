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
} from 'lucide-react'
import { ServiceItem, ProfessionalItem } from '@/types/booking'
import {
  generateTimeSlots,
  getTimeSlotsGrouped,
  getDayOfWeekFromDate,
  isBusinessOpen,
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

  // Generate the next 14 calendar days
  const availableDays: DayOption[] = useMemo(() => {
    const days: DayOption[] = []
    const now = new Date()

    const dayFormatter = new Intl.DateTimeFormat('es-AR', { weekday: 'short' })
    const monthFormatter = new Intl.DateTimeFormat('es-AR', { month: 'short' })

    for (let i = 0; i < 14; i++) {
      const d = new Date()
      d.setDate(now.getDate() + i)

      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`

      const dayOfWeek = d.getDay()
      const isSunday = dayOfWeek === 0
      const open = isBusinessOpen(dateStr)

      const rawDayName = dayFormatter.format(d).replace('.', '')
      const dayName = rawDayName.charAt(0).toUpperCase() + rawDayName.slice(1)
      const rawMonth = monthFormatter.format(d).replace('.', '')
      const monthName = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1)

      days.push({
        dateStr,
        dayName,
        dayNumber: d.getDate(),
        monthName,
        isToday: i === 0,
        isTomorrow: i === 1,
        isSunday,
        isOpen: open,
      })
    }
    return days
  }, [])

  // Auto-select first OPEN day if none or if current selected day is closed
  useEffect(() => {
    if (!selectedDate && availableDays.length > 0) {
      const firstOpenDay = availableDays.find((d) => d.isOpen)
      if (firstOpenDay) {
        onSelectDate(firstOpenDay.dateStr)
      }
    } else if (selectedDate && !isBusinessOpen(selectedDate)) {
      const firstOpenDay = availableDays.find((d) => d.isOpen)
      if (firstOpenDay) {
        onSelectDate(firstOpenDay.dateStr)
      }
    }
  }, [selectedDate, availableDays, onSelectDate])

  // Compute available slots dynamically using generateTimeSlots
  const availableSlotsList = useMemo(() => {
    if (!selectedDate) return []
    return generateTimeSlots(selectedDate)
  }, [selectedDate])

  // Get grouped slots (morning / afternoon / isClosed)
  const groupedSlots = useMemo(() => {
    if (!selectedDate) {
      return { morning: [], afternoon: [], all: [], isClosed: true }
    }
    return getTimeSlotsGrouped(selectedDate)
  }, [selectedDate])

  // If selectedTime is no longer available in the newly selected date, clear it
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

  // Format human friendly date string
  const selectedDayInfo = availableDays.find((d) => d.dateStr === selectedDate)
  const friendlyDateText = selectedDayInfo
    ? `${selectedDayInfo.isToday ? 'Hoy, ' : selectedDayInfo.isTomorrow ? 'Mañana, ' : ''}${selectedDayInfo.dayName} ${selectedDayInfo.dayNumber} de ${selectedDayInfo.monthName}`
    : selectedDate

  const dayOfWeekNumber = selectedDate ? getDayOfWeekFromDate(selectedDate) : -1
  const isSaturday = dayOfWeekNumber === 6
  const isSunday = dayOfWeekNumber === 0

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-amber-400" />
            <span>Fecha y Horario</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Turnos de 30 minutos para <span className="text-amber-400 font-semibold">{service.name}</span> con{' '}
            <span className="text-amber-400 font-semibold">{professional.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 text-sm font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Atrás</span>
          </button>

          {selectedTime && (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-500 transition-all cursor-pointer"
            >
              <span>Continuar a Confirmación</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Date Carousel Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            1. Selecciona el Día
          </label>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollCarousel('left')}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
              aria-label="Días anteriores"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel('right')}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
              aria-label="Próximos días"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div
          ref={carouselRef}
          className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory"
        >
          {availableDays.map((d) => {
            const isSelected = selectedDate === d.dateStr
            const isDisabled = !d.isOpen

            return (
              <button
                key={d.dateStr}
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onSelectDate(d.dateStr)}
                className={`snap-start shrink-0 w-24 sm:w-28 py-3 px-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border ${
                  isDisabled
                    ? 'bg-zinc-950/40 border-zinc-900 text-zinc-600 opacity-40 cursor-not-allowed select-none'
                    : isSelected
                    ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 border-amber-300 text-zinc-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-[1.03] cursor-pointer'
                    : 'bg-zinc-900/80 border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900 text-zinc-300 cursor-pointer'
                }`}
              >
                {/* Badge for Today / Tomorrow / Sunday Closed */}
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider mb-1 px-2 py-0.5 rounded-full ${
                    isDisabled
                      ? 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                      : isSelected
                      ? 'bg-zinc-950 text-amber-400'
                      : d.isToday
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-zinc-500'
                  }`}
                >
                  {isDisabled ? 'Cerrado' : d.isToday ? 'Hoy' : d.isTomorrow ? 'Mañana' : d.monthName}
                </span>

                <span
                  className={`text-xs font-semibold ${
                    isDisabled
                      ? 'text-zinc-600'
                      : isSelected
                      ? 'text-zinc-950'
                      : 'text-zinc-400'
                  }`}
                >
                  {d.dayName}
                </span>

                <span
                  className={`text-2xl font-black tracking-tight my-0.5 ${
                    isDisabled
                      ? 'text-zinc-600'
                      : isSelected
                      ? 'text-zinc-950'
                      : 'text-zinc-100'
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/60 pb-2 gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            2. Horarios Disponibles ({friendlyDateText})
          </label>

          {selectedTime && (
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 self-start sm:self-auto">
              Horario elegido: {selectedTime} hs
            </span>
          )}
        </div>

        {/* If Sunday / Closed */}
        {isSunday && (
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="text-base font-bold text-zinc-200">El salón permanece cerrado los domingos</h4>
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
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Turnos de Mañana (09:00 - 13:00)</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">30 min c/u</span>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {groupedSlots.morning.map((timeSlot) => {
                const isSelected = selectedTime === timeSlot

                return (
                  <button
                    key={timeSlot}
                    type="button"
                    onClick={() => onSelectTime(timeSlot)}
                    className={`py-3 px-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 border cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 border-amber-300 shadow-md shadow-amber-500/30 scale-[1.03]'
                        : 'bg-zinc-900/80 border-zinc-800/80 text-zinc-200 hover:border-amber-500/60 hover:bg-zinc-800/90'
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
                <Moon className="w-4 h-4 text-amber-400" />
                <span>Turnos de Tarde (17:00 - 21:00)</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">30 min c/u</span>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {groupedSlots.afternoon.map((timeSlot) => {
                const isSelected = selectedTime === timeSlot

                return (
                  <button
                    key={timeSlot}
                    type="button"
                    onClick={() => onSelectTime(timeSlot)}
                    className={`py-3 px-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 border cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 border-amber-300 shadow-md shadow-amber-500/30 scale-[1.03]'
                        : 'bg-zinc-900/80 border-zinc-800/80 text-zinc-200 hover:border-amber-500/60 hover:bg-zinc-800/90'
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
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/70 flex items-center gap-3 text-xs text-zinc-400">
            <Coffee className="w-4 h-4 text-amber-400 shrink-0" />
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
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <span>Continuar a Confirmación</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
