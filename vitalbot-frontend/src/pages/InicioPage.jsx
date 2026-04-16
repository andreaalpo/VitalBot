import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './InicioPage.module.css'

export default function InicioPage() {
  const navigate = useNavigate()
  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('vitalbot_user') || 'null')
    } catch {
      return null
    }
  }, [])

  function logout() {
    sessionStorage.removeItem('vitalbot_token')
    sessionStorage.removeItem('vitalbot_user')
    navigate('/', { replace: true })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>VitalBot</h1>
          <p className={styles.sub}>Sesión iniciada (vista provisional)</p>
        </div>
        <button type="button" className={styles.logout} onClick={logout}>
          Cerrar sesión
        </button>
      </header>
      <main className={styles.main}>
        <p className={styles.p}>
          {user?.name || user?.email
            ? `Hola${user.name ? `, ${user.name}` : ''}. Aquí conectarás el chat y el historial (RF-03, RF-08).`
            : 'Aquí conectarás el chat y el historial según el SRS.'}
        </p>
        <p className={styles.note}>
          Sin emergencias: si sientes riesgo de vida, llama al 123 de inmediato.
        </p>
      </main>
    </div>
  )
}
