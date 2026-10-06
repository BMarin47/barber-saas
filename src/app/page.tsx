'use client'

import React from 'react'
import { BookingWizard } from '@/components/booking/BookingWizard'
import { mockTenant, mockServices, mockProfessionals } from '@/data/mock-tenant'
import { Scissors, ShieldCheck, Database, Layers, CheckCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-zinc-100 relative overflow-hidden flex flex-col">
      {/* Background Subtle Violet Ambient Lights (Clean Tech Minimalist) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-violet-600/10 via-indigo-600/5 to-transparent blur-[120px] pointer-events-none" />

      {/* Top System Bar */}
      <nav className="border-b border-white/[0.08] bg-black/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-600/20">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                BarberSaaS <span className="text-[11px] font-medium text-violet-400 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">Multi-Tenant</span>
              </span>
              <p className="text-[10px] text-zinc-400">Motor de Reservas para Barberías & Salones</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Tenant: <strong className="text-white font-mono">/{mockTenant.slug}</strong></span>
            </div>

            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Tech Minimalist
            </span>
          </div>
        </div>
      </nav>

      {/* Hero / Context Sub-Header */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-4 md:pt-6 pb-2 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-zinc-300 mb-2">
          <Layers className="w-3.5 h-3.5 text-violet-400" />
          <span>Experiencia Directa • Cero Scroll</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Reservas Online <span className="text-violet-400">Simples y Rápidas</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto mt-1">
          Elige tu servicio, barbero y horario en segundos. Confirmación directa a WhatsApp.
        </p>
      </div>

      {/* The 3-Step Booking Wizard */}
      <section className="flex-1 flex flex-col justify-start">
        <BookingWizard
          tenant={mockTenant}
          services={mockServices}
          professionals={mockProfessionals}
        />
      </section>

      {/* Footer */}
      <footer className="mt-4 border-t border-white/[0.06] bg-black/80 py-3 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-violet-400" />
            <span>Next.js 16 • Tailwind CSS • Prisma ORM • Supabase (PostgreSQL)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" /> Sistema Listo
            </span>
          </div>
        </div>
      </footer>
    </main>
  )
}
