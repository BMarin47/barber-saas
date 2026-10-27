import crypto from 'crypto'

export interface CreatePreferenceParams {
  bookingId: string
  title: string
  price: number
  clientName: string
  clientPhone: string
  clientEmail?: string
  tenantSlug?: string
}

export interface PreferenceResult {
  success: boolean
  preferenceId?: string
  initPoint?: string
  sandboxInitPoint?: string
  error?: string
  configured?: boolean
}

export interface PaymentDetails {
  id: number | string
  status: 'approved' | 'rejected' | 'in_process' | 'pending' | 'cancelled' | 'refunded' | string
  statusDetail?: string
  externalReference: string
  transactionAmount: number
  paymentMethodId?: string
  dateApproved?: string
}

const MP_API_BASE = 'https://api.mercadopago.com'

/**
 * Obtiene el access token de Mercado Pago desde las variables de entorno
 */
export function getMercadoPagoAccessToken(): string | null {
  return process.env.MP_ACCESS_TOKEN || null
}

/**
 * Crea una preferencia de pago en Mercado Pago Checkout Pro
 */
export async function createPreference(params: CreatePreferenceParams): Promise<PreferenceResult> {
  const accessToken = getMercadoPagoAccessToken()

  if (!accessToken) {
    return {
      success: false,
      configured: false,
      error: 'MP_ACCESS_TOKEN no está configurado en las variables de entorno.',
    }
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://barber-saas-nu.vercel.app').replace(/\/$/, '')
  const slug = params.tenantSlug || 'golden-blade'

  const body = {
    items: [
      {
        id: params.bookingId,
        title: params.title || 'Servicio de Barbería',
        description: `Reserva para ${params.clientName} en BarberSaaS`,
        quantity: 1,
        unit_price: Number(params.price),
        currency_id: 'ARS',
      },
    ],
    payer: {
      name: params.clientName,
      email: params.clientEmail || 'cliente@barbersaas.com',
      phone: {
        number: params.clientPhone.replace(/\D/g, ''),
      },
    },
    back_urls: {
      success: `${appUrl}/${slug}?payment=approved&bookingId=${params.bookingId}`,
      failure: `${appUrl}/${slug}?payment=failure&bookingId=${params.bookingId}`,
      pending: `${appUrl}/${slug}?payment=pending&bookingId=${params.bookingId}`,
    },
    auto_return: 'approved',
    external_reference: params.bookingId,
    statement_descriptor: 'BARBERSAAS',
    notification_url: `${appUrl}/api/payments/webhook`,
    expires: true,
    expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }

  try {
    const res = await fetch(`${MP_API_BASE}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Error al crear preferencia en Mercado Pago:', data)
      return {
        success: false,
        configured: true,
        error: data.message || 'Error al comunicarse con Mercado Pago',
      }
    }

    return {
      success: true,
      configured: true,
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
    }
  } catch (err: any) {
    console.error('Excepción al crear preferencia MP:', err)
    return {
      success: false,
      configured: true,
      error: err.message || 'Error de red con Mercado Pago',
    }
  }
}

/**
 * Consulta el estado y detalle verificado de un pago en Mercado Pago
 */
export async function getPaymentDetails(paymentId: string | number): Promise<PaymentDetails | null> {
  const accessToken = getMercadoPagoAccessToken()
  if (!accessToken) return null

  try {
    const res = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!res.ok) {
      console.error(`Error en GET /v1/payments/${paymentId}:`, res.statusText)
      return null
    }

    const data = await res.json()
    return {
      id: data.id,
      status: data.status,
      statusDetail: data.status_detail,
      externalReference: data.external_reference,
      transactionAmount: data.transaction_amount,
      paymentMethodId: data.payment_method_id,
      dateApproved: data.date_approved,
    }
  } catch (err) {
    console.error(`Excepción al consultar pago ${paymentId}:`, err)
    return null
  }
}

/**
 * Valida la firma HMAC-SHA256 del Webhook de Mercado Pago
 */
export function verifyMercadoPagoSignature(
  xSignatureHeader: string | null,
  xRequestId: string | null,
  dataId: string | null
): boolean {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET
  // Si no está configurado el secret de webhook, se omite la validación estricta
  if (!webhookSecret) {
    return true
  }

  if (!xSignatureHeader || !dataId) {
    return false
  }

  try {
    // Formato de cabecera: ts=1704067200,v1=5e4a8...
    const parts = xSignatureHeader.split(',')
    let ts: string | null = null
    let v1Hash: string | null = null

    for (const part of parts) {
      const [key, value] = part.trim().split('=')
      if (key === 'ts') ts = value
      if (key === 'v1') v1Hash = value
    }

    if (!ts || !v1Hash) return false

    // Manifest de validación: id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
    const manifest = `id:${dataId};${xRequestId ? `request-id:${xRequestId};` : ''}ts:${ts};`

    const hmac = crypto
      .createHmac('sha256', webhookSecret)
      .update(manifest)
      .digest('hex')

    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1Hash))
  } catch (err) {
    console.error('Error validando firma de webhook MP:', err)
    return false
  }
}
