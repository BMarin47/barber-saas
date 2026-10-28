import Stripe from 'stripe'

let cached: Stripe | null = null

/** Cliente de Stripe del servidor; null si STRIPE_SECRET_KEY no está configurada. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) return null
  if (!cached) cached = new Stripe(key)
  return cached
}

/** ARS es una moneda de 2 decimales en Stripe: el monto va en centavos. */
export const STRIPE_CURRENCY = 'ars'
export const toStripeAmount = (total: number) => Math.round(Number(total) * 100)
