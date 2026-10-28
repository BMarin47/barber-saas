/**
 * Reglas de precio y métodos de pago (módulo compartido cliente/servidor).
 * El servidor SIEMPRE recalcula el total con estas funciones: el monto que llega
 * del navegador nunca se usa como fuente de verdad.
 * Los precios se cobran por su valor total (100%), sin descuentos por método de pago.
 */

export const PAYMENT_METHOD_CASH = 'Efectivo o transferencia en local'
export const PAYMENT_METHOD_MP = 'Mercado Pago'
export const PAYMENT_METHOD_GPAY = 'Google Pay'

/** Interruptor de Mercado Pago (la opción se muestra y se puede seleccionar). */
export const MERCADOPAGO_ENABLED = true

/** Pago online: Mercado Pago o Google Pay (Stripe). */
export function isOnlinePayment(method?: string | null): boolean {
  const m = (method || PAYMENT_METHOD_CASH).trim()
  return m === PAYMENT_METHOD_MP || m === PAYMENT_METHOD_GPAY
}

/** Todo método que no es online se trata como pago presencial. */
export function isCashPayment(method?: string | null): boolean {
  return !isOnlinePayment(method)
}

/** Normaliza cualquier valor recibido (incluye el texto legacy) a un método válido. */
export function normalizePaymentMethod(method?: string | null): string {
  const m = (method || '').trim()
  if (m === PAYMENT_METHOD_GPAY) return PAYMENT_METHOD_GPAY
  if (m === PAYMENT_METHOD_MP && MERCADOPAGO_ENABLED) return PAYMENT_METHOD_MP
  return PAYMENT_METHOD_CASH
}

/** Total a cobrar: valor completo del servicio, entero y nunca negativo. */
export function calculateTotal(basePrice: number): number {
  return Math.max(0, Math.round(Number(basePrice) || 0))
}
