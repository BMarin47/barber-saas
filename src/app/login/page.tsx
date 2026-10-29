'use client'

import React from 'react'
import { Scissors, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { mockTenant } from '@/data/mock-tenant'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-100 relative overflow-hidden flex flex-col items-center justify-center px-4 py-10">
      {/* Ambient Violet Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[420px] bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="rounded-3xl bg-zinc-900/40 border border-white/[0.08] p-7 sm:p-9 backdrop-blur-2xl shadow-2xl space-y-6 text-center">
          {/* Logo & Badge */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-600/20">
                <Scissors className="w-8 h-8 text-violet-400" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-zinc-950 rounded-full" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span>Acceso Exclusivo Clientes</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {mockTenant.name}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-xs mx-auto">
                Iniciá sesión con tu cuenta de Google para reservar tu turno en segundos.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-3 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
              <span className="font-bold text-white">{mockTenant.rating || '4.95'}</span>
              <span className="text-zinc-500">• {mockTenant.address}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* Google Sign-In CTA */}
          <div className="space-y-3">
            <GoogleSignInButton variant="login" />
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Completaremos automáticamente tu nombre y correo electrónico para agilizar tu reserva.
            </p>
          </div>

          {/* Security footer inside card */}
          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span>Autenticación segura con Google & Supabase</span>
          </div>
        </div>
      </div>
    </main>
  )
}
