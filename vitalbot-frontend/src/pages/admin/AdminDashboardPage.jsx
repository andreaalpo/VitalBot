import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminStats } from '../../api/admin.js'
import styles from './AdminLayout.module.css'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    adminStats()
      .then(setStats)
      .catch((e) => setErr(e.message))
  }, [])

  return (
    <>
      <h1 className={styles.h1}>Panel administrativo</h1>
      <p className={styles.sub}>
        Aquí gestionas usuarios, síntomas, contenido educativo y reglas que
        alimentan el chatbot. Los clientes usan solo la vista de{' '}
        <Link to="/inicio" style={{ color: '#6ee7b7' }}>
          orientación / chat
        </Link>
        .
      </p>
      {err && <p className={styles.alert}>{err}</p>}
      {stats && (
        <div className={styles.cards}>
          <div className={styles.card}>
            <strong>{stats.usuarios}</strong>
            <span>Usuarios</span>
          </div>
          <div className={styles.card}>
            <strong>{stats.sintomas}</strong>
            <span>Síntomas</span>
          </div>
          <div className={styles.card}>
            <strong>{stats.contenidoEducativo}</strong>
            <span>Contenido educativo</span>
          </div>
          <div className={styles.card}>
            <strong>{stats.reglasMedicas}</strong>
            <span>Reglas médicas</span>
          </div>
        </div>
      )}
      <ul style={{ color: '#94a3b8', lineHeight: 1.7 }}>
        <li>
          <Link to="/admin/usuarios" style={{ color: '#6ee7b7' }}>
            Usuarios
          </Link>
          : listar, editar, desactivar o eliminar cuentas.
        </li>
        <li>
          <Link to="/admin/sintomas" style={{ color: '#6ee7b7' }}>
            Síntomas
          </Link>
          : catálogo para el motor del chatbot.
        </li>
        <li>
          <Link to="/admin/contenido" style={{ color: '#6ee7b7' }}>
            Contenido educativo
          </Link>
          : textos asociados a síntomas y nivel de riesgo.
        </li>
        <li>
          <Link to="/admin/reglas" style={{ color: '#6ee7b7' }}>
            Reglas médicas
          </Link>
          : condiciones JSON + recomendaciones (eliminar obsoletas aquí).
        </li>
      </ul>
    </>
  )
}
