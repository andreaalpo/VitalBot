import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './AuthForms.module.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState('')

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

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
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

      {fieldError && (
        <p className={styles.alert} role="alert">
          {fieldError}
        </p>
      )}

      <button type="submit" className={styles.submit}>
        Ingresar →
      </button>
    </form>
  )
}
