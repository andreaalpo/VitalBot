import { useState } from 'react'
import styles from './AuthForms.module.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOCK_USERS_KEY = 'vitalbot_mock_users'

function passwordOk(p) {
  return p.length >= 8
}

export default function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  function readMockUsers() {
    try {
      const data = localStorage.getItem(MOCK_USERS_KEY)
      const users = JSON.parse(data || '[]')
      return Array.isArray(users) ? users : []
    } catch {
      return []
    }
  }

  function validate() {
    if (!name.trim()) {
      setFieldError('Ingresa tu nombre completo.')
      return false
    }
    if (!email.trim() || !EMAIL_RE.test(email.trim())) {
      setFieldError('Ingresa un correo electrónico válido.')
      return false
    }
    if (!passwordOk(password)) {
      setFieldError('La contraseña debe tener al menos 8 caracteres.')
      return false
    }
    if (password !== confirm) {
      setFieldError('Las contraseñas no coinciden.')
      return false
    }
    setFieldError('')
    return true
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSuccessMsg('')
    if (!validate()) return

    const users = readMockUsers()
    const normalizedEmail = email.trim().toLowerCase()
    const exists = users.some(
      (user) => user.email?.toLowerCase() === normalizedEmail,
    )

    if (exists) {
      setFieldError('Ese correo ya está registrado. Inicia sesión.')
      return
    }

    const nextUsers = [
      ...users,
      {
        name: name.trim(),
        email: normalizedEmail,
        password,
      },
    ]
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(nextUsers))
    setFieldError('')
    setSuccessMsg('Cuenta creada localmente. Ya puedes iniciar sesión.')
    setName('')
    setEmail('')
    setPassword('')
    setConfirm('')
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label className={styles.label} htmlFor="reg-name">
        Nombre completo
      </label>
      <input
        id="reg-name"
        name="name"
        type="text"
        autoComplete="name"
        className={styles.input}
        placeholder="Juan Pérez"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label className={styles.label} htmlFor="reg-email">
        Correo electrónico
      </label>
      <input
        id="reg-email"
        name="email"
        type="email"
        autoComplete="email"
        className={styles.input}
        placeholder="correo@ejemplo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className={styles.label} htmlFor="reg-password">
        Contraseña
      </label>
      <input
        id="reg-password"
        name="password"
        type="password"
        autoComplete="new-password"
        className={styles.input}
        placeholder="Mínimo 8 caracteres"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <label className={styles.label} htmlFor="reg-confirm">
        Confirmar contraseña
      </label>
      <input
        id="reg-confirm"
        name="confirm"
        type="password"
        autoComplete="new-password"
        className={styles.input}
        placeholder="Repite la contraseña"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      {fieldError && (
        <p className={styles.alert} role="alert">
          {fieldError}
        </p>
      )}

      {successMsg && (
        <p className={styles.success} role="status">
          {successMsg}
        </p>
      )}

      <button type="submit" className={styles.submit}>
        Crear Cuenta →
      </button>
    </form>
  )
}
