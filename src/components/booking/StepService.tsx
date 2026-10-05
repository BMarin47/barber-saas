'use client'

import React, { useState, useMemo } from 'react'
import { Clock, Check, Sparkles, Scissors, ArrowRight } from 'lucide-react'
import { ServiceItem } from '@/types/booking'

interface StepServiceProps {
  services: ServiceItem[]
  selectedService: ServiceItem | null
  onSelectService: (service: ServiceItem) => void
  onNext: () => void
  currency?: string
}

export const StepService: React.FC<StepServiceProps> = ({
  services,
  selectedService,
  onSelectService,
  onNext,
  currency = 'ARS',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(services.map((s) => s.category)))
    return ['Todos', ...cats]
  }, [services])

  // Filtered services
  const filteredServices = useMemo(() => {
    if (selectedCategory === 'Todos') return services
    return services.filter((s) => s.category === selectedCategory)
  }, [services, selectedCategory])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : 'USD',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Step Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
            <Scissors className="w-6 h-6 text-amber-400" />
            <span>Selecciona tu Servicio</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Elige el servicio o tratamiento que deseas realizarte hoy
          </p>
        </div>

        {selectedService && (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-500 transition-all cursor-pointer"
          >
            <span>Continuar con Profesional</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((service) => {
          const isSelected = selectedService?.id === service.id

          return (
            <div
              key={service.id}
              onClick={() => onSelectService(service)}
              className={`group relative rounded-2xl p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between border backdrop-blur-md ${
                isSelected
                  ? 'bg-zinc-900/95 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50'
                  : 'bg-zinc-900/60 border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900/80'
              }`}
            >
              {/* Gold Top Highlight on hover/active */}
              <div
                className={`absolute top-0 left-6 right-6 h-[2px] rounded-full transition-opacity duration-300 ${
                  isSelected ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-600 opacity-100' : 'opacity-0 group-hover:opacity-100 bg-amber-500/40'
                }`}
              />

              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-500/90">
                        {service.category}
                      </span>
                      {service.popular && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Popular
                        </span>
                      )}
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
                      {service.name}
                    </h3>
                  </div>

                  {/* Radio / Check Circle */}
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

                <p className="text-xs md:text-sm text-zinc-400 leading-relaxed mb-4">
                  {service.description}
                </p>
              </div>

              {/* Card Footer: Duration & Price */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{service.duration} minutos</span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-zinc-500 block uppercase tracking-wider">Precio</span>
                  <span className="text-lg md:text-xl font-extrabold text-amber-400 tracking-tight">
                    {formatPrice(service.price)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sticky Mobile Next Button */}
      {selectedService && (
        <div className="pt-4 flex sm:hidden">
          <button
            type="button"
            onClick={onNext}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <span>Continuar con Profesional</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
