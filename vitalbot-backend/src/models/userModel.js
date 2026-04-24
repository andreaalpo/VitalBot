import { query } from '../config/db.js'

export async function findById(id) {
  const { rows } = await query(
    `SELECT id, nombre_completo, correo_electronico, activo
     FROM usuario
     WHERE id = $1
     LIMIT 1`,
    [id],
  )
  return rows[0] || null
}

export async function findByEmailNormalized(email) {
  const { rows } = await query(
    `SELECT id, nombre_completo, correo_electronico, password_hash, activo
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
       activo,
       creado_en,
       actualizado_en
     )
     VALUES ($1, $2, $3, true, NOW(), NOW())
     RETURNING id, nombre_completo, correo_electronico`,
    [nombreCompleto, correo.trim().toLowerCase(), passwordHash],
  )
  return rows[0]
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
