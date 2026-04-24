import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import * as userModel from '../models/userModel.js'

const BCRYPT_ROUNDS = 10

function formatDate(d) {
  if (!d) return null
  if (d instanceof Date) return d.toISOString().slice(0, 10)
  if (typeof d === 'string') return d.slice(0, 10)
  return null
}

/** Evita fallos de JSON.stringify si `pg` devuelve bigint para columnas INT8. */
function publicUser(row) {
  return {
    id: Number(row.id),
    name: row.nombre_completo,
    email: row.correo_electronico,
    role: row.rol || 'usuario',
    phone: row.telefono ?? null,
    birthDate: formatDate(row.fecha_nacimiento),
    gender: row.genero ?? null,
    city: row.ciudad ?? null,
  }
}

function signToken(userRow) {
  return jwt.sign(
    {
      sub: String(userRow.id),
      email: userRow.correo_electronico,
      role: userRow.rol || 'usuario',
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  )
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1'
}

export async function getProfile(userId) {
  const row = await userModel.findById(userId)
  if (!row || !row.activo) return null
  return publicUser(row)
}

export async function patchProfile(userId, body) {
  const row = await userModel.findById(userId)
  if (!row || !row.activo) return null

  const patch = {}

  if (body.name !== undefined) {
    const n = String(body.name || '').trim()
    if (!n) {
      const err = new Error('El nombre no puede quedar vacío.')
      err.status = 400
      throw err
    }
    patch.nombre_completo = n
  }

  if (body.email !== undefined) {
    const e = String(body.email).trim().toLowerCase()
    if (!e) {
      const err = new Error('El correo no puede quedar vacío.')
      err.status = 400
      throw err
    }
    if (e !== row.correo_electronico) {
      const other = await userModel.findByEmailNormalized(e)
      if (other && Number(other.id) !== Number(userId)) {
        const err = new Error('El correo ya está registrado.')
        err.status = 409
        throw err
      }
      patch.correo_electronico = e
    }
  }

  if (body.phone !== undefined) {
    patch.telefono =
      body.phone === null || body.phone === ''
        ? null
        : String(body.phone).trim().slice(0, 20) || null
  }

  if (body.birthDate !== undefined) {
    if (body.birthDate === null || body.birthDate === '') {
      patch.fecha_nacimiento = null
    } else {
      const d = String(body.birthDate).slice(0, 10)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        const err = new Error('Fecha de nacimiento inválida (use YYYY-MM-DD).')
        err.status = 400
        throw err
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

  const updated = await userModel.updateUserProfile(userId, patch)
  if (!updated || !updated.activo) return null

  let token = null
  if (patch.correo_electronico) {
    token = signToken({
      id: updated.id,
      correo_electronico: updated.correo_electronico,
      rol: updated.rol,
    })
  }

  return { user: publicUser(updated), token }
}

/** Registro público: siempre rol `usuario` (usuario final / cliente). Administradores solo por BD o seed. */
export async function register({ name, email, password }) {
  const existing = await userModel.findByEmailNormalized(email)
  if (existing) {
    const err = new Error('El correo ya está registrado.')
    err.status = 409
    throw err
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  const row = await userModel.createUser({
    nombreCompleto: name.trim(),
    correo: email,
    passwordHash,
  })

  return {
    token: signToken({
      id: row.id,
      correo_electronico: row.correo_electronico,
      rol: row.rol,
    }),
    user: publicUser(row),
  }
}

export async function login({ email, password }, req) {
  const ip = clientIp(req)
  const user = await userModel.findByEmailNormalized(email)

  if (!user) {
    const err = new Error('CREDENTIALS_INVALID')
    err.status = 401
    throw err
  }

  if (!user.activo) {
    await userModel.insertAuthLog({
      usuarioId: user.id,
      tipo: 'login',
      ipCliente: ip,
      exitoso: false,
      detalle: 'Cuenta inactiva',
    })
    const err = new Error('CREDENTIALS_INVALID')
    err.status = 401
    throw err
  }

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) {
    await userModel.insertAuthLog({
      usuarioId: user.id,
      tipo: 'login',
      ipCliente: ip,
      exitoso: false,
      detalle: 'Contraseña incorrecta',
    })
    const err = new Error('CREDENTIALS_INVALID')
    err.status = 401
    throw err
  }

  await userModel.insertAuthLog({
    usuarioId: user.id,
    tipo: 'login',
    ipCliente: ip,
    exitoso: true,
    detalle: 'Inicio de sesión correcto',
  })

  const token = signToken(user)

  return {
    token,
    user: publicUser(user),
  }
}
