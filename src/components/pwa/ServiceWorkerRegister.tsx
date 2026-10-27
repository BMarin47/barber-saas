'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registrado con éxito:', registration.scope)
        })
        .catch((error) => {
          console.warn('[PWA] Error al registrar Service Worker:', error)
        })
    }
  }, [])

  return null
}
