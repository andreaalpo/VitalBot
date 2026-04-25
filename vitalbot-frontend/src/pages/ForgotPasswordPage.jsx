import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPasswordRequest } from '../api/auth.js'
import styles from './AuthPage.module.css'
import formStyles from '../components/AuthForms.module.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')
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
    setFieldError('')
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    setSuccess('')
    if (!validate()) return

    setLoading(true)
    try {
      const data = await forgotPasswordRequest(email)
      setSuccess(data.message || 'Revisá tu bandeja de entrada.')
    } catch (err) {
      if (err instanceof TypeError) {
        setSubmitError(
          'No se pudo conectar con el servidor. ¿Está corriendo el API en el puerto 3000?',
        )
        return
      }
      setSubmitError(err.message || 'No se pudo enviar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.layout}>
      <div className={styles.shell}>
        <aside className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.logoMark}>
              <img
                src="/logo-vitalbot.png"
                alt=""
                className={styles.logoImg}
                width={105}
                decoding="async"
              />
            </div>
            <h1 className={styles.heroBrand}>VitalBot</h1>
            <p className={styles.heroTagline}>Recuperar acceso</p>
            <p className={styles.heroDesc}>
              Te enviaremos un enlace seguro para elegir una nueva contraseña.
            </p>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.card}>
            <h2
              style={{
                margin: '0 0 1rem',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              ¿Olvidaste tu contraseña?
            </h2>
            <p
              style={{
                margin: '0 0 1rem',
                fontSize: '0.88rem',
                color: '#64748b',
                lineHeight: 1.5,
              }}
            >
              Escribí el correo con el que te registraste. Si existe en VitalBot,
              recibirás las instrucciones.
            </p>

            <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
              <label className={formStyles.label} htmlFor="forgot-email">
                Correo electrónico
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                className={formStyles.input}
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />

              {fieldError && (
                <p className={formStyles.alert} role="alert">
                  {fieldError}
                </p>
              )}
              {submitError && (
                <p className={formStyles.alert} role="alert">
                  {submitError}
                </p>
              )}
              {success && (
                <p className={formStyles.success} role="status">
                  {success}
                </p>
              )}

              <button
                type="submit"
                className={formStyles.submit}
                disabled={loading}
              >
                {loading ? 'Enviando…' : 'Enviar enlace →'}
              </button>
            </form>

            <p style={{ margin: '1rem 0 0', fontSize: '0.85rem' }}>
              <Link
                to="/"
                style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
              >
                ← Volver al inicio de sesión
              </Link>
            </p>

            <p className={styles.disclaimer}>
              <span className={styles.disclaimerIcon} aria-hidden="true">
                📍
              </span>
              VitalBot no reemplaza la consulta médica profesional.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
