import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const isAdminUser = user?.role === 'administrador'

  function logout() {
    sessionStorage.removeItem('vitalbot_token')
    sessionStorage.removeItem('vitalbot_user')
    navigate('/', { replace: true })
  }

  const displayName = user?.name || 'Esteban'
  const displayEmail = user?.email || 'prueba@example.com'
  const avatarLetter = displayName.charAt(0).toUpperCase()

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <section className={styles.brandBlock}>
          <div className={styles.brandRow}>
            <img
              src="/logo-vitalbot.png"
              alt="VitalBot"
              className={styles.logo}
              width={44}
              height={44}
            />
            <div>
              <h2 className={styles.brandTitle}>VitalBot</h2>
              <p className={styles.brandSub}>Orientación en Salud</p>
            </div>
          </div>
        </section>

        <section className={styles.userBlock}>
          <div className={styles.avatar}>{avatarLetter}</div>
          <div>
            <p className={styles.userName}>{displayName}</p>
            <p className={styles.userEmail}>{displayEmail}</p>
          </div>
        </section>

        <button type="button" className={styles.newConsult}>
          + Nueva Consulta
        </button>

        <section className={styles.recent}>
          <h3 className={styles.sideHeading}>CONSULTAS RECIENTES</h3>
          <ul className={styles.recentList}>
            <li>Dolor de cabeza crónico</li>
            <li>Posible gastritis</li>
            <li>Dolor de estómago</li>
          </ul>
        </section>

        <section className={styles.library}>
          <Link 
            to="/biblioteca" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#1e3a8a',
              textDecoration: 'none',
              fontWeight: 600,
              padding: '0.5rem',
              backgroundColor: '#eff6ff',
              borderRadius: '6px',
              marginBottom: '1.5rem'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>📚</span>
            Biblioteca Médica
          </Link>
        </section>

        <section className={styles.risk}>
          <h3 className={styles.sideHeading}>NIVELES DE RIESGO</h3>
          <ul className={styles.riskList}>
            <li>
              <span className={`${styles.riskDot} ${styles.low}`} /> Bajo —
              Autocuidado
            </li>
            <li>
              <span className={`${styles.riskDot} ${styles.medium}`} /> Medio —
              Cita médica
            </li>
            <li>
              <span className={`${styles.riskDot} ${styles.high}`} /> Alto —
              Urgencias
            </li>
          </ul>
        </section>

        {isAdminUser && (
          <Link
            to="/admin"
            style={{
              display: 'block',
              textAlign: 'center',
              marginBottom: '0.75rem',
              color: '#1e3a8a',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Panel administrativo →
          </Link>
        )}

        <button type="button" className={styles.logout} onClick={logout}>
          ⛔ Cerrar Sesión
        </button>

        <p className={styles.disclaimer}>
          ⚕ VitalBot no emite diagnósticos médicos.
        </p>
      </aside>

      <main className={styles.chatArea}>
        <header className={styles.chatHeader}>
          <div>
            <h1 className={styles.chatTitle}>Orientación de Salud</h1>
            <p className={styles.chatSub}>
              Describe tus síntomas para recibir orientación
            </p>
          </div>
          <p className={styles.online}>
            <span className={styles.onlineDot} /> En línea
          </p>
        </header>

        <section className={styles.chatBody}>
          <article className={styles.botBubble}>
            <p>¡Hola! Soy VitalBot. ¿En qué te puedo ayudar hoy?</p>
            <p>Describe tus síntomas y te orientaré.</p>
            <button type="button" className={styles.listen}>
              🔊 Escuchar
            </button>
          </article>
        </section>

        <footer className={styles.chatFooter}>
          <p className={styles.warning}>
            ⚠ Sin emergencias: si sientes riesgo de vida, llama al 123 de
            inmediato.
          </p>
          <div className={styles.inputRow}>
            <input
              type="text"
              placeholder="Ej: Tengo fiebre alta desde hace 2 días y me duele la cabeza..."
              readOnly
            />
            <button type="button" className={styles.sendBtn}>
              ➤
            </button>
          </div>
        </footer>
      </main>
    </div>
  )
}
