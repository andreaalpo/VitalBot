import * as authService from '../services/authService.js'

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {}

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Faltan datos obligatorios.' })
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: 'La contraseña debe tener al menos 8 caracteres.' })
    }

    const result = await authService.register({ name, email, password })
    return res.status(201).json(result)
  } catch (e) {
    next(e)
  }
}

export async function me(req, res, next) {
  try {
    const userId = Number(req.user.id)
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ message: 'Sesión inválida.' })
    }
    const user = await authService.getProfile(userId)
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado o inactivo.' })
    }
    return res.json({ user })
  } catch (e) {
    next(e)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {}

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son obligatorios.' })
    }

    const result = await authService.login({ email, password }, req)
    return res.json(result)
  } catch (e) {
    if (e.message === 'CREDENTIALS_INVALID') {
      return res.status(401).json({
        message:
          'Las credenciales no son válidas. Verifica tu correo y contraseña.',
      })
    }
    next(e)
  }
}
