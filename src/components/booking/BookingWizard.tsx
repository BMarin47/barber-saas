'use client'

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scissors,
  Calendar,
  CheckCircle2,
  Star,
  MapPin,
  Edit3,
  ChevronDown,
  Check,
} from 'lucide-react'
import {
  TenantInfo,
  ServiceItem,
  ProfessionalItem,
  ClientDetails,
} from '@/types/booking'
import { StepServiceAndProfessional } from './StepServiceAndProfessional'
import { StepDateTime } from './StepDateTime'
import { StepConfirmation } from './StepConfirmation'
import { BookingSuccessTicket } from './BookingSuccessTicket'

interface BookingWizardProps {
  tenant: TenantInfo
  services: ServiceItem[]
  professionals: ProfessionalItem[]
}

const STORAGE_KEY = 'barberSaaS_clientData'

export const BookingWizard: React.FC<BookingWizardProps> = ({
  tenant,
  services,
  professionals,
}) => {
  // Active accordion panel: only 1 panel expanded at a time (UX Cero Scroll)
  const [activePanel, setActivePanel] = useState<number>(1)
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalItem | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [client, setClient] = useState<ClientDetails>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  })
  const [hasAutofilledData, setHasAutofilledData] = useState<boolean>(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [confirmStatus, setConfirmStatus] = useState<'idle' | 'processing' | 'success'>('idle')
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [confirmedBookingCode, setConfirmedBookingCode] = useState<string>('')

  // Timer ref for smooth auto-advance debouncing
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const scheduleAutoAdvance = useCallback((targetPanel: number, delayMs = 280) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current)
    }
    autoAdvanceTimerRef.current = setTimeout(() => {
      setActivePanel(targetPanel)
    }, delayMs)
  }, [])

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current)
      }
    }
  }, [])

  // "Memoria Inteligente" (Auto-fill) from localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed === 'object') {
            if (parsed.name || parsed.phone) {
              setHasAutofilledData(true)
              setClient((prev) => ({
                ...prev,
                name: parsed.name || prev.name,
                phone: parsed.phone || prev.phone,
                email: parsed.email || prev.email,
              }))
            }
          }
        }
      } catch (err) {
        console.error('Error loading client data from localStorage:', err)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  // Auto-advance Step 1: when service + pro are both picked
  const handleSelectService = useCallback(
    (service: ServiceItem) => {
      setSelectedService(service)
      if (selectedProfessional) {
        scheduleAutoAdvance(2, 280)
      }
    },
    [selectedProfessional, scheduleAutoAdvance]
  )

  const handleSelectProfessional = useCallback(
    (pro: ProfessionalItem) => {
      setSelectedProfessional(pro)
      if (selectedService) {
        scheduleAutoAdvance(2, 280)
      }
    },
    [selectedService, scheduleAutoAdvance]
  )

  // Step 2 Date & Time
  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date)
  }, [])

  // Auto-advance Step 2: when time is picked
  const handleSelectTime = useCallback(
    (time: string) => {
      setSelectedTime(time)
      scheduleAutoAdvance(3, 280)
    },
    [scheduleAutoAdvance]
  )

  const handleChangeClient = useCallback((field: keyof ClientDetails, value: string) => {
    setClient((prev) => {
      const updated = { ...prev, [field]: value }
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            name: updated.name,
            phone: updated.phone,
            email: updated.email,
          })
        )
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  const canOpenPanel = useCallback(
    (panelNum: number): boolean => {
      if (panelNum === 1) return true
      if (panelNum === 2) return !!selectedService && !!selectedProfessional
      if (panelNum === 3)
        return (
          !!selectedService &&
          !!selectedProfessional &&
          !!selectedDate &&
          !!selectedTime
        )
      return false
    },
    [selectedService, selectedProfessional, selectedDate, selectedTime]
  )

  const handleTogglePanel = useCallback(
    (panelNum: number) => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current)
      }
      if (panelNum === activePanel) {
        // Only 1 panel expanded at a time, keep active
        return
      }
      if (canOpenPanel(panelNum)) {
        setActivePanel(panelNum)
      }
    },
    [activePanel, canOpenPanel]
  )

  const handleConfirmBooking = useCallback(
    async (phoneWithPrefix?: string, paymentMethod?: string) => {
      const code = 'GB-' + Math.floor(1000 + Math.random() * 9000)
      setConfirmedBookingCode(code)

      if (paymentMethod) {
        setSelectedPaymentMethod(paymentMethod)
      }

      const phone = client.phone
      const fullPhone = phoneWithPrefix || '549' + phone.replace(/\D/g, '')

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            name: client.name,
            phone: client.phone,
            email: client.email,
          })
        )
      } catch {
        // ignore
      }

      try {
        await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: tenant.id,
            serviceId: selectedService?.id,
            professionalId: selectedProfessional?.id,
            date: selectedDate,
            time: selectedTime,
            clientName: client.name,
            clientPhone: fullPhone,
            clientEmail: client.email,
            clientNotes: client.notes,
            paymentMethod: paymentMethod || selectedPaymentMethod,
            totalPrice: selectedService?.price,
          }),
        }).catch(() => {
          // Soft fail for mock mode
        })
      } finally {
        setIsSuccess(true)
      }
    },
    [
      client,
      tenant.id,
      selectedService,
      selectedProfessional,
      selectedDate,
      selectedTime,
      selectedPaymentMethod,
    ]
  )

  const handleReset = useCallback(() => {
    setActivePanel(1)
    setSelectedService(null)
    setSelectedProfessional(null)
    setSelectedDate('')
    setSelectedTime('')
    setClient({ name: '', phone: '', email: '', notes: '' })
    setSelectedPaymentMethod('')
    setConfirmStatus('idle')
    setIsSuccess(false)
  }, [])

  // Format currency
  const formatPrice = useCallback(
    (price: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: tenant.currency === 'USD' ? 'USD' : 'ARS',
        maximumFractionDigits: 0,
      }).format(price)
    },
    [tenant.currency]
  )

  // Format friendly date for closed Panel 2 summary (e.g. "Hoy, 7 Oct" or "Mié 7 Oct")
  const friendlyDateSummary = useMemo(() => {
    if (!selectedDate) return ''
    try {
      const parts = selectedDate.split('-').map(Number)
      if (parts.length !== 3) return selectedDate
      const [year, month, day] = parts
      const dateObj = new Date(year, month - 1, day)
      const today = new Date()
      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === month - 1 &&
        today.getDate() === day
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      const isTomorrow =
        tomorrow.getFullYear() === year &&
        tomorrow.getMonth() === month - 1 &&
        tomorrow.getDate() === day

      const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'short' })
        .format(dateObj)
        .replace('.', '')
      const monthName = new Intl.DateTimeFormat('es-AR', { month: 'short' })
        .format(dateObj)
        .replace('.', '')

      const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
      const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

      const prefix = isToday ? 'Hoy, ' : isTomorrow ? 'Mañana, ' : `${capWeekday} `
      return `${prefix}${day} ${capMonth}`
    } catch {
      return selectedDate
    }
  }, [selectedDate])

  const isStep1Complete = !!selectedService && !!selectedProfessional
  const isStep2Complete = !!selectedDate && !!selectedTime
  const isStep3Complete = !!client.name && !!client.phone

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-2">
      <AnimatePresence mode="wait">
        {isSuccess && selectedService && selectedProfessional ? (
          <motion.div
            key="success-ticket"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <BookingSuccessTicket
              tenant={tenant}
              service={selectedService}
              professional={selectedProfessional}
              date={selectedDate}
              time={selectedTime}
              client={client}
              bookingCode={confirmedBookingCode}
              paymentMethod={selectedPaymentMethod}
              onReset={handleReset}
              currency={tenant.currency}
            />
          </motion.div>
        ) : (
          <div className="space-y-3">
            {/* Header de Identidad de Marca y Ubicación */}
            <div className="rounded-2xl bg-zinc-900/40 border border-white/[0.08] p-3 sm:p-4 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0 shadow-inner">
                  <Scissors className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {tenant.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />{' '}
                      {tenant.rating || '4.95'}
                    </span>
                  </div>
                  {tenant.address && (
                    <p className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <span>{tenant.address}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400 self-end sm:self-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px] text-zinc-300">
                  Lun a Sáb: 09:00 - 21:00 hs
                </span>
              </div>
            </div>

            {/* Contenedor Principal del Acordeón con Altura Controlada (Zero Global Scroll) */}
            <div className="rounded-3xl bg-zinc-900/30 border border-white/[0.08] backdrop-blur-2xl shadow-2xl overflow-hidden divide-y divide-white/[0.06]">
              {/* ======================================================== */}
              {/* PANEL 1: SERVICIO & PROFESIONAL                          */}
              {/* ======================================================== */}
              <div className="transition-colors">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTogglePanel(1)}
                  className={`w-full p-4 sm:p-5 flex items-center justify-between transition-colors cursor-pointer select-none ${
                    activePanel === 1
                      ? 'bg-zinc-900/80'
                      : 'hover:bg-white/[0.03] bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs transition-all ${
                        isStep1Complete && activePanel !== 1
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : activePanel === 1
                          ? 'bg-violet-600 border border-violet-400 text-white shadow-[0_0_14px_rgba(139,92,246,0.35)]'
                          : 'bg-zinc-800/80 border border-white/[0.08] text-zinc-400'
                      }`}
                    >
                      {isStep1Complete && activePanel !== 1 ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        '1'
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2
                          className={`text-sm sm:text-base font-bold transition-colors truncate flex items-center gap-2 ${
                            activePanel === 1
                              ? 'text-white'
                              : isStep1Complete
                              ? 'text-zinc-200'
                              : 'text-zinc-400'
                          }`}
                        >
                          <Scissors className="w-4 h-4 text-violet-400 shrink-0" />
                          <span>Servicio & Profesional</span>
                        </h2>
                        {activePanel === 1 && (
                          <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full shrink-0">
                            En selección
                          </span>
                        )}
                      </div>

                      {/* Resumen inteligente en una sola línea cuando está cerrado */}
                      {activePanel !== 1 && (
                        <p className="text-xs text-zinc-400 truncate mt-0.5 flex items-center gap-1.5">
                          {isStep1Complete ? (
                            <>
                              <span className="text-emerald-400 font-medium">✔️</span>
                              <span className="text-zinc-200 font-medium truncate">
                                {selectedService?.name} con {selectedProfessional?.name}
                              </span>
                              <span className="text-zinc-400 font-mono shrink-0">
                                • {formatPrice(selectedService!.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-zinc-500">
                              Elige tu servicio y con quién te atiendes
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    {activePanel !== 1 && isStep1Complete && (
                      <span className="text-[11px] font-medium text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all">
                        <Edit3 className="w-3 h-3" />
                        <span className="hidden sm:inline">Modificar</span>
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform duration-250 ${
                        activePanel === 1 ? 'rotate-180 text-violet-400' : ''
                      }`}
                    />
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {activePanel === 1 && (
                    <motion.div
                      key="panel-1-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: 'auto',
                        opacity: 1,
                        transition: {
                          height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.22, delay: 0.08 },
                        },
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: {
                          height: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.14 },
                        },
                      }}
                      className="overflow-hidden border-t border-white/[0.06]"
                    >
                      <div className="overflow-y-auto max-h-[50vh] sm:max-h-[54vh] md:max-h-[58vh] p-4 sm:p-6 pr-2">
                        <StepServiceAndProfessional
                          services={services}
                          professionals={professionals}
                          selectedService={selectedService}
                          selectedProfessional={selectedProfessional}
                          onSelectService={handleSelectService}
                          onSelectProfessional={handleSelectProfessional}
                          currency={tenant.currency}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ======================================================== */}
              {/* PANEL 2: FECHA Y HORARIO                                 */}
              {/* ======================================================== */}
              <div className="transition-colors">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTogglePanel(2)}
                  className={`w-full p-4 sm:p-5 flex items-center justify-between transition-colors select-none ${
                    !canOpenPanel(2)
                      ? 'opacity-60 cursor-not-allowed bg-transparent'
                      : activePanel === 2
                      ? 'bg-zinc-900/80 cursor-pointer'
                      : 'hover:bg-white/[0.03] cursor-pointer bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs transition-all ${
                        isStep2Complete && activePanel !== 2
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : activePanel === 2
                          ? 'bg-violet-600 border border-violet-400 text-white shadow-[0_0_14px_rgba(139,92,246,0.35)]'
                          : 'bg-zinc-800/80 border border-white/[0.08] text-zinc-400'
                      }`}
                    >
                      {isStep2Complete && activePanel !== 2 ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        '2'
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2
                          className={`text-sm sm:text-base font-bold transition-colors truncate flex items-center gap-2 ${
                            activePanel === 2
                              ? 'text-white'
                              : isStep2Complete
                              ? 'text-zinc-200'
                              : 'text-zinc-400'
                          }`}
                        >
                          <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
                          <span>Fecha y Horario</span>
                        </h2>
                        {activePanel === 2 && (
                          <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full shrink-0">
                            En selección
                          </span>
                        )}
                      </div>

                      {/* Resumen inteligente en una sola línea cuando está cerrado */}
                      {activePanel !== 2 && (
                        <p className="text-xs text-zinc-400 truncate mt-0.5 flex items-center gap-1.5">
                          {isStep2Complete ? (
                            <>
                              <span className="text-emerald-400 font-medium">✔️</span>
                              <span className="text-zinc-200 font-medium truncate">
                                {friendlyDateSummary}
                              </span>
                              <span className="text-violet-400 font-semibold shrink-0">
                                • {selectedTime} hs
                              </span>
                            </>
                          ) : (
                            <span className="text-zinc-500">
                              {canOpenPanel(2)
                                ? 'Elige el día y la hora de tu cita'
                                : 'Completa el Paso 1 para habilitar fechas'}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    {activePanel !== 2 && isStep2Complete && (
                      <span className="text-[11px] font-medium text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all">
                        <Edit3 className="w-3 h-3" />
                        <span className="hidden sm:inline">Modificar</span>
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform duration-250 ${
                        activePanel === 2 ? 'rotate-180 text-violet-400' : ''
                      }`}
                    />
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {activePanel === 2 && selectedService && selectedProfessional && (
                    <motion.div
                      key="panel-2-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: 'auto',
                        opacity: 1,
                        transition: {
                          height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.22, delay: 0.08 },
                        },
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: {
                          height: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.14 },
                        },
                      }}
                      className="overflow-hidden border-t border-white/[0.06]"
                    >
                      <div className="overflow-y-auto max-h-[50vh] sm:max-h-[54vh] md:max-h-[58vh] p-4 sm:p-6 pr-2">
                        <StepDateTime
                          service={selectedService}
                          professional={selectedProfessional}
                          selectedDate={selectedDate}
                          selectedTime={selectedTime}
                          onSelectDate={handleSelectDate}
                          onSelectTime={handleSelectTime}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ======================================================== */}
              {/* PANEL 3: TUS DATOS & CONFIRMACIÓN                        */}
              {/* ======================================================== */}
              <div className="transition-colors">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTogglePanel(3)}
                  className={`w-full p-4 sm:p-5 flex items-center justify-between transition-colors select-none ${
                    !canOpenPanel(3)
                      ? 'opacity-60 cursor-not-allowed bg-transparent'
                      : activePanel === 3
                      ? 'bg-zinc-900/80 cursor-pointer'
                      : 'hover:bg-white/[0.03] cursor-pointer bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs transition-all ${
                        isStep3Complete && activePanel !== 3
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : activePanel === 3
                          ? 'bg-violet-600 border border-violet-400 text-white shadow-[0_0_14px_rgba(139,92,246,0.35)]'
                          : 'bg-zinc-800/80 border border-white/[0.08] text-zinc-400'
                      }`}
                    >
                      {isStep3Complete && activePanel !== 3 ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        '3'
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2
                          className={`text-sm sm:text-base font-bold transition-colors truncate flex items-center gap-2 ${
                            activePanel === 3
                              ? 'text-white'
                              : isStep3Complete
                              ? 'text-zinc-200'
                              : 'text-zinc-400'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                          <span>Tus Datos & Confirmación</span>
                        </h2>
                        {activePanel === 3 && (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                            Paso final
                          </span>
                        )}
                      </div>

                      {/* Resumen inteligente en una sola línea cuando está cerrado */}
                      {activePanel !== 3 && (
                        <p className="text-xs text-zinc-400 truncate mt-0.5 flex items-center gap-1.5">
                          {isStep3Complete ? (
                            <>
                              <span className="text-emerald-400 font-medium">✔️</span>
                              <span className="text-zinc-200 font-medium truncate">
                                {client.name}
                              </span>
                              <span className="text-zinc-400 font-mono shrink-0">
                                • +54 9 {client.phone}
                              </span>
                            </>
                          ) : (
                            <span className="text-zinc-500">
                              {canOpenPanel(3)
                                ? 'Ingresa tus datos para confirmar vía WhatsApp'
                                : 'Completa los pasos previos para confirmar'}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    {activePanel !== 3 && isStep3Complete && (
                      <span className="text-[11px] font-medium text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all">
                        <Edit3 className="w-3 h-3" />
                        <span className="hidden sm:inline">Modificar</span>
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform duration-250 ${
                        activePanel === 3 ? 'rotate-180 text-violet-400' : ''
                      }`}
                    />
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {activePanel === 3 &&
                    selectedService &&
                    selectedProfessional &&
                    selectedDate &&
                    selectedTime && (
                      <motion.div
                        key="panel-3-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: 'auto',
                          opacity: 1,
                          transition: {
                            height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.22, delay: 0.08 },
                          },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: {
                            height: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.14 },
                          },
                        }}
                        className="overflow-hidden border-t border-white/[0.06]"
                      >
                        <div className="overflow-y-auto max-h-[50vh] sm:max-h-[54vh] md:max-h-[58vh] p-4 sm:p-6 pr-2">
                          <StepConfirmation
                            tenant={tenant}
                            service={selectedService}
                            professional={selectedProfessional}
                            date={selectedDate}
                            time={selectedTime}
                            client={client}
                            onChangeClient={handleChangeClient}
                            onConfirmBooking={handleConfirmBooking}
                            currency={tenant.currency}
                            paymentMethod={selectedPaymentMethod}
                            onSelectPaymentMethod={setSelectedPaymentMethod}
                            confirmStatus={confirmStatus}
                            setConfirmStatus={setConfirmStatus}
                            hasAutofilledData={hasAutofilledData}
                          />
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
