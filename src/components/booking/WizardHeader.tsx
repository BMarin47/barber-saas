'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Scissors, Calendar, CheckCircle2, Star, MapPin } from 'lucide-react'
import { TenantInfo } from '@/types/booking'

interface WizardHeaderProps {
  tenant: TenantInfo
  currentStep: number
  onStepClick?: (step: number) => void
  canNavigateToStep?: (step: number) => boolean
}

const STEPS = [
  { step: 1, title: 'Servicio & Barbero', icon: Scissors, subtitle: 'Qué y con quién' },
  { step: 2, title: 'Fecha y Hora', icon: Calendar, subtitle: 'Cuándo venís' },
  { step: 3, title: 'Confirmación', icon: CheckCircle2, subtitle: 'Tus datos y WhatsApp' },
]

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  tenant,
  currentStep,
  onStepClick,
  canNavigateToStep,
}) => {
  return (
    <header className="w-full mb-6">
      {/* Top Banner / Tenant Identity (Clean Tech Minimalist) */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900/30 border border-white/[0.08] p-5 md:p-6 backdrop-blur-xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start md:items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center shadow-inner">
                <Scissors className="w-7 h-7 text-violet-400" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-black rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                  Salón Oficial
                </span>
                <div className="flex items-center gap-1 text-xs text-zinc-300 font-medium">
                  <Star className="w-3.5 h-3.5 fill-violet-400 text-violet-400" />
                  <span className="text-white font-bold">{tenant.rating || '4.95'}</span>
                  <span className="text-zinc-500">({tenant.reviewCount || 382})</span>
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-1">
                {tenant.name}
              </h1>

              {tenant.address && (
                <p className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span>{tenant.address}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-zinc-500 block">Horario de atención</span>
              <span className="text-xs font-semibold text-zinc-300">Lun a Sáb: 09:00 - 21:00 hs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Progress Bar (Minimalist iOS Style) */}
      <nav aria-label="Progreso de Reserva" className="w-full">
        <div className="grid grid-cols-3 gap-2 md:gap-3 relative">
          {STEPS.map((s) => {
            const Icon = s.icon
            const isActive = currentStep === s.step
            const isCompleted = currentStep > s.step
            const canClick = canNavigateToStep ? canNavigateToStep(s.step) : isCompleted

            return (
              <motion.button
                key={s.step}
                type="button"
                disabled={!canClick && !isActive}
                onClick={() => canClick && onStepClick?.(s.step)}
                whileHover={canClick ? { scale: 1.015 } : undefined}
                whileTap={canClick ? { scale: 0.97 } : undefined}
                className={`relative group text-left transition-all duration-200 rounded-2xl p-3 md:p-3.5 border ${
                  isActive
                    ? 'bg-zinc-900/90 border-violet-500 ring-1 ring-violet-500/50 shadow-sm'
                    : isCompleted
                    ? 'bg-zinc-900/30 border-white/[0.08] hover:border-zinc-700 cursor-pointer'
                    : 'bg-zinc-950/20 border-white/[0.04] opacity-50 cursor-not-allowed'
                }`}
              >
                {/* Active Indicator Line */}
                <div
                  className={`absolute top-0 left-4 right-4 h-[2px] rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-violet-500'
                      : isCompleted
                      ? 'bg-violet-500/40'
                      : 'bg-transparent'
                  }`}
                />

                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                        : isCompleted
                        ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 text-violet-400" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <span
                      className={`block text-[10px] font-semibold uppercase tracking-wider ${
                        isActive ? 'text-violet-400' : isCompleted ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      Paso {s.step}
                    </span>
                    <span
                      className={`block text-xs md:text-sm font-semibold truncate ${
                        isActive ? 'text-white' : isCompleted ? 'text-zinc-300' : 'text-zinc-500'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
