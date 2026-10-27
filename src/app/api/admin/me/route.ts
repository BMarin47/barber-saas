import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  const session = await getAdminSession()

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    role: session.role,
    tenantId: session.tenantId,
    expiresAt: session.exp,
  })
}
