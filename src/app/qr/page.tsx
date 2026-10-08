'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import { motion } from 'framer-motion'
import {
  Scissors,
  Download,
  Copy,
  Printer,
  Check,
  ArrowLeft,
  Share2,
  ExternalLink,
  Sparkles,
} from 'lucide-react'

export default function QrGeneratorPage() {
  const [appUrl, setAppUrl] = useState<string>('https://barber-saas-nu.vercel.app')
  const [copied, setCopied] = useState<boolean>(false)
  const qrContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin
      if (origin && !origin.includes('localhost')) {
        setAppUrl(origin)
      } else {
        setAppUrl('https://barber-saas-nu.vercel.app')
      }
    }
  }, [])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  // Descarga optimizada en formato SVG (Vectorial infinito)
  const handleDownloadSvg = () => {
    if (!qrContainerRef.current) return
    const svgElement = qrContainerRef.current.querySelector('svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    const downloadLink = document.createElement('a')
    downloadLink.href = svgUrl
    downloadLink.download = 'barber-app-qr.svg'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(svgUrl)
  }

  // Descarga en formato PNG de Alta Resolución (1024x1024) para cartelería e impresión
  const handleDownloadPng = () => {
    if (!qrContainerRef.current) return
    const svgElement = qrContainerRef.current.querySelector('svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const URLObject = window.URL || window.webkitURL || window
    const blobURL = URLObject.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const targetSize = 1024
      const padding = 80

      canvas.width = targetSize
      canvas.height = targetSize
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Fondo blanco puro con esquinas suaves para óptimo contraste de lectura
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, targetSize, targetSize)

      // Dibujar QR centrado
      const qrSize = targetSize - padding * 2
      ctx.drawImage(img, padding, padding, qrSize, qrSize)

      // Convertir a PNG y descargar
      const pngUrl = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = 'barber-app-qr-impresion.png'
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      URLObject.revokeObjectURL(blobURL)
    }
    img.src = blobURL
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden print:bg-white print:text-black">
      {/* Background ambient gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-violet-600/10 via-indigo-600/5 to-transparent blur-[120px] pointer-events-none print:hidden" />

      {/* Top Bar */}
      <div className="w-full max-w-xl flex items-center justify-between mb-6 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la App</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" /> Generador de QR
        </span>
      </div>

      <div className="w-full max-w-md">
        {/* Main Printable Card */}
        <div className="rounded-3xl bg-zinc-900/40 border border-white/[0.08] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl text-center space-y-6 print:bg-white print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto shadow-lg shadow-violet-600/30 mb-3 print:hidden">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight print:text-black">
              The Golden Blade
            </h1>
            <p className="text-xs text-zinc-400 print:text-zinc-600">
              Escaneá con tu celular para reservar tu turno en segundos
            </p>
          </div>

          {/* QR Code Container (Crisp White High-Contrast Box) */}
          <div className="flex justify-center my-2">
            <div
              ref={qrContainerRef}
              className="p-5 bg-white rounded-3xl shadow-2xl inline-block border-4 border-zinc-900/10 print:border-none print:p-4"
            >
              <QRCode
                value={appUrl}
                size={220}
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                viewBox="0 0 256 256"
                level="H"
              />
            </div>
          </div>

          {/* Target URL indicator */}
          <div className="rounded-2xl bg-zinc-950/60 border border-white/[0.06] p-3 text-xs text-zinc-400 flex items-center justify-between gap-2 print:hidden">
            <span className="truncate font-mono text-[11px] text-zinc-300">
              {appUrl}
            </span>
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 shrink-0 p-1"
              title="Abrir enlace"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 print:hidden">
            <div className="grid grid-cols-2 gap-2.5">
              <motion.button
                type="button"
                onClick={handleDownloadPng}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="py-3 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PNG</span>
              </motion.button>

              <motion.button
                type="button"
                onClick={handleDownloadSvg}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="py-3 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar SVG</span>
              </motion.button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-3 px-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Enlace</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="py-3 px-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir QR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Informative Tip */}
        <p className="text-center text-xs text-zinc-400 mt-4 print:hidden">
          💡 Ideal para colocar en el mostrador del local, mesas de espera o tarjetas de presentación.
        </p>
      </div>
    </main>
  )
}
