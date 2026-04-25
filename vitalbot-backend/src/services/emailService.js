import { FRONTEND_URL, resend, isResendConfigured } from '../config/env.js'

const RESEND_API = 'https://api.resend.com/emails'

/** En HTML mail, & en href puede romper el atributo en algunos clientes. */
function hrefAttr(url) {
  return String(url).replace(/&/g, '&amp;')
}

export async function sendPasswordResetEmail({ to, rawToken, frontendBase }) {
  if (!isResendConfigured()) {
    const err = new Error(
      'El envío de correos no está configurado. Define RESEND_API_KEY en .env.',
    )
    err.status = 503
    throw err
  }

  const base = (frontendBase || FRONTEND_URL).replace(/\/$/, '')
  const resetPath = `/restablecer?token=${encodeURIComponent(rawToken)}`
  const resetUrl = `${base}${resetPath}`
  const resetUrlForHref = hrefAttr(resetUrl)

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resend.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resend.from,
      to: [to.trim().toLowerCase()],
      subject: 'VitalBot — Restablecer contraseña',
      html: `
<p>Hola,</p>
<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en VitalBot.</p>
<p><a href="${resetUrlForHref}" style="color:#16a34a;font-weight:600;">Restablecer contraseña</a></p>
<p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
<p style="word-break:break-all;font-size:0.9em;color:#334155;">${resetUrl}</p>
<p>Este enlace caduca en 1 hora. Si no fuiste vos, ignorá este mensaje.</p>
<p style="color:#64748b;font-size:0.85em;">— VitalBot</p>
`.trim(),
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(
      data.message ||
        `Resend respondió ${res.status}. Revisa el remitente (RESEND_FROM) y la API key.`,
    )
    err.status = 502
    throw err
  }
  return data
}
