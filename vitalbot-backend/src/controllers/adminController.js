import bcrypt from 'bcrypt'
import * as adminModel from '../models/adminModel.js'

const BCRYPT_ROUNDS = 10

function fmtDate(d) {
  if (!d) return null
  if (d instanceof Date) return d.toISOString().slice(0, 10)
  return String(d).slice(0, 10)
}

function serializeUser(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    name: row.nombre_completo,
    email: row.correo_electronico,
    role: row.rol,
    active: row.activo,
    phone: row.telefono,
    birthDate: fmtDate(row.fecha_nacimiento),
    gender: row.genero,
    city: row.ciudad,
    createdAt: row.creado_en,
    updatedAt: row.actualizado_en,
  }
}

export async function stats(req, res, next) {
  try {
    const data = await adminModel.adminStats()
    res.json(data)
  } catch (e) {
    next(e)
  }
}

export async function listUsers(req, res, next) {
  try {
    const rows = await adminModel.listUsers()
    res.json({ users: rows.map(serializeUser) })
  } catch (e) {
    next(e)
  }
}

export async function getUser(req, res, next) {
  try {
    const id = Number(req.params.id)
    const row = await adminModel.findUserByIdAdmin(id)
    if (!row) {
      return res.status(404).json({ message: 'Usuario no encontrado.' })
    }
    res.json({ user: serializeUser(row) })
  } catch (e) {
    next(e)
  }
}

export async function patchUser(req, res, next) {
  try {
    const id = Number(req.params.id)
    const body = req.body || {}
    const existing = await adminModel.findUserByIdAdmin(id)
    if (!existing) {
      return res.status(404).json({ message: 'Usuario no encontrado.' })
    }

    const nextRol = body.role
    const nextActivo = body.active
    const effectiveRol = nextRol !== undefined ? nextRol : existing.rol
    const effectiveActivo =
      nextActivo !== undefined ? nextActivo : existing.activo
    const willDemoteAdmin =
      existing.rol === 'administrador' &&
      existing.activo &&
      (effectiveRol === 'usuario' || effectiveActivo === false)
    if (willDemoteAdmin) {
      const others = await adminModel.countActiveAdminsExcluding(id)
      if (others < 1) {
        return res.status(400).json({
          message: 'Debe existir al menos otro administrador activo.',
        })
      }
    }

    if (nextRol != null && !['usuario', 'administrador'].includes(nextRol)) {
      return res.status(400).json({ message: 'Rol inválido.' })
    }

    if (body.email?.trim()) {
      const dup = await adminModel.findUserByEmailExceptId(body.email, id)
      if (dup) {
        return res.status(409).json({ message: 'El correo ya está en uso.' })
      }
    }

    const patch = {}
    if (body.name?.trim()) patch.nombre_completo = body.name.trim()
    if (body.email?.trim()) patch.correo_electronico = body.email.trim().toLowerCase()
    if (nextRol != null) patch.rol = nextRol
    if (typeof nextActivo === 'boolean') patch.activo = nextActivo
    if (body.phone !== undefined) {
      patch.telefono =
        body.phone === null || body.phone === ''
          ? null
          : String(body.phone).trim().slice(0, 20)
    }
    if (body.birthDate !== undefined) {
      if (body.birthDate === null || body.birthDate === '') {
        patch.fecha_nacimiento = null
      } else {
        const d = String(body.birthDate).slice(0, 10)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
          return res.status(400).json({ message: 'Fecha inválida (YYYY-MM-DD).' })
        }
        patch.fecha_nacimiento = d
      }
    }
    if (body.gender !== undefined) {
      patch.genero =
        body.gender === null || body.gender === ''
          ? null
          : String(body.gender).trim().slice(0, 30)
    }
    if (body.city !== undefined) {
      patch.ciudad =
        body.city === null || body.city === ''
          ? null
          : String(body.city).trim().slice(0, 100)
    }

    if (body.password) {
      if (String(body.password).length < 8) {
        return res.status(400).json({
          message: 'La contraseña debe tener al menos 8 caracteres.',
        })
      }
      patch.password_hash = await bcrypt.hash(body.password, BCRYPT_ROUNDS)
    }

    const updated = await adminModel.updateUserAdmin(id, patch)
    res.json({ user: serializeUser(updated) })
  } catch (e) {
    next(e)
  }
}

export async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id)
    const selfId = Number(req.user.id)
    if (id === selfId) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta.' })
    }
    const existing = await adminModel.findUserByIdAdmin(id)
    if (!existing) {
      return res.status(404).json({ message: 'Usuario no encontrado.' })
    }
    if (existing.rol === 'administrador' && existing.activo) {
      const others = await adminModel.countActiveAdminsExcluding(id)
      if (others < 1) {
        return res.status(400).json({
          message: 'No se puede eliminar el último administrador activo.',
        })
      }
    }
    const ok = await adminModel.deleteUserCascade(id)
    if (!ok) {
      return res.status(404).json({ message: 'Usuario no encontrado.' })
    }
    res.status(204).send()
  } catch (e) {
    next(e)
  }
}

