/**
 * Reglas de precio y métodos de pago (módulo compartido cliente/servidor).
 * El servidor SIEMPRE recalcula el total con estas funciones: el monto que llega
 * del navegador nunca se usa como fuente de verdad.
 */

export const PAYMENT_METHOD_CASH = 'Efectivo o transferencia en local'
export const PAYMENT_METHOD_MP = 'Mercado Pago'

/** Mercado Pago deshabilitado temporalmente: el sistema opera solo con pago presencial. */
export const MERCADOPAGO_ENABLED = false

/** Descuento por pagar presencialmente (efectivo o transferencia en local). */
export const CASH_DISCOUNT_PERCENT = 10

export interface PricingBreakdown {
  originalAmount: number
  discountPercent: number
  discountAmount: number
  finalAmount: number
}

/** Todo método distinto de Mercado Pago se trata como pago presencial. */
export function isCashPayment(method?: string | null): boolean {
  return (method || PAYMENT_METHOD_CASH).trim() !== PAYMENT_METHOD_MP
}

/** Normaliza cualquier valor recibido (incluye el texto legacy) a un método válido. */
export function normalizePaymentMethod(method?: string | null): string {
  return !MERCADOPAGO_ENABLED || isCashPayment(method) ? PAYMENT_METHOD_CASH : PAYMENT_METHOD_MP
}

export function calculatePricing(basePrice: number, method?: string | null): PricingBreakdown {
  const originalAmount = Math.max(0, Math.round(Number(basePrice) || 0))
  const discountPercent = isCashPayment(method) ? CASH_DISCOUNT_PERCENT : 0
  const discountAmount = Math.round((originalAmount * discountPercent) / 100)
  return {
    originalAmount,
    discountPercent,
    discountAmount,
    finalAmount: originalAmount - discountAmount,
  }
}
