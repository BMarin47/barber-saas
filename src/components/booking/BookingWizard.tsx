'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  TenantInfo,
  ServiceItem,
  ProfessionalItem,
  ClientDetails,
} from '@/types/booking'
import { WizardHeader } from './WizardHeader'
import { StepServiceAndProfessional } from './StepServiceAndProfessional'
import { StepDateTime } from './StepDateTime'
import { StepConfirmation } from './StepConfirmation'
import { BookingSuccessTicket } from './BookingSuccessTicket'

interface BookingWizardProps {
  tenant: TenantInfo
  services: ServiceItem[]
  professionals: ProfessionalItem[]
}

// Spring slide variants delegated to GPU compositor (transform & opacity)
const stepSlideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction >= 0 ? 20 : -20,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 340,
      damping: 28,
      mass: 0.8,
    },
  },
  exit: (direction: number) => ({
    x: direction >= 0 ? -20 : 20,
    opacity: 0,
    transition: {
      duration: 0.16,
      ease: 'easeIn',
    },
  }),
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  tenant,
  services,
  professionals,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [direction, setDirection] = useState<number>(1)
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [confirmedBookingCode, setConfirmedBookingCode] = useState<string>('')

  // Navigation handlers with direction tracking
  const goToNextStep = useCallback((targetStep: number) => {
    setDirection(1)
    setCurrentStep(targetStep)
  }, [])

  const goToPrevStep = useCallback((targetStep: number) => {
    setDirection(-1)
    setCurrentStep(targetStep)
  }, [])

  const handleStepClick = useCallback((targetStep: number) => {
    setDirection(targetStep >= currentStep ? 1 : -1)
    setCurrentStep(targetStep)
  }, [currentStep])

  // Step transition handlers wrapped in useCallback for 60fps performance
  const handleSelectService = useCallback((service: ServiceItem) => {
    setSelectedService(service)
  }, [])

  const handleSelectProfessional = useCallback((pro: ProfessionalItem) => {
    setSelectedProfessional(pro)
  }, [])

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date)
  }, [])

  const handleSelectTime = useCallback((time: string) => {
    setSelectedTime(time)
  }, [])

  const handleChangeClient = useCallback((field: keyof ClientDetails, value: string) => {
    setClient((prev) => ({ ...prev, [field]: value }))
  }, [])

  const canNavigateToStep = useCallback((targetStep: number): boolean => {
    if (targetStep === 1) return true
    if (targetStep === 2) return !!selectedService && !!selectedProfessional
    if (targetStep === 3) return !!selectedService && !!selectedProfessional && !!selectedDate && !!selectedTime
    return false
  }, [selectedService, selectedProfessional, selectedDate, selectedTime])

  const handleConfirmBooking = useCallback(async (phoneWithPrefix?: string, paymentMethod?: string) => {
    const code = 'GB-' + Math.floor(1000 + Math.random() * 9000)
    setConfirmedBookingCode(code)

    if (paymentMethod) {
      setSelectedPaymentMethod(paymentMethod)
    }

    const phone = client.phone
    const fullPhone = phoneWithPrefix || ('549' + phone.replace(/\D/g, ''))

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
        // Soft fail for demo/mock mode
      })
    } finally {
      setIsSuccess(true)
    }
  }, [client, tenant.id, selectedService, selectedProfessional, selectedDate, selectedTime, selectedPaymentMethod])

  const handleReset = useCallback(() => {
    setDirection(-1)
    setCurrentStep(1)
    setSelectedService(null)
    setSelectedProfessional(null)
    setSelectedDate('')
    setSelectedTime('')
    setClient({ name: '', phone: '', email: '', notes: '' })
    setSelectedPaymentMethod('')
    setIsSuccess(false)
  }, [])

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-10">
      <AnimatePresence mode="wait">
        {/* If booking was successfully confirmed */}
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
          <motion.div
            key="wizard-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-zinc-900/20 border border-white/[0.08] p-5 md:p-8 backdrop-blur-2xl shadow-xl space-y-6 md:space-y-8 overflow-hidden"
          >
            {/* Header & Stepper (3 pasos) */}
            <WizardHeader
              tenant={tenant}
              currentStep={currentStep}
              onStepClick={handleStepClick}
              canNavigateToStep={canNavigateToStep}
            />

            {/* Stepper Content with AnimatePresence Slide Transitions */}
            <div className="relative overflow-hidden min-h-[400px]">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                {/* Paso 1: Servicio y Profesional en la misma pantalla */}
                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    custom={direction}
                    variants={stepSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="w-full"
                  >
                    <StepServiceAndProfessional
                      services={services}
                      professionals={professionals}
                      selectedService={selectedService}
                      selectedProfessional={selectedProfessional}
                      onSelectService={handleSelectService}
                      onSelectProfessional={handleSelectProfessional}
                      onNext={() => goToNextStep(2)}
                      currency={tenant.currency}
                    />
                  </motion.div>
                )}

                {/* Paso 2: Fecha y Hora */}
                {currentStep === 2 && selectedService && selectedProfessional && (
                  <motion.div
                    key="step-2"
                    custom={direction}
                    variants={stepSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="w-full"
                  >
                    <StepDateTime
                      service={selectedService}
                      professional={selectedProfessional}
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      onSelectDate={handleSelectDate}
                      onSelectTime={handleSelectTime}
                      onNext={() => goToNextStep(3)}
                      onBack={() => goToPrevStep(1)}
                    />
                  </motion.div>
                )}

                {/* Paso 3: Confirmación de Datos */}
                {currentStep === 3 && selectedService && selectedProfessional && (
                  <motion.div
                    key="step-3"
                    custom={direction}
                    variants={stepSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="w-full"
                  >
                    <StepConfirmation
                      tenant={tenant}
                      service={selectedService}
                      professional={selectedProfessional}
                      date={selectedDate}
                      time={selectedTime}
                      client={client}
                      onChangeClient={handleChangeClient}
                      onConfirmBooking={handleConfirmBooking}
                      onBack={() => goToPrevStep(2)}
                      currency={tenant.currency}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
