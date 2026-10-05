import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BarberSaaS | Sistema Multi-Tenant de Reservas Premium',
  description: 'Plataforma SaaS de reservas online para Barberías y Salones de Peluquería con integración directa a WhatsApp.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950">
        {children}
      </body>
    </html>
  )
}
