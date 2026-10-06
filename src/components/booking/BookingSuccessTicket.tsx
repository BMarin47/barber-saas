'use client'

import React from 'react'
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Scissors,
  MapPin,
  MessageCircle,
  RotateCcw,
  Sparkles,
  Share2,
} from 'lucide-react'
import { TenantInfo, ServiceItem, ProfessionalItem, ClientDetails } from '@/types/booking'

interface BookingSuccessTicketProps {
  tenant: TenantInfo
  service: ServiceItem
  professional: ProfessionalItem
  date: string
  time: string
  client: ClientDetails
  bookingCode?: string
  onReset: () => void
  currency?: string
}

export const BookingSuccessTicket: React.FC<BookingSuccessTicketProps> = ({
  tenant,
  service,
  professional,
  date,
  time,
  client,
  bookingCode = 'GB-' + Math.floor(1000 + Math.random() * 9000),
  onReset,
  currency = 'ARS',
}) => {
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

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('es-AR')}`
  }

  const formatDDMMYYYY = (dateStr: string): string => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const [year, month, day] = parts
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
    }
    return dateStr
  }

  const whatsappMessage = [
    'Hola, quiero confirmar mi reserva en la barbería.',
    `👤 Cliente: ${client.name.trim()}`,
    `✂️ Servicio: ${service.name} - ${formatPrice(service.price)}`,
    `💈 Profesional: ${professional.name}`,
    `📅 Fecha: ${formatDDMMYYYY(date)}`,
    `⏰ Hora: ${time}`,
  ].join('\n')

  const whatsappUrl = `https://wa.me/5492604654255?text=${encodeURIComponent(whatsappMessage)}`

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Mi Turno en ${tenant.name}`,
        text: `Tengo turno para ${service.name} el ${formattedDate} a las ${time} hs en ${tenant.name}!`,
      }).catch(() => {})
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fadeIn py-4">
      {/* Success Badge Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-100">
          ¡Tu Reserva fue Registrada con Éxito!
        </h2>
        <p className="text-sm text-zinc-400">
          Hemos agendado tu turno. Guarda este comprobante para tu cita.
        </p>
      </div>

      {/* Tech Minimalist Ticket Voucher */}
      <div className="relative rounded-3xl bg-zinc-900/40 border border-white/[0.08] p-6 md:p-8 backdrop-blur-2xl shadow-[0_0_35px_rgba(139,92,246,0.1)] overflow-hidden">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Ticket Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
          <div>
            <div className="flex items-center gap-1.5 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pase Oficial de Turno</span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white">{tenant.name}</h3>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-zinc-500 block uppercase font-mono">Código</span>
            <span className="text-sm md:text-base font-mono font-extrabold text-violet-400">
              #{bookingCode}
            </span>
          </div>
        </div>

        {/* Ticket Body / Cutout Simulation */}
        <div className="py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-zinc-500 block uppercase">Servicio</span>
              <p className="text-sm md:text-base font-bold text-zinc-100 flex items-center gap-1.5 mt-0.5">
                <Scissors className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">{service.name}</span>
              </p>
            </div>

            <div>
              <span className="text-xs text-zinc-500 block uppercase">Profesional</span>
              <p className="text-sm md:text-base font-bold text-zinc-100 flex items-center gap-1.5 mt-0.5">
                <User className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">{professional.name}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-xs text-zinc-500 block uppercase">Fecha</span>
              <p className="text-sm font-semibold text-zinc-200 capitalize flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
                <span>{formattedDate}</span>
              </p>
            </div>

            <div>
              <span className="text-xs text-zinc-500 block uppercase">Hora</span>
              <p className="text-sm font-semibold text-violet-400 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-4 h-4 text-violet-400 shrink-0" />
                <span>{time} hs ({service.duration} min)</span>
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <span className="text-xs text-zinc-500 block uppercase">Cliente</span>
            <p className="text-sm font-bold text-zinc-200">{client.name}</p>
            <p className="text-xs text-zinc-400">
              {client.phone ? (client.phone.startsWith('+') ? client.phone : `+54 9 ${client.phone}`) : ''} {client.email ? `• ${client.email}` : ''}
            </p>
          </div>

          {tenant.address && (
            <div className="pt-2">
              <span className="text-xs text-zinc-500 block uppercase">Dirección</span>
              <p className="text-xs text-zinc-300 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-violet-400" />
                <span>{tenant.address}</span>
              </p>
            </div>
          )}
        </div>

        {/* Perforated separator */}
        <div className="relative my-2">
          <div className="border-b border-dashed border-zinc-700/60 w-full" />
          <div className="absolute -left-10 -top-3 w-6 h-6 rounded-full bg-zinc-950 border-r border-white/10" />
          <div className="absolute -right-10 -top-3 w-6 h-6 rounded-full bg-zinc-950 border-l border-white/10" />
        </div>

        {/* Ticket Footer / Total */}
        <div className="pt-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-500 block uppercase">Total a abonar</span>
            <span className="text-2xl font-black text-violet-400 tracking-tight">
              {formatPrice(service.price)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] transition-all cursor-pointer"
              title="Compartir Comprobante"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
            >
              <MessageCircle className="w-4 h-4 fill-white stroke-none" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Reset / Make another booking */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] hover:border-violet-500/50 text-zinc-300 hover:text-zinc-100 text-xs font-semibold transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-violet-400" />
          <span>Realizar otra reserva</span>
        </button>
      </div>
    </div>
  )
}
