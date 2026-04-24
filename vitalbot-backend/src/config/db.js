import pg from 'pg'
import { env, pgsql, isDatabaseConfigured } from './env.js'

const { Pool } = pg

/**
 * En Windows, "localhost" a veces usa IPv6 (::1) y Postgres solo escucha IPv4 → ECONNREFUSED.
 */
export function resolvePgsqlHost(host) {
  const h = (host || '').trim().toLowerCase()
  if (h === 'localhost' || h === '::1' || h === '') return '127.0.0.1'
  return host.trim()
}

/** Neon (y otros hosts en la nube) suelen exigir TLS. */
function poolSslOption(connectionString) {
  if (!connectionString) return undefined
  const u = connectionString.toLowerCase()
  if (
    u.includes('sslmode=require') ||
    u.includes('neon.tech') ||
    u.includes('.neon.')
  ) {
    return { rejectUnauthorized: true }
  }
  return undefined
}

function createPool() {
  if (env.DATABASE_URL) {
    const ssl = poolSslOption(env.DATABASE_URL)
    return new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10_000,
      ...(ssl ? { ssl } : {}),
    })
  }

  if (!isDatabaseConfigured()) {
    console.warn(
      '[vitalbot-backend] Falta configuración de base de datos (DATABASE_URL o PGSQL_*).',
    )
  }

  const host = resolvePgsqlHost(pgsql.host)

  return new Pool({
    host,
    port: pgsql.port,
    user: pgsql.user,
    password: pgsql.password,
    database: pgsql.database,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10_000,
  })
}

export const pool = createPool()

export async function query(text, params) {
  return pool.query(text, params)
}
