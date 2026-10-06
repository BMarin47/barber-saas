'use client'

import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  User,
  Scissors,
  MapPin,
  MessageCircle,
  CheckCircle2,
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  Shield,
  Loader2,
} from 'lucide-react'
import {
  TenantInfo,
  ServiceItem,
  ProfessionalItem,
  ClientDetails,
} from '@/types/booking'

interface StepConfirmationProps {
  tenant: TenantInfo
  service: ServiceItem
  professional: ProfessionalItem
  date: string // YYYY-MM-DD
  time: string // HH:MM
  client: ClientDetails
  onChangeClient: (field: keyof ClientDetails, value: string) => void
  onConfirmBooking: (fullPhone?: string) => Promise<void>
  onBack: () => void
  currency?: string
}

export const StepConfirmation: React.FC<StepConfirmationProps> = ({
  tenant,
  service,
  professional,
  date,
  time,
  client,
  onChangeClient,
  onConfirmBooking,
  onBack,
  currency = 'ARS',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  // Format date nicely: "Miércoles 7 de Octubre, 2026"
  const formattedDate = React.useMemo(() => {
    if (!date) return ''
    const parts = date.split('-')
    if (parts.length !== 3) return date
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d)
  }, [date])

  const TARGET_WHATSAPP_NUMBER = '5492604654255'

  // Format date to strictly DD/MM/YYYY
  const formatDDMMYYYY = (dateStr: string): string => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const [year, month, day] = parts
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
    }
    return dateStr
  }

  // Format price to e.g. "$15.000"
  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('es-AR')}`
  }

  // Validate form
  const validate = () => {
    const errs: { name?: string; phone?: string } = {}
    if (!client.name.trim()) {
      errs.name = 'Por favor ingresa tu nombre y apellido'
    }
    const cleanDigits = client.phone.replace(/\D/g, '')
    if (!cleanDigits) {
      errs.phone = 'Por favor ingresa tu número de WhatsApp'
    } else if (cleanDigits.length < 6) {
      errs.phone = 'Ingresa un número de teléfono válido (ej: 260 465 4255)'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Build the preformatted WhatsApp URL strictly according to requirements
  const buildWhatsAppUrl = () => {
    const formattedDateDDMMYYYY = formatDDMMYYYY(date)
    const formattedPrice = formatPrice(service.price)
    const phone = client.phone
    const fullPhone = "549" + phone

    const message = [
      'Hola, quiero confirmar mi reserva en la barbería.',
      `👤 Cliente: ${client.name.trim()}`,
      `✂️ Servicio: ${service.name} - ${formattedPrice}`,
      `💈 Profesional: ${professional.name}`,
      `📅 Fecha: ${formattedDateDDMMYYYY}`,
      `⏰ Hora: ${time}`,
    ].join('\n')

    return `https://wa.me/${TARGET_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
  }

  // Intercept confirm event and redirect to WhatsApp
  const handleConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!validate()) return

    const phone = client.phone
    const fullPhone = "549" + phone

    setIsSubmitting(true)
    try {
      const whatsappUrl = buildWhatsAppUrl()
      // Open in a new tab immediately
      window.open(whatsappUrl, '_blank')
      await onConfirmBooking(fullPhone)
    } catch (error) {
      console.error('Error confirming booking:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-violet-400" />
            <span>Confirmación de Turno</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Revisa el resumen y completa tus datos de contacto para asegurar tu lugar
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] text-zinc-300 hover:text-white hover:border-zinc-700 text-sm font-semibold transition-all cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Modificar Fecha/Hora</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Booking Summary Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl bg-zinc-900/30 border border-white/[0.08] p-6 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Resumen de tu Turno
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-violet-500/10 text-violet-300 border border-violet-500/20">
                Por Confirmar
              </span>
            </div>

            {/* Service & Price */}
            <div className="space-y-4">
              <div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <Scissors className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-medium">Servicio</span>
                    <h3 className="text-base font-bold text-white">{service.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{service.duration} minutos de atención</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional */}
              <div className="flex items-start gap-3 pt-3 border-t border-white/[0.06]">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-medium">Profesional</span>
                  <h4 className="text-sm font-bold text-white">{professional.name}</h4>
                  <span className="text-xs text-violet-400 font-medium">{professional.role}</span>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-start gap-3 pt-3 border-t border-white/[0.06]">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-medium">Día y Horario</span>
                  <p className="text-sm font-bold text-white capitalize">{formattedDate}</p>
                  <p className="text-xs font-semibold text-violet-400 mt-0.5">{time} hs</p>
                </div>
              </div>

              {/* Location */}
              {tenant.address && (
                <div className="flex items-start gap-3 pt-3 border-t border-white/[0.06]">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-medium">Ubicación</span>
                    <p className="text-xs text-zinc-300 font-medium">{tenant.address}</p>
                  </div>
                </div>
              )}

              {/* Total Price Banner */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 block">Total a pagar:</span>
                  <span className="text-[11px] text-emerald-400 font-medium">En el local al finalizar</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white tracking-tight">
                    {formatPrice(service.price)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-zinc-900/30 border border-white/[0.06] text-xs text-zinc-400">
            <Shield className="w-4 h-4 text-violet-400 shrink-0" />
            <span>Cancelación gratuita avisando con 2 horas de anticipación.</span>
          </div>
        </div>

        {/* Right Column: Customer Details Form & Action Buttons */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl bg-zinc-900/30 border border-white/[0.08] p-6 md:p-7 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <User className="w-5 h-5 text-violet-400" />
              <span>Tus Datos de Contacto</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              Te enviaremos la confirmación del turno por WhatsApp
            </p>

            <form onSubmit={handleConfirm} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Nombre y Apellido <span className="text-violet-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={client.name}
                    onChange={(e) => onChangeClient('name', e.target.value)}
                    placeholder="Ej. Lucas González"
                    className={`w-full px-4 py-3 pl-11 rounded-2xl bg-zinc-950/60 border text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all ${
                      errors.name ? 'border-rose-500' : 'border-white/[0.08] focus:border-violet-500'
                    }`}
                  />
                  <User className="w-4 h-4 text-zinc-500 absolute left-4 top-3.5" />
                </div>
                {errors.name && (
                  <p className="text-xs text-rose-400 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Phone / WhatsApp */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Teléfono / WhatsApp <span className="text-violet-400">*</span>
                </label>
                <div
                  className={`flex items-stretch rounded-2xl bg-zinc-950/60 border transition-all overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/30 ${
                    errors.phone
                      ? 'border-rose-500'
                      : 'border-white/[0.08] focus-within:border-violet-500'
                  }`}
                >
                  {/* Prefijo fijo no editable */}
                  <div className="flex items-center px-4 bg-white/[0.04] border-r border-white/[0.08] text-zinc-300 text-sm font-semibold select-none shrink-0">
                    <span>+54 9</span>
                  </div>

                  {/* Input local limpio sin bordes propios */}
                  <input
                    type="tel"
                    required
                    value={client.phone}
                    onChange={(e) => onChangeClient('phone', e.target.value)}
                    placeholder="Ej: 260 465 4255"
                    className="w-full px-4 py-3 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none border-0"
                  />
                </div>
                {errors.phone ? (
                  <p className="text-xs text-rose-400 mt-1">{errors.phone}</p>
                ) : (
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Ingresa tu código de área y número (el prefijo +54 9 ya está incluido)
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Correo Electrónico <span className="text-zinc-500">(Opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={client.email}
                    onChange={(e) => onChangeClient('email', e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full px-4 py-3 pl-11 rounded-2xl bg-zinc-950/60 border border-white/[0.08] focus:border-violet-500 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-4 top-3.5" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Comentarios o Pedidos Especiales <span className="text-zinc-500">(Opcional)</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={client.notes}
                    onChange={(e) => onChangeClient('notes', e.target.value)}
                    placeholder="Ej. Prefiero degradé bajo y toalla tibia..."
                    className="w-full px-4 py-3 pl-11 rounded-2xl bg-zinc-950/60 border border-white/[0.08] focus:border-violet-500 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all resize-none"
                  />
                  <FileText className="w-4 h-4 text-zinc-500 absolute left-4 top-3.5" />
                </div>
              </div>

              {/* Booking Action */}
              <div className="pt-4 space-y-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/35 transition-all duration-200 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <MessageCircle className="w-5 h-5 fill-white stroke-none" />
                  )}
                  <span>Confirmar</span>
                </button>
                <p className="text-center text-xs text-zinc-400">
                  Al confirmar, se abrirá WhatsApp con el resumen de tu reserva preformateado.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
