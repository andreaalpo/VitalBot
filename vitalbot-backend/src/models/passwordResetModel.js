import crypto from 'crypto'
import { pool, query } from '../config/db.js'

export function hashRecoveryTokenPlain(raw) {
  return crypto.createHash('sha256').update(String(raw).trim(), 'utf8').digest('hex')
}

export async function invalidateActiveTokensForUser(usuarioId) {
  await query(
    `UPDATE token_recuperacion
     SET usado = true
     WHERE usuario_id = $1 AND usado = false`,
    [usuarioId],
  )
}

/**
 * Caducidad en SQL (mismo reloj que NOW() en las consultas) para evitar desfaces
 * entre Date de Node y `timestamp without time zone` en Postgres.
 */
export async function insertRecoveryToken(usuarioId, tokenHash) {
  const { rows } = await query(
    `INSERT INTO token_recuperacion (
       usuario_id, token_hash, usado, creado_en, expiracion
     )
     VALUES ($1, $2, false, NOW(), NOW() + interval '1 hour')
     RETURNING id`,
    [usuarioId, tokenHash],
  )
  return rows[0] || null
}

export async function findValidByTokenHash(tokenHash) {
  const { rows } = await query(
    `SELECT tr.id, tr.usuario_id
     FROM token_recuperacion tr
     INNER JOIN usuario u ON u.id = tr.usuario_id
     WHERE tr.token_hash = $1
       AND tr.usado = false
       AND tr.expiracion > NOW()
       AND u.activo = true
     ORDER BY tr.creado_en DESC
     LIMIT 1`,
    [tokenHash],
  )
  return rows[0] || null
}

export async function completePasswordResetInTransaction(
  tokenRowId,
  usuarioId,
  newPasswordHash,
) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `UPDATE token_recuperacion SET usado = true WHERE id = $1`,
      [tokenRowId],
    )
    await client.query(
      `UPDATE usuario
       SET password_hash = $1, actualizado_en = NOW()
       WHERE id = $2`,
      [newPasswordHash, usuarioId],
    )
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
