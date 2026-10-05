'use client'

import React from 'react'
import { User, Star, Check, ArrowRight, ArrowLeft, Zap, ShieldCheck } from 'lucide-react'
import { ProfessionalItem } from '@/types/booking'

interface StepProfessionalProps {
  professionals: ProfessionalItem[]
  selectedProfessional: ProfessionalItem | null
  onSelectProfessional: (professional: ProfessionalItem) => void
  onNext: () => void
  onBack: () => void
}

export const StepProfessional: React.FC<StepProfessionalProps> = ({
  professionals,
  selectedProfessional,
  onSelectProfessional,
  onNext,
  onBack,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
            <User className="w-6 h-6 text-amber-400" />
            <span>Selecciona tu Profesional</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Elige con qué barbero o estilista deseas realizar tu corte
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 text-sm font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Atrás</span>
          </button>

          {selectedProfessional && (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-500 transition-all cursor-pointer"
            >
              <span>Continuar a Fecha y Hora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Professionals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {professionals.map((pro) => {
          const isSelected = selectedProfessional?.id === pro.id
          const isAny = pro.id === 'pro-any'

          return (
            <div
              key={pro.id}
              onClick={() => onSelectProfessional(pro)}
              className={`group relative rounded-2xl p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between border backdrop-blur-md ${
                isSelected
                  ? 'bg-zinc-900/95 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50'
                  : 'bg-zinc-900/60 border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900/80'
              }`}
            >
              {/* Highlight bar */}
              <div
                className={`absolute top-0 left-6 right-6 h-[2px] rounded-full transition-opacity duration-300 ${
                  isSelected ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-600 opacity-100' : 'opacity-0 group-hover:opacity-100 bg-amber-500/40'
                }`}
              />

              <div className="flex items-start gap-4">
                {/* Avatar with gold border ring */}
                <div className="relative shrink-0">
                  <div
                    className={`w-16 h-16 rounded-2xl overflow-hidden p-[2px] transition-all ${
                      isSelected
                        ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 shadow-md shadow-amber-500/30'
                        : 'bg-zinc-800 group-hover:bg-amber-500/40'
                    }`}
                  >
                    {isAny ? (
                      <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                        <Zap className="w-7 h-7 text-amber-400" />
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pro.avatarUrl}
                        alt={pro.name}
                        className="w-full h-full object-cover rounded-[14px]"
                      />
                    )}
                  </div>

                  {pro.availableToday && (
                    <span
                      title="Disponible Hoy"
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-zinc-950 rounded-full"
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90">
                          {pro.role}
                        </span>
                        {isAny && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Más Rápido
                          </span>
                        )}
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-zinc-100 group-hover:text-amber-300 transition-colors truncate">
                        {pro.name}
                      </h3>
                    </div>

                    {/* Radio / Selection Indicator */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-amber-500 border-amber-400 text-zinc-950 shadow-md shadow-amber-500/40'
                          : 'border-zinc-700 bg-zinc-800/60 group-hover:border-amber-500/60'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                    {pro.bio}
                  </p>
                </div>
              </div>

              {/* Footer info: Rating & Next availability */}
              <div className="pt-3 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-zinc-200">{pro.rating}</span>
                  <span className="text-zinc-500">({pro.reviewCount} turnos)</span>
                </div>

                <div className="flex items-center gap-1 text-zinc-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500/80" />
                  <span className="text-[11px] text-amber-300/80">{pro.nextAvailableSlot || 'Disponible'}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sticky Mobile Next Button */}
      {selectedProfessional && (
        <div className="pt-4 flex sm:hidden">
          <button
            type="button"
            onClick={onNext}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <span>Continuar a Fecha y Hora</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
