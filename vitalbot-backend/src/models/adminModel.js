import { pool, query } from '../config/db.js'

const USER_ROW = `id, nombre_completo, correo_electronico, rol, activo, telefono,
  fecha_nacimiento, genero, ciudad, creado_en, actualizado_en`

export async function listUsers() {
  const { rows } = await query(
    `SELECT ${USER_ROW} FROM usuario ORDER BY id DESC LIMIT 500`,
  )
  return rows
}

export async function findUserByIdAdmin(id) {
  const { rows } = await query(
    `SELECT ${USER_ROW} FROM usuario WHERE id = $1 LIMIT 1`,
    [id],
  )
  return rows[0] || null
}

export async function findUserByEmailExceptId(email, excludeId) {
  const { rows } = await query(
    `SELECT id FROM usuario WHERE lower(correo_electronico) = lower($1) AND id != $2 LIMIT 1`,
    [email.trim(), excludeId],
  )
  return rows[0] || null
}

export async function countActiveAdminsExcluding(excludeId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS n FROM usuario
     WHERE rol = 'administrador' AND activo = true AND id != $1`,
    [excludeId],
  )
  return rows[0]?.n ?? 0
}

export async function updateUserAdmin(userId, patch) {
  const sets = []
  const vals = []
  let n = 1
  const map = {
    nombre_completo: patch.nombre_completo,
    correo_electronico: patch.correo_electronico,
    rol: patch.rol,
    activo: patch.activo,
    telefono: patch.telefono,
    fecha_nacimiento: patch.fecha_nacimiento,
    genero: patch.genero,
    ciudad: patch.ciudad,
    password_hash: patch.password_hash,
  }
  for (const [col, val] of Object.entries(map)) {
    if (val === undefined) continue
    sets.push(`${col} = $${n}`)
    vals.push(val)
    n += 1
  }
  if (sets.length === 0) {
    return findUserByIdAdmin(userId)
  }
  vals.push(userId)
  const { rows } = await query(
    `UPDATE usuario SET ${sets.join(', ')}, actualizado_en = NOW()
     WHERE id = $${n}
     RETURNING ${USER_ROW}`,
    vals,
  )
  return rows[0] || null
}

export async function deleteUserCascade(userId) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const uid = Number(userId)
    const pseudos = await client.query(
      'SELECT id FROM pseudonimo_usuario WHERE usuario_id = $1',
      [uid],
    )
    for (const { id: pid } of pseudos.rows) {
      const consultas = await client.query(
        'SELECT id FROM consulta WHERE pseudonimo_usuario = $1',
        [pid],
      )
      for (const { id: cid } of consultas.rows) {
        await client.query('DELETE FROM sintoma_registrado WHERE consulta_id = $1', [
          cid,
        ])
        await client.query('DELETE FROM mensaje_chat WHERE consulta_id = $1', [cid])
        await client.query('DELETE FROM consulta WHERE id = $1', [cid])
      }
      await client.query('DELETE FROM pseudonimo_usuario WHERE id = $1', [pid])
    }
    await client.query('DELETE FROM log_autenticacion WHERE usuario_id = $1', [uid])
    await client.query('DELETE FROM sesion WHERE usuario_id = $1', [uid])
    await client.query('DELETE FROM token_recuperacion WHERE usuario_id = $1', [uid])
    await client.query('DELETE FROM consentimiento_informado WHERE usuario_id = $1', [
      uid,
    ])
    const del = await client.query('DELETE FROM usuario WHERE id = $1', [uid])
    await client.query('COMMIT')
    return del.rowCount > 0
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

export async function adminStats() {
  const [u, s, ce, r] = await Promise.all([
    query('SELECT COUNT(*)::int AS n FROM usuario'),
    query('SELECT COUNT(*)::int AS n FROM sintoma'),
    query('SELECT COUNT(*)::int AS n FROM contenido_educativo'),
    query('SELECT COUNT(*)::int AS n FROM regla_medica'),
  ])
  return {
    usuarios: u.rows[0].n,
    sintomas: s.rows[0].n,
    contenidoEducativo: ce.rows[0].n,
    reglasMedicas: r.rows[0].n,
  }
}

export async function listSintomas() {
  const { rows } = await query(
    `SELECT id, nombre, categoria, descripcion, es_critico, activo
     FROM sintoma ORDER BY nombre`,
  )
  return rows
}

export async function insertSintoma(row) {
  const { rows } = await query(
    `INSERT INTO sintoma (nombre, categoria, descripcion, es_critico, activo)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, nombre, categoria, descripcion, es_critico, activo`,
    [row.nombre, row.categoria, row.descripcion, row.es_critico, row.activo],
  )
  return rows[0]
}

export async function updateSintoma(id, patch) {
  const allowed = ['nombre', 'categoria', 'descripcion', 'es_critico', 'activo']
  const sets = []
  const vals = []
  let n = 1
  for (const key of allowed) {
    if (patch[key] === undefined) continue
    sets.push(`${key} = $${n}`)
    vals.push(patch[key])
    n += 1
  }
  if (sets.length === 0) {
    const { rows } = await query(
      `SELECT id, nombre, categoria, descripcion, es_critico, activo FROM sintoma WHERE id = $1`,
      [id],
    )
    return rows[0] || null
  }
  vals.push(id)
  const { rows } = await query(
    `UPDATE sintoma SET ${sets.join(', ')}
     WHERE id = $${n}
     RETURNING id, nombre, categoria, descripcion, es_critico, activo`,
    vals,
  )
  return rows[0] || null
}

export async function deleteSintoma(id) {
  const { rows } = await query('DELETE FROM sintoma WHERE id = $1 RETURNING id', [id])
  return rows.length > 0
}

export async function listContenidoEducativo() {
  const { rows } = await query(
    `SELECT ce.id, ce.sintoma_id, ce.titulo, ce.cuerpo, ce.nivel_riesgo_asociado, ce.activo,
            s.nombre AS sintoma_nombre
     FROM contenido_educativo ce
     JOIN sintoma s ON s.id = ce.sintoma_id
     ORDER BY ce.id DESC`,
  )
  return rows
}

export async function insertContenidoEducativo(row) {
  const { rows } = await query(
    `INSERT INTO contenido_educativo (sintoma_id, titulo, cuerpo, nivel_riesgo_asociado, activo)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, sintoma_id, titulo, cuerpo, nivel_riesgo_asociado, activo`,
    [row.sintoma_id, row.titulo, row.cuerpo, row.nivel_riesgo_asociado, row.activo],
  )
  return rows[0]
}

export async function updateContenidoEducativo(id, patch) {
  const allowed = [
    'sintoma_id',
    'titulo',
    'cuerpo',
    'nivel_riesgo_asociado',
    'activo',
  ]
  const sets = []
  const vals = []
  let n = 1
  for (const key of allowed) {
    if (patch[key] === undefined) continue
    sets.push(`${key} = $${n}`)
    vals.push(patch[key])
    n += 1
  }
  if (sets.length === 0) {
    const { rows } = await query(
      `SELECT id, sintoma_id, titulo, cuerpo, nivel_riesgo_asociado, activo
       FROM contenido_educativo WHERE id = $1`,
      [id],
    )
    return rows[0] || null
  }
  vals.push(id)
  const { rows } = await query(
    `UPDATE contenido_educativo SET ${sets.join(', ')}
     WHERE id = $${n}
     RETURNING id, sintoma_id, titulo, cuerpo, nivel_riesgo_asociado, activo`,
    vals,
  )
  return rows[0] || null
}

export async function deleteContenidoEducativo(id) {
  const { rows } = await query(
    'DELETE FROM contenido_educativo WHERE id = $1 RETURNING id',
    [id],
  )
  return rows.length > 0
}

export async function listReglasMedicas() {
  const { rows } = await query(
    `SELECT id, nombre, condicion_json, nivel_riesgo_resultado, recomendacion, prioridad, activa
     FROM regla_medica ORDER BY prioridad DESC, id`,
  )
  return rows
}

export async function insertReglaMedica(row) {
  const { rows } = await query(
    `INSERT INTO regla_medica (nombre, condicion_json, nivel_riesgo_resultado, recomendacion, prioridad, activa)
     VALUES ($1, $2::jsonb, $3, $4, $5, $6)
     RETURNING id, nombre, condicion_json, nivel_riesgo_resultado, recomendacion, prioridad, activa`,
    [
      row.nombre,
      JSON.stringify(row.condicion_json),
      row.nivel_riesgo_resultado,
      row.recomendacion,
      row.prioridad,
      row.activa,
    ],
  )
  return rows[0]
}

export async function updateReglaMedica(id, patch) {
  const sets = []
  const vals = []
  let n = 1
  const simple = [
    'nombre',
    'nivel_riesgo_resultado',
    'recomendacion',
    'prioridad',
    'activa',
  ]
  for (const key of simple) {
    if (patch[key] === undefined) continue
    sets.push(`${key} = $${n}`)
    vals.push(patch[key])
    n += 1
  }
  if (patch.condicion_json !== undefined) {
    sets.push(`condicion_json = $${n}::jsonb`)
    vals.push(JSON.stringify(patch.condicion_json))
    n += 1
  }
  if (sets.length === 0) {
    const { rows } = await query(
      `SELECT id, nombre, condicion_json, nivel_riesgo_resultado, recomendacion, prioridad, activa
       FROM regla_medica WHERE id = $1`,
      [id],
    )
    return rows[0] || null
  }
  vals.push(id)
  const { rows } = await query(
    `UPDATE regla_medica SET ${sets.join(', ')}
     WHERE id = $${n}
     RETURNING id, nombre, condicion_json, nivel_riesgo_resultado, recomendacion, prioridad, activa`,
    vals,
  )
  return rows[0] || null
}

export async function deleteReglaMedica(id) {
  await query('DELETE FROM regla_sintoma WHERE regla_id = $1', [id])
  const { rows } = await query('DELETE FROM regla_medica WHERE id = $1 RETURNING id', [
    id,
  ])
  return rows.length > 0
}
