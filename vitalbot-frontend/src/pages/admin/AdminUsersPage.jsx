import { useEffect, useState } from 'react'
import {
  adminListUsers,
  adminPatchUser,
  adminDeleteUser,
} from '../../api/admin.js'
import styles from './AdminLayout.module.css'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})

  async function load() {
    setErr('')
    try {
      const data = await adminListUsers()
      setUsers(data.users || [])
    } catch (e) {
      setErr(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function startEdit(u) {
    setEditing(u.id)
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
      phone: u.phone || '',
      birthDate: u.birthDate || '',
      gender: u.gender || '',
      city: u.city || '',
      password: '',
    })
  }

  async function save() {
    setErr('')
    try {
      const body = {
        name: form.name,
        email: form.email,
        role: form.role,
        active: form.active,
        phone: form.phone || null,
        birthDate: form.birthDate || null,
        gender: form.gender || null,
        city: form.city || null,
      }
      if (form.password?.trim()) body.password = form.password
      await adminPatchUser(editing, body)
      setEditing(null)
      await load()
    } catch (e) {
      setErr(e.message)
    }
  }

  async function remove(id) {
    if (!window.confirm('¿Eliminar usuario y sus datos de consulta asociados?'))
      return
    setErr('')
    try {
      await adminDeleteUser(id)
      await load()
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <>
      <h1 className={styles.h1}>Usuarios</h1>
      <p className={styles.sub}>Edita roles, datos de perfil o elimina cuentas.</p>
      {err && <p className={styles.alert}>{err}</p>}

      {editing && (
        <div className={styles.form}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Editar #{editing}</h2>
          <label>
            Nombre
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Correo
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Rol
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="usuario">usuario (cliente)</option>
              <option value="administrador">administrador</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />{' '}
            Activo
          </label>
          <label>
            Teléfono
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            Nacimiento (YYYY-MM-DD)
            <input
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
            />
          </label>
          <label>
            Género
            <input
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            />
          </label>
          <label>
            Ciudad
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>
          <label>
            Nueva contraseña (opcional, mín. 8)
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <div className={styles.actions}>
            <button type="button" className={styles.submit} onClick={save}>
              Guardar
            </button>
            <button type="button" onClick={() => setEditing(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Activo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span
                    className={`${styles.badge} ${u.role === 'administrador' ? styles.admin : ''}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td>{u.active ? 'sí' : 'no'}</td>
                <td>
                  <div className={styles.actions}>
                    <button type="button" onClick={() => startEdit(u)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className={styles.danger}
                      onClick={() => remove(u.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
