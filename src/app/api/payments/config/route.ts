import { NextResponse } from 'next/server'

/** Expone solo la Public Key de Mercado Pago (es pública por diseño) para inicializar el Brick. */
export async function GET() {
  const publicKey = process.env.MP_PUBLIC_KEY?.trim() || null
  return NextResponse.json({ enabled: !!publicKey, publicKey })
}
