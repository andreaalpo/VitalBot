import { env, isDatabaseConfigured, pgsql } from './config/env.js'
import { pool, resolvePgsqlHost } from './config/db.js'
import app from './app.js'

if (!isDatabaseConfigured()) {
  console.warn(
    '[vitalbot-backend] Configura la base en .env: DATABASE_URL (Neon) o PGSQL_HOST, PGSQL_USER, PGSQL_PASSWORD, PGSQL_DATABASE (como tu proyecto Backend).',
  )
}

async function logDatabaseReady() {
  if (!isDatabaseConfigured()) return
  const destino = env.DATABASE_URL
    ? 'DATABASE_URL (cadena completa)'
    : `${resolvePgsqlHost(pgsql.host)}:${pgsql.port} / ${pgsql.database}`
  try {
    await pool.query('SELECT 1')
    console.log(`[vitalbot-backend] PostgreSQL OK → ${destino}`)
  } catch (err) {
    const code = err?.code || err?.cause?.code || ''
    console.error(
      `[vitalbot-backend] PostgreSQL no responde (${code || err.message}). Destino: ${destino}`,
    )
    console.error(
      '  → Postgres en tu PC: inicia el servicio (services.msc → postgresql) y comprueba puerto PGSQL_PORT.',
    )
    console.error(
      '  → Si en pgAdmin solo entras a Neon: el API no usa pgAdmin; descomenta DATABASE_URL en .env con la URL de Neon.',
    )
  }
}

app.listen(env.PORT, () => {
  console.log(`VitalBot API escuchando en http://localhost:${env.PORT}`)
  console.log(`Health: http://localhost:${env.PORT}/api/health`)
  void logDatabaseReady()
})
