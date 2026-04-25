import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
/** Raíz del paquete vitalbot-backend (donde debe estar .env) */
const rootDir = path.join(__dirname, '..', '..')

dotenv.config({ path: path.join(rootDir, '.env') })

/** URL completa (opcional), p. ej. Neon: postgresql://...?sslmode=require */
const DATABASE_URL = process.env.DATABASE_URL?.trim() || ''

/** Misma modalidad que tu otro proyecto: PGSQL_* para Postgres local o túnel. */
export const pgsql = {
  host: process.env.PGSQL_HOST?.trim() || '',
  port: Number(process.env.PGSQL_PORT) || 5432,
  user: process.env.PGSQL_USER?.trim() || '',
  password: process.env.PGSQL_PASSWORD ?? '',
  database: process.env.PGSQL_DATABASE?.trim() || '',
}

export function isDatabaseConfigured() {
  if (DATABASE_URL) return true
  return Boolean(pgsql.host && pgsql.user && pgsql.database)
}

/** Resend: recuperación de contraseña y correos transaccionales */
export const resend = {
  apiKey: process.env.RESEND_API_KEY?.trim() || '',
  /** Remitente verificado en Resend; sin dominio propio suele usarse onboarding@resend.dev */
  from: process.env.RESEND_FROM?.trim() || 'onboarding@resend.dev',
}

export function isResendConfigured() {
  return Boolean(resend.apiKey)
}

/** URL del front (Vite en este repo usa 8080) para enlaces en correos */
export const FRONTEND_URL =
  process.env.FRONTEND_URL?.trim() || 'http://localhost:8080'

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  DATABASE_URL,
  JWT_SECRET:
    process.env.JWT_SECRET?.trim() ||
    process.env.SECRET_KEY?.trim() ||
    'dev-only-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  NODE_ENV: process.env.NODE_ENV || 'development',
}
