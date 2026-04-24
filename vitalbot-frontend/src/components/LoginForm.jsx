import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginRequest } from '../api/auth.js'
import styles from './AuthForms.module.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const GENERIC_AUTH_ERROR =
  'Las credenciales no son válidas. Verifica tu correo y contraseña.'

export default function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    if (!email.trim()) {
      setFieldError('Ingresa tu correo electrónico.')
      return false
    }
    if (!EMAIL_RE.test(email.trim())) {
      setFieldError('El correo no tiene un formato válido.')
      return false
    }
    if (!password) {
      setFieldError('Ingresa tu contraseña.')
      return false
    }
    setFieldError('')
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return

    setLoading(true)
    try {
      const data = await loginRequest(email, password)
      const token = data.token || data.accessToken
      if (!token) {
        setSubmitError(
          'Respuesta del servidor incompleta. Revisa el backend.',
        )
        return
      }
      sessionStorage.setItem('vitalbot_token', token)
      if (data.user) {
        sessionStorage.setItem('vitalbot_user', JSON.stringify(data.user))
      }
      const isAdminUser = data.user?.role === 'administrador'
      navigate(isAdminUser ? '/admin' : '/inicio', { replace: true })
    } catch (err) {
      if (err instanceof TypeError) {
        setSubmitError(
          'No se pudo conectar con el servidor. ¿Está corriendo el API en el puerto 3000?',
        )
        return
      }
      const msg = err.message || ''
      if (msg.includes('credenciales') || msg.includes('inválid')) {
        setSubmitError(GENERIC_AUTH_ERROR)
      } else {
        setSubmitError(msg || GENERIC_AUTH_ERROR)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label className={styles.label} htmlFor="login-email">
        Correo electrónico
      </label>
      <input
        id="login-email"
        name="email"
        type="email"
        autoComplete="email"
        className={styles.input}
        placeholder="correo@ejemplo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />

      <label className={styles.label} htmlFor="login-password">
        Contraseña
      </label>
      <input
        id="login-password"
        name="password"
        type="password"
        autoComplete="current-password"
        className={styles.input}
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />

      <div className={styles.rowLink}>
        <Link
          className={styles.forgotLink}
          to="/recuperar"
          onClick={(e) => e.preventDefault()}
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      {(fieldError || submitError) && (
        <p className={styles.alert} role="alert">
          {submitError || fieldError}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={loading}>
        {loading ? 'Ingresando…' : 'Ingresar →'}
      </button>
    </form>
  )
}
