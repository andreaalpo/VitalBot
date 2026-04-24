import { env } from '../config/env.js'

function errCode(err) {
  return err?.code || err?.cause?.code
}

/** Errores de red al conectar con PostgreSQL (pool `pg`). */
function normalizeDbConnectionError(err) {
  const code = errCode(err)
  if (code === 'ECONNREFUSED') {
    const e = new Error(
      'No se pudo conectar a PostgreSQL. Revisa DATABASE_URL o PGSQL_* en vitalbot-backend/.env, que el servicio esté en marcha (local o Neon) y el puerto (5432).',
    )
    e.status = 503
    return e
  }
  if (code === 'ENOTFOUND') {
    const e = new Error(
      'El host de la base de datos no existe o no se pudo resolver. Comprueba PGSQL_HOST o DATABASE_URL.',
    )
    e.status = 503
    return e
  }
  if (code === 'ETIMEDOUT') {
    const e = new Error(
      'Tiempo de espera agotado al conectar con la base de datos. Revisa red o firewall.',
    )
    e.status = 503
    return e
  }
  return err
}

/** Ajusta errores de PostgreSQL (códigos `23xxx`, `42xxx`, etc.). */
function normalizePgError(err) {
  if (!err?.code || typeof err.code !== 'string') return err
  if (!/^\d/.test(err.code) && err.code !== '42P01') return err

  if (err.code === '23505') {
    const e = new Error('El correo ya está registrado.')
    e.status = 409
    return e
  }

  if (err.code === '42P01') {
    const e = new Error(
      'La tabla de usuarios no existe en la base de datos. Ejecuta el script SQL del proyecto.',
    )
    e.status = 500
    e.pgDetail = err.message
    return e
  }

  return err
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err)
    return
  }

  const e = normalizePgError(normalizeDbConnectionError(err))
  const status = e.status || e.statusCode || 500
  const isProd = env.NODE_ENV === 'production'

  if (!isProd) {
    console.error('[API]', e.message, e.stack || e)
    if (err?.code) console.error('[PG]', err.code, err.detail || err.message)
  }

  const message =
    status === 500 && isProd
      ? 'Error interno del servidor.'
      : e.message ||
        err?.message ||
        err?.cause?.message ||
        'Error interno del servidor.'

  const body = { message }
  if (!isProd) {
    const c = errCode(err)
    if (c) body.code = c
    if (err?.detail) body.detail = err.detail
  }

  res.status(status).json(body)
}
