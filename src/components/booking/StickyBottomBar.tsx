'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Scissors,
  User,
  Clock,
  ArrowRight,
  MessageCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { ServiceItem, ProfessionalItem } from '@/types/booking'

interface StickyBottomBarProps {
  currentStep: number
  selectedService: ServiceItem | null
  selectedProfessional: ProfessionalItem | null
  selectedDate: string
  selectedTime: string
  currency?: string
  confirmStatus: 'idle' | 'processing' | 'success'
  onNext: () => void
  onConfirm: () => void
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  currentStep,
  selectedService,
  selectedProfessional,
  selectedDate,
  selectedTime,
  currency = 'ARS',
  confirmStatus,
  onNext,
  onConfirm,
}) => {
  const formattedPrice = useMemo(() => {
    if (!selectedService) return '$0'
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'ARS',
      maximumFractionDigits: 0,
    }).format(selectedService.price)
  }, [selectedService, currency])

  // Formatted date snippet (e.g. 07/10)
  const dateSnippet = useMemo(() => {
    if (!selectedDate) return ''
    const parts = selectedDate.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`
    }
    return selectedDate
  }, [selectedDate])

  const buttonConfig = useMemo(() => {
    if (currentStep === 1) {
      const isReady = !!selectedService && !!selectedProfessional
      let label = 'Continuar a Horarios'
      if (!selectedService) label = 'Elige tu servicio'
      else if (!selectedProfessional) label = 'Elige tu barbero'

      return {
        label,
        disabled: !isReady,
        onClick: onNext,
        icon: <ArrowRight className="w-4 h-4 stroke-[2.5]" />,
        className: isReady
          ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25'
          : 'bg-zinc-900/80 border border-white/5 text-zinc-500 cursor-not-allowed opacity-60',
      }
    }

    if (currentStep === 2) {
      const isReady = !!selectedTime
      const label = isReady ? 'Continuar a Confirmación' : 'Elige un horario'

      return {
        label,
        disabled: !isReady,
        onClick: onNext,
        icon: <ArrowRight className="w-4 h-4 stroke-[2.5]" />,
        className: isReady
          ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25'
          : 'bg-zinc-900/80 border border-white/5 text-zinc-500 cursor-not-allowed opacity-60',
      }
    }

    // Step 3
    if (confirmStatus === 'processing') {
      return {
        label: 'Procesando...',
        disabled: true,
        onClick: () => {},
        icon: <Loader2 className="w-5 h-5 animate-spin text-white" />,
        className: 'bg-violet-600 text-white cursor-wait shadow-lg shadow-violet-600/30',
      }
    }

    if (confirmStatus === 'success') {
      return {
        label: '✅ ¡Reserva Lista!',
        disabled: true,
        onClick: () => {},
        icon: <CheckCircle2 className="w-5 h-5 text-white" />,
        className: 'bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-[1.02]',
      }
    }

    return {
      label: 'Confirmar Reserva',
      disabled: false,
      onClick: onConfirm,
      icon: <MessageCircle className="w-5 h-5 fill-white stroke-none" />,
      className: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/35',
    }
  }, [currentStep, selectedService, selectedProfessional, selectedTime, confirmStatus, onNext, onConfirm])

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className="fixed bottom-0 left-0 w-full z-40 bg-zinc-950/85 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_35px_rgba(0,0,0,0.8)]"
    >
      <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-3.5 flex items-center justify-between gap-4">
        {/* Left Side: Dynamic Total & Summary Badges */}
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <div>
            <span className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider font-semibold block leading-none mb-1">
              Total {selectedService ? 'a pagar' : ''}
            </span>
            <span className="text-lg sm:text-2xl font-black text-white tracking-tight leading-none block">
              {formattedPrice}
            </span>
          </div>

          {/* Contextual Pills (visible on larger screens or when selected) */}
          <div className="hidden sm:flex items-center gap-2 border-l border-white/[0.08] pl-4">
            {selectedService && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-zinc-300 truncate max-w-[150px]">
                <Scissors className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="truncate">{selectedService.name}</span>
              </span>
            )}

            {selectedProfessional && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-zinc-300 truncate max-w-[150px]">
                <User className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="truncate">{selectedProfessional.name}</span>
              </span>
            )}

            {selectedTime && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/10 border border-violet-500/20 text-violet-300 shrink-0">
                <Clock className="w-3.5 h-3.5 text-violet-400" />
                <span>{dateSnippet} {selectedTime} hs</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Primary Sticky Action Button */}
        <div className="shrink-0">
          <motion.button
            type="button"
            disabled={buttonConfig.disabled}
            onClick={buttonConfig.onClick}
            whileHover={!buttonConfig.disabled ? { scale: 1.02 } : undefined}
            whileTap={!buttonConfig.disabled ? { scale: 0.97 } : undefined}
            className={`inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer min-h-[46px] ${buttonConfig.className}`}
          >
            <span>{buttonConfig.label}</span>
            {buttonConfig.icon}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
