'use client'

import React from 'react'
import { BookingWizard } from '@/components/booking/BookingWizard'
import { mockTenant, mockServices, mockProfessionals } from '@/data/mock-tenant'
import { Scissors, ShieldCheck, Database, Layers, CheckCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden flex flex-col">
      {/* Background Decorative Gold Ambient Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] -right-40 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[60%] -left-40 w-96 h-96 bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top System Bar */}
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Scissors className="w-4 h-4 text-zinc-950" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-zinc-100 flex items-center gap-1.5">
                BarberSaaS <span className="text-amber-400 text-xs px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30">Multi-Tenant</span>
              </span>
              <p className="text-[10px] text-zinc-400">Motor de Reservas para Barberías & Salones</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tenant Activo: <strong className="text-amber-400 font-mono">/{mockTenant.slug}</strong></span>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Dark & Gold Elegance
            </span>
          </div>
        </div>
      </nav>

      {/* Hero / Context Sub-Header */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12 pt-6 md:pt-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-300 mb-3">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Vista de Cliente: Flujo de Reserva en 4 Pasos</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100">
          Experiencia de Reserva <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-600">Alta Gama</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mt-2">
          Diseñado para salones que buscan transmitir prestigio, rapidez y confirmar citas directamente a WhatsApp.
        </p>
      </div>

      {/* The 4-Step Booking Wizard */}
      <section className="flex-1">
        <BookingWizard
          tenant={mockTenant}
          services={mockServices}
          professionals={mockProfessionals}
        />
      </section>

      {/* Tech Stack Specs Footer */}
      <footer className="mt-12 border-t border-zinc-900 bg-zinc-950/90 py-6 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-500/80" />
            <span>Arquitectura: Next.js (App Router) • Tailwind CSS • Prisma ORM • Supabase (PostgreSQL)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" /> Multi-Tenant Schema Listo
            </span>
          </div>
        </div>
      </footer>
    </main>
  )
}
