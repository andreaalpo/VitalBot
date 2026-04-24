import { query } from '../config/db.js'

const PROFILE_SELECT = `id, nombre_completo, correo_electronico, password_hash, activo, rol,
  telefono, fecha_nacimiento, genero, ciudad`

export async function findById(id) {
  const { rows } = await query(
    `SELECT ${PROFILE_SELECT}
     FROM usuario
     WHERE id = $1
     LIMIT 1`,
    [id],
  )
  return rows[0] || null
}

export async function findByEmailNormalized(email) {
  const { rows } = await query(
    `SELECT ${PROFILE_SELECT}
     FROM usuario
     WHERE lower(correo_electronico) = lower($1)
     LIMIT 1`,
    [email.trim()],
  )
  return rows[0] || null
}

export async function createUser({ nombreCompleto, correo, passwordHash }) {
  const { rows } = await query(
    `INSERT INTO usuario (
       nombre_completo,
       correo_electronico,
       password_hash,
       rol,
       activo,
       creado_en,
       actualizado_en
     )
     VALUES ($1, $2, $3, 'usuario', true, NOW(), NOW())
     RETURNING id, nombre_completo, correo_electronico, rol, telefono, fecha_nacimiento, genero, ciudad`,
    [nombreCompleto, correo.trim().toLowerCase(), passwordHash],
  )
  return rows[0]
}

const UPDATABLE = new Set([
  'nombre_completo',
  'correo_electronico',
  'telefono',
  'fecha_nacimiento',
  'genero',
  'ciudad',
])

/**
 * @param {Record<string, unknown>} patch Claves: columnas de UPDATABLE; valores null borra opcionales.
 */
export async function updateUserProfile(userId, patch) {
  const sets = []
  const vals = []
  let n = 1
  for (const [key, raw] of Object.entries(patch)) {
    if (!UPDATABLE.has(key) || raw === undefined) continue
    sets.push(`${key} = $${n}`)
    vals.push(raw)
    n += 1
  }
  if (sets.length === 0) {
    return findById(userId)
  }
  vals.push(userId)
  const { rows } = await query(
    `UPDATE usuario SET ${sets.join(', ')}, actualizado_en = NOW()
     WHERE id = $${n}
     RETURNING id, nombre_completo, correo_electronico, rol, telefono, fecha_nacimiento, genero, ciudad, activo`,
    vals,
  )
  return rows[0] || null
}

export async function insertAuthLog({
  usuarioId,
  tipo,
  ipCliente,
  exitoso,
  detalle,
}) {
  await query(
    `INSERT INTO log_autenticacion (
       usuario_id, tipo, ip_cliente, exitoso, fecha_hora, detalle
     )
     VALUES ($1, $2, $3::inet, $4, NOW(), $5)`,
    [usuarioId, tipo, ipCliente, exitoso, detalle],
  )
}
