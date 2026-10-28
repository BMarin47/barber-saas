/**
 * Reglas de precio y métodos de pago (módulo compartido cliente/servidor).
 * El servidor SIEMPRE recalcula el total con estas funciones: el monto que llega
 * del navegador nunca se usa como fuente de verdad.
 * Los precios se cobran por su valor total (100%), sin descuentos por método de pago.
 */

export const PAYMENT_METHOD_CASH = 'Efectivo o transferencia en local'
export const PAYMENT_METHOD_MP = 'Mercado Pago'

/** Interruptor de Mercado Pago (la opción se muestra y se puede seleccionar). */
export const MERCADOPAGO_ENABLED = true

/** Todo método distinto de Mercado Pago se trata como pago presencial. */
export function isCashPayment(method?: string | null): boolean {
  return (method || PAYMENT_METHOD_CASH).trim() !== PAYMENT_METHOD_MP
}

/** Normaliza cualquier valor recibido (incluye el texto legacy) a un método válido. */
export function normalizePaymentMethod(method?: string | null): string {
  return !MERCADOPAGO_ENABLED || isCashPayment(method) ? PAYMENT_METHOD_CASH : PAYMENT_METHOD_MP
}

/** Total a cobrar: valor completo del servicio, entero y nunca negativo. */
export function calculateTotal(basePrice: number): number {
  return Math.max(0, Math.round(Number(basePrice) || 0))
}
