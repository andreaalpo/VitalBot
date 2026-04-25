import { FRONTEND_URL } from '../config/env.js'

/**
 * Base URL del SPA para el enlace de restablecer. Prioriza el origen que envía el
 * navegador (mismo puerto/host que la pestaña) para no depender de FRONTEND_URL
 * cuando Vite usa otro puerto (p. ej. 8081) o 127.0.0.1 vs localhost.
 */
export function resolvePasswordResetBaseUrl(raw) {
  const fallback = FRONTEND_URL.replace(/\/$/, '')
  if (!raw || typeof raw !== 'string') return fallback
  const trimmed = raw.trim()
  if (!trimmed) return fallback
  let u
  try {
    u = new URL(trimmed)
  } catch {
    return fallback
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return fallback
  const host = u.hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1') {
    return `${u.protocol}//${u.host}`.replace(/\/$/, '')
  }
  try {
    const allowed = new URL(FRONTEND_URL)
    if (allowed.hostname.toLowerCase() === host) {
      return `${u.protocol}//${u.host}`.replace(/\/$/, '')
    }
  } catch {
    /* ignore */
  }
  return fallback
}