export async function listSintomas(req, res, next) {
  try {
    const rows = await adminModel.listSintomas()
    res.json({
      sintomas: rows.map((r) => ({
        id: Number(r.id),
        nombre: r.nombre,
        categoria: r.categoria,
        descripcion: r.descripcion,
        esCritico: r.es_critico,
        activo: r.activo,
      })),
    })
  } catch (e) {
    next(e)
  }
}

export async function createSintoma(req, res, next) {
  try {
    const { nombre, categoria, descripcion, esCritico, activo } = req.body || {}
    if (!nombre?.trim() || !categoria?.trim() || !descripcion?.trim()) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' })
    }
    const row = await adminModel.insertSintoma({
      nombre: nombre.trim().slice(0, 100),
      categoria: String(categoria).trim(),
      descripcion: String(descripcion).trim(),
      es_critico: Boolean(esCritico),
      activo: activo !== false,
    })
    res.status(201).json({
      sintoma: {
        id: Number(row.id),
        nombre: row.nombre,
        categoria: row.categoria,
        descripcion: row.descripcion,
        esCritico: row.es_critico,
        activo: row.activo,
      },
    })
  } catch (e) {
    next(e)
  }
}

export async function patchSintoma(req, res, next) {
  try {
    const id = Number(req.params.id)
    const b = req.body || {}
    const patch = {}
    if (b.nombre !== undefined) patch.nombre = String(b.nombre).trim().slice(0, 100)
    if (b.categoria !== undefined) patch.categoria = String(b.categoria).trim()
    if (b.descripcion !== undefined) patch.descripcion = String(b.descripcion).trim()
    if (typeof b.esCritico === 'boolean') patch.es_critico = b.esCritico
    if (typeof b.activo === 'boolean') patch.activo = b.activo
    const row = await adminModel.updateSintoma(id, patch)
    if (!row) {
      return res.status(404).json({ message: 'Síntoma no encontrado.' })
    }
    res.json({
      sintoma: {
        id: Number(row.id),
        nombre: row.nombre,
        categoria: row.categoria,
        descripcion: row.descripcion,
        esCritico: row.es_critico,
        activo: row.activo,
      },
    })
  } catch (e) {
    next(e)
  }
}

export async function removeSintoma(req, res, next) {
  try {
    const id = Number(req.params.id)
    const ok = await adminModel.deleteSintoma(id)
    if (!ok) {
      return res.status(404).json({ message: 'Síntoma no encontrado.' })
    }
    res.status(204).send()
  } catch (e) {
    if (e.code === '23503') {
      return res.status(409).json({
        message:
          'No se puede eliminar: hay contenido educativo u otras tablas que lo referencian. Desactívalo o borra primero ese contenido.',
      })
    }
    next(e)
  }
}

export async function listContenido(req, res, next) {
  try {
    const rows = await adminModel.listContenidoEducativo()
    res.json({
      items: rows.map((r) => ({
        id: Number(r.id),
        sintomaId: Number(r.sintoma_id),
        sintomaNombre: r.sintoma_nombre,
        titulo: r.titulo,
        cuerpo: r.cuerpo,
        nivelRiesgoAsociado: r.nivel_riesgo_asociado,
        activo: r.activo,
      })),
    })
  } catch (e) {
    next(e)
  }
}

export async function createContenido(req, res, next) {
  try {
    const { sintomaId, titulo, cuerpo, nivelRiesgoAsociado, activo } = req.body || {}
    if (!sintomaId || !titulo?.trim() || !cuerpo?.trim() || !nivelRiesgoAsociado?.trim()) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' })
    }
    const row = await adminModel.insertContenidoEducativo({
      sintoma_id: Number(sintomaId),
      titulo: String(titulo).trim(),
      cuerpo: String(cuerpo).trim(),
      nivel_riesgo_asociado: String(nivelRiesgoAsociado).trim(),
      activo: activo !== false,
    })
    res.status(201).json({
      item: {
        id: Number(row.id),
        sintomaId: Number(row.sintoma_id),
        titulo: row.titulo,
        cuerpo: row.cuerpo,
        nivelRiesgoAsociado: row.nivel_riesgo_asociado,
        activo: row.activo,
      },
    })
  } catch (e) {
    if (e.code === '23503') {
      return res.status(400).json({ message: 'sintomaId no válido.' })
    }
    next(e)
  }
}

