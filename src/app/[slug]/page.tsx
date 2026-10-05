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

  // In production, we would query:
  // const tenant = await prisma.tenant.findUnique({
  //   where: { slug },
  //   include: { services: true, professionals: true }
  // })

  // For demonstration, match mock tenant or adapt
  const tenant = slug === mockTenant.slug ? mockTenant : { ...mockTenant, slug, name: slug.replace(/-/g, ' ').toUpperCase() }

  if (!tenant) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden flex flex-col">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-[120px] pointer-events-none" />

      {/* Top minimal brand */}
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 py-3">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Scissors className="w-3.5 h-3.5 text-zinc-950" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-100">{tenant.name}</span>
          </div>

          <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            Reservas Online
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
