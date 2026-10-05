import React from 'react'
import { notFound } from 'next/navigation'
import { BookingWizard } from '@/components/booking/BookingWizard'
import { mockTenant, mockServices, mockProfessionals } from '@/data/mock-tenant'
import { Scissors } from 'lucide-react'

interface TenantPageProps {
  params: Promise<{ slug: string }>
}

export default async function TenantBookingPage({ params }: TenantPageProps) {
  const { slug } = await params

  const tenant = slug === mockTenant.slug ? mockTenant : { ...mockTenant, slug, name: slug.replace(/-/g, ' ').toUpperCase() }

  if (!tenant) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100 relative overflow-hidden flex flex-col">
      {/* Background Subtle Violet Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-violet-600/10 via-indigo-600/5 to-transparent blur-[120px] pointer-events-none" />

      {/* Top minimal brand */}
      <nav className="border-b border-white/[0.08] bg-black/60 backdrop-blur-xl sticky top-0 z-50 py-3">
        <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">{tenant.name}</span>
          </div>

          <span className="text-[11px] font-medium text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">
            Turnos Online
          </span>
        </div>
      </nav>

      {/* Wizard */}
      <div className="flex-1">
        <BookingWizard
          tenant={tenant}
          services={mockServices}
          professionals={mockProfessionals}
        />
      </div>
    </main>
  )
}
