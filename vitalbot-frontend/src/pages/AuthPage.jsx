import { useState } from 'react'
import LoginForm from '../components/LoginForm.jsx'
import RegisterForm from '../components/RegisterForm.jsx'
import styles from './AuthPage.module.css'

export default function AuthPage() {
  const [tab, setTab] = useState('login')

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
            <p className={styles.heroTagline}>
              Tu asistente virtual de salud en Colombia
            </p>
            <p className={styles.heroDesc}>
              Orientación inteligente sobre tus síntomas, clasificación de riesgo
              y guía hacia la atención que necesitas — rápido, confiable y sin
              reemplazar al médico.
            </p>
            <ul className={styles.badges}>
              <li>
                <span className={styles.dot} data-level="bajo" /> Bajo Riesgo
              </li>
              <li>
                <span className={styles.dot} data-level="medio" /> Riesgo Medio
              </li>
              <li>
                <span className={styles.dot} data-level="alto" /> Alto Riesgo
              </li>
            </ul>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.card}>
            <div className={styles.tabs} role="tablist" aria-label="Acceso">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'login'}
                className={tab === 'login' ? styles.tabActive : styles.tabIdle}
                onClick={() => setTab('login')}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'register'}
                className={
                  tab === 'register' ? styles.tabActive : styles.tabIdle
                }
                onClick={() => setTab('register')}
              >
                Registrarse
              </button>
            </div>

            <div className={styles.panel}>
              {tab === 'login' ? <LoginForm /> : <RegisterForm />}
            </div>

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
