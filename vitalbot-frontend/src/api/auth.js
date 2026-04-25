export async function loginRequest(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email: email.trim(), password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      data.message || 'No se pudo iniciar sesión. Intenta de nuevo.',
    )
  }
  return data
}

export async function registerRequest({ name, email, password }) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim(),
      password,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'No se pudo completar el registro.')
  }
  return data
}

export async function forgotPasswordRequest(email) {
  const redirectOrigin =
    typeof window !== 'undefined' ? window.location.origin : undefined
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: email.trim(),
      ...(redirectOrigin ? { redirectOrigin } : {}),
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      data.message || 'No se pudo procesar la solicitud. Intenta de nuevo.',
    )
  }
  return data
}

export async function resetPasswordRequest(token, password) {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      data.message || 'No se pudo actualizar la contraseña. El enlace pudo caducar.',
    )
  }
  return data
}
