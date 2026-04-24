import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import * as userModel from '../models/userModel.js'

const BCRYPT_ROUNDS = 10

/** Evita fallos de JSON.stringify si `pg` devuelve bigint para columnas INT8. */
function publicUser(row) {
  return {
    id: Number(row.id),
    name: row.nombre_completo,
    email: row.correo_electronico,
  }
}

function signToken(userRow) {
  return jwt.sign(
    {
      sub: String(userRow.id),
      email: userRow.correo_electronico,
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
