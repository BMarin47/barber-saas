'use client'

import React from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Scissors,
  User,
  Clock,
  Check,
  Sparkles,
  ArrowRight,
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
  onNext: () => void
  currency?: string
}

// Framer Motion Animation Variants for Staggered Fade-Up
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}

const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
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
  onNext,
  currency = 'ARS',
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : 'USD',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const canContinue = !!selectedService && !!selectedProfessional

  return (
    <div className="space-y-8">
      {/* Top Header / Context & Continue Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-100 flex items-center gap-2.5">
            <Scissors className="w-6 h-6 text-amber-400" />
            <span>Servicio & Profesional</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Elige el servicio deseado y con qué barbero deseas atenderte
          </p>
        </div>

        {canContinue && (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 hover:from-amber-400 hover:to-yellow-500 transition-all cursor-pointer self-start sm:self-auto hover:scale-105 active:scale-95"
          >
            <span>Continuar a Fecha y Hora</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECCIÓN 1: 3 SERVICIOS ACTUALIZADOS CON FRAMER MOTION    */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            1. Elige tu Servicio
          </label>
          {selectedService && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {selectedService.name} seleccionado
            </span>
          )}
        </div>

        {/* Staggered Grid de 3 Tarjetas de Servicio */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        >
          {services.map((service) => {
            const isSelected = selectedService?.id === service.id
            const isPopular = service.popular || service.name.toLowerCase().includes('barba') && service.name.toLowerCase().includes('corte')

            return (
              <motion.div
                key={service.id}
                variants={cardItemVariants}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectService(service)}
                className={`group relative rounded-3xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between border backdrop-blur-md ${
                  isSelected
                    ? 'bg-zinc-900/90 border-amber-500 ring-2 ring-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:border-amber-500/60 hover:bg-zinc-900/80 hover:shadow-[0_0_30px_rgba(217,119,6,0.3)]'
                }`}
              >
                {/* Gold Highlight Line on Top */}
                <div
                  className={`absolute top-0 left-8 right-8 h-[3px] rounded-full transition-opacity duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-600 opacity-100'
                      : 'opacity-0 group-hover:opacity-100 bg-amber-500/40'
                  }`}
                />

                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/40'
                          : 'bg-zinc-800/90 text-amber-400 border border-zinc-700/60 group-hover:border-amber-500/40'
                      }`}
                    >
                      <Scissors className="w-6 h-6 stroke-[2.5]" />
                    </div>

                    {/* Radio Checkmark */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-amber-500 border-amber-300 text-zinc-950 shadow-md shadow-amber-500/40 scale-110'
                          : 'border-zinc-700 bg-zinc-800/80 group-hover:border-amber-500/60'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="mb-2">
                    {isPopular ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-1.5">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Combo VIP
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                        Servicio Individual
                      </span>
                    )}

                    <h3 className="text-xl font-black text-zinc-100 group-hover:text-amber-300 transition-colors">
                      {service.name}
                    </h3>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                    {service.description}
                  </p>
                </div>

                {/* Card Footer: Duration & Gold Price */}
                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>{service.duration} min</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider">
                      Precio
                    </span>
                    <span
                      className={`text-2xl font-black tracking-tight transition-colors ${
                        isSelected
                          ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]'
                          : 'text-amber-400'
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
      <div className="space-y-3 pt-6 border-t border-zinc-800/60">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" />
            2. Elige con quién te Atiendes
          </label>
          {selectedProfessional && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {selectedProfessional.name} seleccionado
            </span>
          )}
        </div>

        {/* Grilla de Barberos con Anillo Dorado Interactivo */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {professionals.map((pro) => {
            const isSelected = selectedProfessional?.id === pro.id
            const isAny = pro.id === 'pro-any'

            return (
              <motion.div
                key={pro.id}
                variants={cardItemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectProfessional(pro)}
                className={`group relative rounded-2xl p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between border backdrop-blur-md ${
                  isSelected
                    ? 'bg-zinc-900/95 border-amber-500 ring-2 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
                    : 'bg-zinc-900/60 border-zinc-800/80 ring-1 ring-amber-500/20 hover:ring-amber-500/60 hover:border-amber-500/50 hover:bg-zinc-900/80 hover:shadow-[0_0_20px_rgba(217,119,6,0.2)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar con anillo */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-13 h-13 rounded-xl overflow-hidden p-[2px] transition-all ${
                        isSelected
                          ? 'bg-gradient-to-tr from-amber-300 via-amber-500 to-yellow-400 shadow-md shadow-amber-500/40 ring-2 ring-amber-400'
                          : 'bg-zinc-800 group-hover:bg-amber-500/40'
                      }`}
                    >
                      {isAny ? (
                        <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                          <Zap className="w-6 h-6 text-amber-400" />
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
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 truncate">
                        {pro.role}
                      </span>

                      {/* Mini Check */}
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-amber-500 border-amber-300 text-zinc-950 scale-110 shadow-sm shadow-amber-500/40'
                            : 'border-zinc-700 bg-zinc-800'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300 transition-colors truncate">
                      {pro.name}
                    </h4>

                    <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-zinc-200 font-semibold">{pro.rating}</span>
                      <span className="text-zinc-500">({pro.reviewCount})</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Botón Inferior de Continuar */}
      <div className="pt-2">
        <button
          type="button"
          disabled={!canContinue}
          onClick={onNext}
          className={`w-full py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all duration-300 cursor-pointer ${
            canContinue
              ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-zinc-950 hover:from-amber-400 hover:to-yellow-500 shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          <span>
            {canContinue
              ? 'Continuar al Calendario de Turnos'
              : !selectedService
              ? 'Paso 1: Selecciona un servicio arriba'
              : 'Paso 2: Selecciona un profesional arriba'}
          </span>
          {canContinue && <ArrowRight className="w-5 h-5 stroke-[3]" />}
        </button>
      </div>
    </div>
  )
}
