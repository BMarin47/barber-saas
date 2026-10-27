import { NextResponse } from 'next/server'
import { createSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { password, tenantId } = await req.json()
    const validPassword = process.env.ADMIN_PASS || 'admin123'

    if (!password || password !== validPassword) {
      return NextResponse.json(
        { success: false, error: 'Contraseña incorrecta' },
        { status: 401 }
      )
    }

    const assignedTenant = tenantId || 'tenant-golden-blade'
    const token = createSessionToken(assignedTenant)

    const response = NextResponse.json({
      success: true,
      message: 'Autenticación exitosa',
      tenantId: assignedTenant,
    })

    const isProduction = process.env.NODE_ENV === 'production'

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 horas
    })

    return response
  } catch (error) {
    console.error('Error en POST /api/admin/auth:', error)
    return NextResponse.json(
      { success: false, error: 'Error de autenticación' },
      { status: 500 }
    )
  }
}
