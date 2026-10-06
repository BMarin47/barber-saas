'use client'

import React from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Scissors,
  User,
  Clock,
  Check,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import { ServiceItem, ProfessionalItem } from '@/types/booking'

interface StepServiceAndProfessionalProps {
  services: ServiceItem[]
  professionals: ProfessionalItem[]
  selectedService: ServiceItem | null
  selectedProfessional: ProfessionalItem | null
  onSelectService: (service: ServiceItem) => void
  onSelectProfessional: (professional: ProfessionalItem) => void
  onAdvanceToStep2?: () => void
  onNext?: () => void
  currency?: string
}

// Framer Motion Animation Variants for Staggered Fade-Up with GPU-accelerated Spring
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
}

const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 360,
      damping: 26,
    },
  },
}

export const StepServiceAndProfessional: React.FC<StepServiceAndProfessionalProps> = ({
  services,
  professionals,
  selectedService,
  selectedProfessional,
  onSelectService,
  onSelectProfessional,
  onAdvanceToStep2,
  currency = 'ARS',
}) => {
  const handleServiceSelect = (service: ServiceItem) => {
    // 1. Inmediatamente actualizar estado para reflejar tarjeta activa
    onSelectService(service)

    // 2. Retraso obligatorio de 400ms para percibir feedback visual antes de colapsar
    if (onAdvanceToStep2) {
      setTimeout(() => {
        onAdvanceToStep2()
      }, 400)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : 'USD',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const canContinue = !!selectedService && !!selectedProfessional

  const getProfessionalBadge = (pro: ProfessionalItem) => {
    if (pro.id === 'pro-any') {
      return {
        text: '⚡ Turno Rápido',
        className: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]',
      }
    }
    if (pro.id === 'pro-1' || pro.name.toLowerCase().includes('maestro')) {
      return {
        text: '⭐ Más Elegido',
        className: 'bg-violet-500/10 text-violet-300 border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.15)]',
      }
    }
    if (pro.id === 'pro-2' || pro.role.toLowerCase().includes('fade')) {
      return {
        text: '🔥 Experto en Degradé',
        className: 'bg-violet-500/10 text-violet-300 border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.15)]',
      }
    }
    if (pro.id === 'pro-3' || pro.role.toLowerCase().includes('barba')) {
      return {
        text: '✂️ Experto en Barba',
        className: 'bg-violet-500/10 text-violet-300 border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.15)]',
      }
    }
    return {
      text: '⭐ Barbero Oficial',
      className: 'bg-violet-500/10 text-violet-300 border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.15)]',
    }
  }

  return (
    <div className="space-y-8">
      {/* Sub-Header Context */}
      <div className="border-b border-white/[0.08] pb-4">
        <p className="text-xs sm:text-sm text-zinc-400">
          Selecciona el corte o combo y el profesional con quien deseas atenderte. Al completar ambos, avanzas automáticamente.
        </p>
      </div>

      {/* ========================================================= */}
      {/* SECCIÓN 1: 3 SERVICIOS CON PALETA TECH MINIMALIST         */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            1. Elige tu Servicio
          </label>
          {selectedService && (
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {selectedService.name} seleccionado
            </span>
          )}
        </div>

        {/* Staggered Grid de 3 Tarjetas con Glassmorphism suave y Scroll Reveal */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
        >
          {services.map((service) => {
            const isSelected = selectedService?.id === service.id
            const isPopular = service.popular || (service.name.toLowerCase().includes('barba') && service.name.toLowerCase().includes('corte'))

            return (
              <motion.div
                key={service.id}
                variants={cardItemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleServiceSelect(service)}
                className={`group relative rounded-3xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between border backdrop-blur-md ${
                  isSelected
                    ? 'bg-zinc-900/80 border-violet-500 ring-2 ring-violet-500/80 shadow-[0_0_25px_rgba(139,92,246,0.25)]'
                    : 'bg-white/[0.03] border-white/[0.08] hover:border-zinc-700 hover:bg-white/[0.05]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                          : 'bg-white/[0.05] text-zinc-400 border border-white/[0.08] group-hover:text-violet-400 group-hover:border-violet-500/30'
                      }`}
                    >
                      <Scissors className="w-5 h-5 stroke-[2]" />
                    </div>

                    {/* Radio Checkmark */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-violet-600 border-violet-400 text-white shadow-sm shadow-violet-600/40'
                          : 'border-zinc-700 bg-zinc-900/60 group-hover:border-zinc-500'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="mb-2">
                    {isPopular ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-violet-500/10 text-violet-300 border border-violet-500/20 mb-1.5">
                        <Sparkles className="w-2.5 h-2.5 text-violet-400" /> Combo VIP
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 block mb-1.5">
                        Servicio Individual
                      </span>
                    )}

                    <h3 className={`text-lg sm:text-xl font-bold transition-colors ${
                      isSelected ? 'text-white' : 'text-zinc-100 group-hover:text-white'
                    }`}>
                      {service.name}
                    </h3>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                    {service.description}
                  </p>
                </div>

                {/* Card Footer: Duration & Price */}
                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{service.duration} min</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block uppercase font-medium tracking-wider">
                      Precio
                    </span>
                    <span
                      className={`text-2xl font-black tracking-tight transition-colors ${
                        isSelected ? 'text-violet-400' : 'text-white'
                      }`}
                    >
                      {formatPrice(service.price)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* SECCIÓN 2: MICRO-INTERACCIONES EN LOS BARBEROS            */}
      {/* ========================================================= */}
      <div className="space-y-3 pt-6 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-violet-400" />
            2. Elige con quién te Atiendes
          </label>
          {selectedProfessional && (
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {selectedProfessional.name} seleccionado
            </span>
          )}
        </div>

        {/* Grilla de Barberos con Anillo Suave y Scroll Reveal */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
        >
          {professionals.map((pro) => {
            const isSelected = selectedProfessional?.id === pro.id
            const isAny = pro.id === 'pro-any'
            const badge = getProfessionalBadge(pro)

            return (
              <motion.div
                key={pro.id}
                variants={cardItemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectProfessional(pro)}
                className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between border backdrop-blur-md ${
                  isSelected
                    ? 'bg-zinc-900/90 border-violet-500 ring-2 ring-violet-500/80 shadow-[0_0_20px_rgba(139,92,246,0.25)]'
                    : 'bg-white/[0.03] border-white/[0.08] ring-1 ring-white/[0.04] hover:border-zinc-700 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar con Anillo Iluminado cuando está seleccionado */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-12 h-12 rounded-xl overflow-hidden p-[2px] transition-all ${
                        isSelected
                          ? 'bg-violet-600 ring-2 ring-violet-500 shadow-md shadow-violet-600/30'
                          : 'bg-zinc-800 group-hover:bg-zinc-700'
                      }`}
                    >
                      {isAny ? (
                        <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                          <Zap className="w-5 h-5 text-violet-400" />
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pro.avatarUrl}
                          alt={pro.name}
                          className="w-full h-full object-cover rounded-[10px]"
                        />
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400 truncate">
                        {pro.role}
                      </span>

                      {/* Mini Check */}
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-violet-600 border-violet-400 text-white'
                            : 'border-zinc-700 bg-zinc-800'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors truncate mt-0.5">
                      {pro.name}
                    </h4>

                    {/* Luminous Badge & Rating */}
                    <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-white/[0.06]">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${badge.className}`}>
                        {badge.text}
                      </span>

                      <div className="flex items-center gap-1 text-[11px] text-zinc-400 shrink-0">
                        <Star className="w-3 h-3 fill-violet-400 text-violet-400" />
                        <span className="text-zinc-200 font-semibold">{pro.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Feedback de Selección y Auto-Avance */}
      <div className="pt-2 text-center">
        {canContinue ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Servicio y profesional elegidos. Avanzando a fecha y horario...</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-zinc-400 text-xs font-medium">
            <span>
              {!selectedService
                ? 'Elige un servicio arriba para continuar'
                : 'Ahora elige con qué barbero deseas atenderte'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
