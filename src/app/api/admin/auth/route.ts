import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { password } = await req.json()
    const validPassword = process.env.ADMIN_PASS || 'admin123'

    if (password === validPassword) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false, error: 'Contraseña incorrecta' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error de autenticación' },
      { status: 500 }
    )
  }
}
