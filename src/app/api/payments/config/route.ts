import { NextResponse } from 'next/server'

/** Expone solo la Public Key de Mercado Pago (es pública por diseño) para inicializar el Brick. */
export async function GET() {
  const publicKey =
    process.env.MP_PUBLIC_KEY?.trim() ||
    process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim() ||
    process.env.MERCADOPAGO_PUBLIC_KEY?.trim() ||
    process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim() ||
    null
  return NextResponse.json({ enabled: !!publicKey, publicKey })
}
