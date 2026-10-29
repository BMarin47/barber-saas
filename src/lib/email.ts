import { PAYMENT_METHOD_MP, isCashPayment } from '@/lib/pricing'

export interface BookingEmailPayload {
  bookingId: string
  tenantName: string
  tenantAddress?: string | null
  clientName: string
  clientPhone: string
  clientEmail?: string | null
  serviceName: string
  professionalName?: string | null
  date: string // YYYY-MM-DD
  time: string // HH:mm
  paymentMethod: string
  amount: number
  notes?: string | null
  cancelUrl?: string
}

export interface EmailSendResult {
  sent: boolean
  customerSent: boolean
  adminSent: boolean
  errors: string[]
}

const DEFAULT_SENDER = 'BarberSaaS <onboarding@resend.dev>'

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const money = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return date
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m - 1, d))
}

function row(label: string, value: string, highlight = false): string {
  return `<tr>
<td style="padding:10px 0;border-bottom:1px solid #27272a;color:#a1a1aa;font-size:13px;width:34%;vertical-align:top;">${label}</td>
<td style="padding:10px 0;border-bottom:1px solid #27272a;color:${highlight ? '#a78bfa' : '#fafafa'};font-size:14px;font-weight:600;text-align:right;">${value}</td>
</tr>`
}

/** Plantilla "tarjeta oscura" con la fila visible "Cliente:" (Nombre, Apellido y Teléfono). */
export function buildBookingEmailHtml(p: BookingEmailPayload, audience: 'customer' | 'admin'): string {
  const isMp = p.paymentMethod === PAYMENT_METHOD_MP
  const priceHtml = money(p.amount)

  const heading =
    audience === 'admin' ? 'Nueva reserva recibida' : '¡Tu turno está reservado!'
  const paymentNote = isMp
    ? 'Pago online pendiente de acreditación en Mercado Pago.'
    : isCashPayment(p.paymentMethod)
    ? 'Abonás en el local (efectivo o transferencia).'
    : ''

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:32px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#18181b;border:1px solid #27272a;border-radius:20px;overflow:hidden;">
<tr><td style="padding:28px;text-align:center;background:linear-gradient(135deg,#4c1d95 0%,#18181b 100%);border-bottom:1px solid #27272a;">
<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#c4b5fd;font-weight:700;">${escapeHtml(p.tenantName)}</div>
<div style="font-size:22px;color:#ffffff;font-weight:800;margin-top:8px;">${heading}</div>
</td></tr>
<tr><td style="padding:24px 28px;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;border:1px solid #27272a;border-radius:14px;padding:6px 18px;">
${row('Cliente:', `${escapeHtml(p.clientName)}<br><span style="color:#a1a1aa;font-weight:500;font-size:13px;">Tel: ${escapeHtml(p.clientPhone)}</span>`)}
${row('Servicio:', escapeHtml(p.serviceName))}
${row('Fecha:', `<span style="text-transform:capitalize;">${escapeHtml(formatDate(p.date))}</span>`)}
${row('Hora:', `${escapeHtml(p.time)} hs`, true)}
${row('Medio de pago:', escapeHtml(p.paymentMethod))}
${row('Total:', priceHtml, true)}
${p.notes ? row('Notas:', escapeHtml(p.notes)) : ''}
</table>
${paymentNote ? `<p style="color:#a1a1aa;font-size:12px;margin:16px 0 0;">${escapeHtml(paymentNote)}</p>` : ''}
${p.tenantAddress ? `<p style="color:#a1a1aa;font-size:12px;margin:8px 0 0;">📍 ${escapeHtml(p.tenantAddress)}</p>` : ''}
${
  audience === 'customer' && p.cancelUrl
    ? `<p style="margin:20px 0 0;text-align:center;"><a href="${escapeHtml(
        p.cancelUrl
      )}" style="color:#f87171;font-size:12px;">Cancelar turno</a></p>`
    : ''
}
<p style="color:#52525b;font-size:11px;margin:20px 0 0;text-align:center;">Código de reserva: ${escapeHtml(p.bookingId)}</p>
</td></tr>
</table></td></tr></table></body></html>`
}

async function sendViaResend(params: {
  to: string
  subject: string
  html: string
  replyTo?: string
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY no está configurada' }
  }

  const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim()

  const attempt = async (from: string) => {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      }),
    })
    const data = await res.json().catch(() => ({}))
    return { res, data }
  }

  try {
    let { res, data } = await attempt(configuredFrom || DEFAULT_SENDER)

    // Dominio propio sin verificar en Resend: reintentar con el remitente de pruebas.
    if (!res.ok && configuredFrom && (res.status === 403 || res.status === 422)) {
      console.warn(`[Email] Remitente "${configuredFrom}" rechazado (${data?.message}). Reintentando con ${DEFAULT_SENDER}`)
      ;({ res, data } = await attempt(DEFAULT_SENDER))
    }

    if (!res.ok) {
      const detail = data?.message || data?.error || `HTTP ${res.status}`
      console.error(`[Email] Resend rechazó el envío a ${params.to}:`, data)
      return { ok: false, error: String(detail) }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de red contactando a Resend'
    console.error('[Email] Excepción al contactar Resend:', message)
    return { ok: false, error: message }
  }
}

/**
 * Envía la confirmación al cliente (si dejó email) y una copia al administrador
 * (BOOKING_NOTIFY_EMAIL). Nunca lanza: cualquier fallo se captura y se informa en el resultado,
 * de modo que un problema de correo jamás rompa la reserva.
 */
export async function sendBookingConfirmationEmails(p: BookingEmailPayload): Promise<EmailSendResult> {
  const result: EmailSendResult = { sent: false, customerSent: false, adminSent: false, errors: [] }

  try {
    const when = `${p.date} ${p.time} hs`

    if (p.clientEmail) {
      try {
        const r = await sendViaResend({
          to: p.clientEmail,
          subject: `Reserva confirmada · ${when} · ${p.tenantName}`,
          html: buildBookingEmailHtml(p, 'customer'),
        })
        result.customerSent = r.ok
        if (!r.ok) result.errors.push(`cliente: ${r.error}`)
      } catch (err) {
        result.errors.push(`cliente: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    const adminEmail = process.env.BOOKING_NOTIFY_EMAIL?.trim()
    if (adminEmail) {
      try {
        const r = await sendViaResend({
          to: adminEmail,
          subject: `Nueva reserva · ${p.clientName} · ${when}`,
          html: buildBookingEmailHtml(p, 'admin'),
          replyTo: p.clientEmail || undefined,
        })
        result.adminSent = r.ok
        if (!r.ok) result.errors.push(`admin: ${r.error}`)
      } catch (err) {
        result.errors.push(`admin: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : String(err))
  }

  result.sent = result.customerSent || result.adminSent
  if (result.errors.length) console.error('[Email] Errores en confirmación:', result.errors)
  return result
}
