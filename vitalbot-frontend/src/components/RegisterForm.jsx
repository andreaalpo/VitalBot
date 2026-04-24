import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerRequest } from '../api/auth.js'
import styles from './AuthForms.module.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function passwordOk(p) {
  return p.length >= 8
}

export default function RegisterForm() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

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

  async function handleSubmit(e) {
    e.preventDefault()
    setSuccessMsg('')
    if (!validate()) return

    setLoading(true)
    try {
      const data = await registerRequest({
        name: name.trim(),
        email: email.trim(),
        password,
      })
      const token = data.token || data.accessToken
      if (token) {
        sessionStorage.setItem('vitalbot_token', token)
        if (data.user) {
          sessionStorage.setItem('vitalbot_user', JSON.stringify(data.user))
        }
        setFieldError('')
        setSuccessMsg('Cuenta creada. Entrando…')
        navigate('/inicio', { replace: true })
        return
      }
      setFieldError('')
      setSuccessMsg('Cuenta creada. Ya puedes iniciar sesión.')
      setName('')
      setEmail('')
      setPassword('')
      setConfirm('')
    } catch (err) {
      if (err instanceof TypeError) {
        setFieldError(
          'No se pudo conectar con el servidor. ¿Está corriendo el API en el puerto 3000?',
        )
      } else {
        setFieldError(err.message || 'No se pudo completar el registro.')
      }
    } finally {
      setLoading(false)
    }
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
        disabled={loading}
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
        disabled={loading}
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
        disabled={loading}
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
        disabled={loading}
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

      <button type="submit" className={styles.submit} disabled={loading}>
        {loading ? 'Creando cuenta…' : 'Crear Cuenta →'}
      </button>
    </form>
  )
}