export async function patchContenido(req, res, next) {
  try {
    const id = Number(req.params.id)
    const b = req.body || {}
    const patch = {}
    if (b.sintomaId !== undefined) patch.sintoma_id = Number(b.sintomaId)
    if (b.titulo !== undefined) patch.titulo = String(b.titulo).trim()
    if (b.cuerpo !== undefined) patch.cuerpo = String(b.cuerpo).trim()
    if (b.nivelRiesgoAsociado !== undefined) {
      patch.nivel_riesgo_asociado = String(b.nivelRiesgoAsociado).trim()
    }
    if (typeof b.activo === 'boolean') patch.activo = b.activo
    const row = await adminModel.updateContenidoEducativo(id, patch)
    if (!row) {
      return res.status(404).json({ message: 'Contenido no encontrado.' })
    }
    res.json({
      item: {
        id: Number(row.id),
        sintomaId: Number(row.sintoma_id),
        titulo: row.titulo,
        cuerpo: row.cuerpo,
        nivelRiesgoAsociado: row.nivel_riesgo_asociado,
        activo: row.activo,
      },
    })
  } catch (e) {
    next(e)
  }
}

export async function removeContenido(req, res, next) {
  try {
    const id = Number(req.params.id)
    const ok = await adminModel.deleteContenidoEducativo(id)
    if (!ok) {
      return res.status(404).json({ message: 'Contenido no encontrado.' })
    }
    res.status(204).send()
  } catch (e) {
    next(e)
  }
}

export async function listReglas(req, res, next) {
  try {
    const rows = await adminModel.listReglasMedicas()
    res.json({
      reglas: rows.map((r) => ({
        id: Number(r.id),
        nombre: r.nombre,
        condicionJson: r.condicion_json,
        nivelRiesgoResultado: r.nivel_riesgo_resultado,
        recomendacion: r.recomendacion,
        prioridad: r.prioridad,
        activa: r.activa,
      })),
    })
  } catch (e) {
    next(e)
  }
}

export async function createRegla(req, res, next) {
  try {
    const {
      nombre,
      condicionJson,
      nivelRiesgoResultado,
      recomendacion,
      prioridad,
      activa,
    } = req.body || {}
    if (!nombre?.trim() || !nivelRiesgoResultado?.trim() || !recomendacion?.trim()) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' })
    }
    let cond = condicionJson
    if (cond == null) cond = {}
    if (typeof cond === 'string') {
      try {
        cond = JSON.parse(cond)
      } catch {
        return res.status(400).json({ message: 'condicionJson no es JSON válido.' })
      }
    }
    const row = await adminModel.insertReglaMedica({
      nombre: nombre.trim().slice(0, 100),
      condicion_json: cond,
      nivel_riesgo_resultado: String(nivelRiesgoResultado).trim(),
      recomendacion: String(recomendacion).trim(),
      prioridad: Number(prioridad) || 0,
      activa: activa !== false,
    })
    res.status(201).json({
      regla: {
        id: Number(row.id),
        nombre: row.nombre,
        condicionJson: row.condicion_json,
        nivelRiesgoResultado: row.nivel_riesgo_resultado,
        recomendacion: row.recomendacion,
        prioridad: row.prioridad,
        activa: row.activa,
      },
    })
  } catch (e) {
    next(e)
  }
}

export async function patchRegla(req, res, next) {
  try {
    const id = Number(req.params.id)
    const b = req.body || {}
    const patch = {}
    if (b.nombre !== undefined) patch.nombre = String(b.nombre).trim().slice(0, 100)
    if (b.nivelRiesgoResultado !== undefined) {
      patch.nivel_riesgo_resultado = String(b.nivelRiesgoResultado).trim()
    }
    if (b.recomendacion !== undefined) patch.recomendacion = String(b.recomendacion).trim()
    if (b.prioridad !== undefined) patch.prioridad = Number(b.prioridad)
    if (typeof b.activa === 'boolean') patch.activa = b.activa
    if (b.condicionJson !== undefined) {
      let cond = b.condicionJson
      if (typeof cond === 'string') {
        try {
          cond = JSON.parse(cond)
        } catch {
          return res.status(400).json({ message: 'condicionJson no es JSON válido.' })
        }
      }
      patch.condicion_json = cond
    }
    const row = await adminModel.updateReglaMedica(id, patch)
    if (!row) {
      return res.status(404).json({ message: 'Regla no encontrada.' })
    }
    res.json({
      regla: {
        id: Number(row.id),
        nombre: row.nombre,
        condicionJson: row.condicion_json,
        nivelRiesgoResultado: row.nivel_riesgo_resultado,
        recomendacion: row.recomendacion,
        prioridad: row.prioridad,
        activa: row.activa,
      },
    })
  } catch (e) {
    next(e)
  }
}

export async function removeRegla(req, res, next) {
  try {
    const id = Number(req.params.id)
    const ok = await adminModel.deleteReglaMedica(id)
    if (!ok) {
      return res.status(404).json({ message: 'Regla no encontrada.' })
    }
    res.status(204).send()
  } catch (e) {
    next(e)
  }
}
