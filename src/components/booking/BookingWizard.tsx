'use client'

import React, { useState } from 'react'
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

export const BookingWizard: React.FC<BookingWizardProps> = ({
  tenant,
  services,
  professionals,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1)
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

  // Step transition handlers
  const handleSelectService = (service: ServiceItem) => {
    setSelectedService(service)
  }

  const handleSelectProfessional = (pro: ProfessionalItem) => {
    setSelectedProfessional(pro)
  }

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
  }

  const handleSelectTime = (time: string) => {
    setSelectedTime(time)
  }

  const handleChangeClient = (field: keyof ClientDetails, value: string) => {
    setClient((prev) => ({ ...prev, [field]: value }))
  }

  const canNavigateToStep = (targetStep: number): boolean => {
    if (targetStep === 1) return true
    if (targetStep === 2) return !!selectedService && !!selectedProfessional
    if (targetStep === 3) return !!selectedService && !!selectedProfessional && !!selectedDate && !!selectedTime
    return false
  }

  const handleConfirmBooking = async (phoneWithPrefix?: string, paymentMethod?: string) => {
    // Generate mock booking code or send to API
    const code = 'GB-' + Math.floor(1000 + Math.random() * 9000)
    setConfirmedBookingCode(code)

    if (paymentMethod) {
      setSelectedPaymentMethod(paymentMethod)
    }

    const phone = client.phone
    const fullPhone = phoneWithPrefix || ('549' + phone.replace(/\D/g, ''))

    try {
      // Optional call to backend API if available
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
  }

  const handleReset = () => {
    setCurrentStep(1)
    setSelectedService(null)
    setSelectedProfessional(null)
    setSelectedDate('')
    setSelectedTime('')
    setClient({ name: '', phone: '', email: '', notes: '' })
    setSelectedPaymentMethod('')
    setIsSuccess(false)
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-10">
      {/* If booking was successfully confirmed */}
      {isSuccess && selectedService && selectedProfessional ? (
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
      ) : (
        <div className="rounded-3xl bg-zinc-900/20 border border-white/[0.08] p-5 md:p-8 backdrop-blur-2xl shadow-xl space-y-6 md:space-y-8">
          {/* Header & Stepper (3 pasos) */}
          <WizardHeader
            tenant={tenant}
            currentStep={currentStep}
            onStepClick={(step) => setCurrentStep(step)}
            canNavigateToStep={canNavigateToStep}
          />

          {/* Paso 1: Servicio y Profesional en la misma pantalla */}
          {currentStep === 1 && (
            <StepServiceAndProfessional
              services={services}
              professionals={professionals}
              selectedService={selectedService}
              selectedProfessional={selectedProfessional}
              onSelectService={handleSelectService}
              onSelectProfessional={handleSelectProfessional}
              onNext={() => setCurrentStep(2)}
              currency={tenant.currency}
            />
          )}

          {/* Paso 2: Fecha y Hora */}
          {currentStep === 2 && selectedService && selectedProfessional && (
            <StepDateTime
              service={selectedService}
              professional={selectedProfessional}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onSelectDate={handleSelectDate}
              onSelectTime={handleSelectTime}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {/* Paso 3: Confirmación de Datos */}
          {currentStep === 3 && selectedService && selectedProfessional && (
            <StepConfirmation
              tenant={tenant}
              service={selectedService}
              professional={selectedProfessional}
              date={selectedDate}
              time={selectedTime}
              client={client}
              onChangeClient={handleChangeClient}
              onConfirmBooking={handleConfirmBooking}
              onBack={() => setCurrentStep(2)}
              currency={tenant.currency}
            />
          )}
        </div>
      )}
    </div>
  )
}
