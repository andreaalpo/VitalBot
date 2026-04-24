import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import styles from './AdminLayout.module.css'

const links = [
  ['', 'Resumen'],
  ['usuarios', 'Usuarios'],
  ['sintomas', 'Síntomas (chatbot)'],
  ['contenido', 'Contenido educativo'],
  ['reglas', 'Reglas médicas'],
]

export default function AdminLayout() {
  const navigate = useNavigate()

  function logout() {
    sessionStorage.removeItem('vitalbot_token')
    sessionStorage.removeItem('vitalbot_user')
    navigate('/', { replace: true })
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>VitalBot · Admin</div>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
          Gestión de conocimiento médico y usuarios
        </p>
        <nav className={styles.nav}>
          {links.map(([path, label]) => (
            <NavLink
              key={path || 'home'}
              to={path ? `/admin/${path}` : '/admin'}
              end={path === ''}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.footer}>
          <button type="button" onClick={() => navigate('/inicio')}>
            Ir al chat (cliente)
          </button>
          <button type="button" onClick={logout} style={{ marginTop: '0.5rem' }}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
