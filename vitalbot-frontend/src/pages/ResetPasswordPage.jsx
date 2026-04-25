import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPasswordRequest } from '../api/auth.js'
import styles from './AuthPage.module.css'
import formStyles from '../components/AuthForms.module.css'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  /** Misma URL que ve el navegador (por si el router no refleja el query). */
  function tokenFromLocation() {
    if (typeof window === 'undefined') return ''
    try {
      return new URLSearchParams(window.location.search).get('token')?.trim() || ''
    } catch {
      return ''
    }
  }

  const tokenParam = useMemo(
    () => searchParams.get('token')?.trim() || '',
    [searchParams],
  )
  const token = tokenParam || tokenFromLocation()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const submitLockRef = useRef(false)

  function validate(effectiveToken) {
    if (!effectiveToken) {
      setFieldError('Este enlace no incluye un token válido. Pedí uno nuevo.')
      return false
    }
    if (!password) {
      setFieldError('Ingresá una nueva contraseña.')
      return false
    }
    if (password.length < 8) {
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
    setSubmitError('')
    setSuccess('')
    if (submitLockRef.current) return
    if (!validate(token)) return

    submitLockRef.current = true
    setLoading(true)
    try {
      const data = await resetPasswordRequest(token, password)
      setSuccess(
        data.message || 'Contraseña actualizada. Redirigiendo al inicio de sesión…',
      )
      setTimeout(() => navigate('/', { replace: true }), 2000)
    } catch (err) {
      if (err instanceof TypeError) {
        setSubmitError(
          'No se pudo conectar con el servidor. ¿Está corriendo el API en el puerto 3000?',
        )
        return
      }
      setSubmitError(err.message || 'No se pudo actualizar la contraseña.')
    } finally {
      setLoading(false)
      submitLockRef.current = false
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
            <p className={styles.heroTagline}>Nueva contraseña</p>
            <p className={styles.heroDesc}>
              Elegí una contraseña segura que no uses en otros sitios.
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
              Restablecer contraseña
            </h2>

            {!token ? (
              <p className={formStyles.alert} role="alert">
                El enlace es inválido o está incompleto. Solicitá uno nuevo desde la
                pantalla de recuperación.
              </p>
            ) : (
              <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
                <label className={formStyles.label} htmlFor="reset-password">
                  Nueva contraseña
                </label>
                <input
                  id="reset-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  className={formStyles.input}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />

                <label className={formStyles.label} htmlFor="reset-confirm">
                  Confirmar contraseña
                </label>
                <input
                  id="reset-confirm"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  className={formStyles.input}
                  placeholder="Repetí la contraseña"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                  disabled={loading || !token}
                >
                  {loading ? 'Guardando…' : 'Guardar contraseña →'}
                </button>
              </form>
            )}

            <p style={{ margin: '1rem 0 0', fontSize: '0.85rem' }}>
              <Link
                to="/recuperar"
                style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
              >
                Solicitar otro enlace
              </Link>
              {' · '}
              <Link
                to="/"
                style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
              >
                Inicio de sesión
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
