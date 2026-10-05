'use client'

import React from 'react'
import { Scissors, User, Calendar, CheckCircle2, Star, MapPin, Sparkles } from 'lucide-react'
import { TenantInfo } from '@/types/booking'

interface WizardHeaderProps {
  tenant: TenantInfo
  currentStep: number
  onStepClick?: (step: number) => void
  canNavigateToStep?: (step: number) => boolean
}

const STEPS = [
  { step: 1, title: 'Servicio', icon: Scissors, subtitle: 'Qué te vas a hacer' },
  { step: 2, title: 'Profesional', icon: User, subtitle: 'Con quién te atendés' },
  { step: 3, title: 'Fecha y Hora', icon: Calendar, subtitle: 'Cuándo venís' },
  { step: 4, title: 'Confirmación', icon: CheckCircle2, subtitle: 'Tus datos y WhatsApp' },
]

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  tenant,
  currentStep,
  onStepClick,
  canNavigateToStep,
}) => {
  return (
    <header className="w-full mb-8">
      {/* Top Banner / Tenant Identity */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/80 border border-amber-500/20 p-6 backdrop-blur-xl shadow-2xl mb-8">
        {/* Ambient Gold Glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start md:items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-[2px] shadow-lg shadow-amber-500/20">
                <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                  <Scissors className="w-8 h-8 text-amber-400" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-zinc-950"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Premium Salon
                </span>
                <div className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{tenant.rating || '4.95'}</span>
                  <span className="text-zinc-500">({tenant.reviewCount || 382})</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100 mt-1">
                {tenant.name}
              </h1>
              {tenant.address && (
                <p className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500/80" />
                  <span>{tenant.address}{tenant.city ? `, ${tenant.city}` : ''}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-zinc-400 block">Horario de atención</span>
              <span className="text-sm font-semibold text-zinc-200">Lun a Sáb: 09:00 - 20:30 hs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <nav aria-label="Progreso de Reserva" className="w-full">
        <div className="grid grid-cols-4 gap-2 md:gap-4 relative">
          {STEPS.map((s) => {
            const Icon = s.icon
            const isActive = currentStep === s.step
            const isCompleted = currentStep > s.step
            const canClick = canNavigateToStep ? canNavigateToStep(s.step) : isCompleted

            return (
              <button
                key={s.step}
                type="button"
                disabled={!canClick && !isActive}
                onClick={() => canClick && onStepClick?.(s.step)}
                className={`relative group text-left transition-all duration-300 rounded-xl p-3 md:p-3.5 border ${
                  isActive
                    ? 'bg-zinc-900/90 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : isCompleted
                    ? 'bg-zinc-900/50 border-amber-500/40 hover:border-amber-400 cursor-pointer'
                    : 'bg-zinc-950/40 border-zinc-800/60 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Step indicator top line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500'
                      : isCompleted
                      ? 'bg-amber-500/60'
                      : 'bg-transparent'
                  }`}
                />

                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 shadow-md shadow-amber-500/30'
                        : isCompleted
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 text-amber-400" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <span
                      className={`block text-[11px] font-semibold uppercase tracking-wider ${
                        isActive ? 'text-amber-400' : isCompleted ? 'text-zinc-300' : 'text-zinc-500'
                      }`}
                    >
                      Paso {s.step}
                    </span>
                    <span
                      className={`block text-xs md:text-sm font-medium truncate ${
                        isActive ? 'text-zinc-100 font-semibold' : isCompleted ? 'text-zinc-300' : 'text-zinc-400'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
