import { useEffect, useState } from 'react'
import {
  adminListSintomas,
  adminCreateSintoma,
  adminPatchSintoma,
  adminDeleteSintoma,
} from '../../api/admin.js'
import styles from './AdminLayout.module.css'

const empty = {
  nombre: '',
  categoria: '',
  descripcion: '',
  esCritico: false,
  activo: true,
}

export default function AdminSintomasPage() {
  const [items, setItems] = useState([])
  const [err, setErr] = useState('')
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)

  async function load() {
    setErr('')
    try {
      const data = await adminListSintomas()
      setItems(data.sintomas || [])
    } catch (e) {
      setErr(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function create(e) {
    e.preventDefault()
    setErr('')
    try {
      await adminCreateSintoma(form)
      setForm(empty)
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  function startEdit(s) {
    setEditId(s.id)
    setForm({
      nombre: s.nombre,
      categoria: s.categoria,
      descripcion: s.descripcion,
      esCritico: s.esCritico,
      activo: s.activo,
    })
  }

  async function saveEdit(e) {
    e.preventDefault()
    setErr('')
    try {
      await adminPatchSintoma(editId, form)
      setEditId(null)
      setForm(empty)
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  async function remove(id) {
    if (!window.confirm('¿Eliminar síntoma?')) return
    setErr('')
    try {
      await adminDeleteSintoma(id)
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  return (
    <>
      <h1 className={styles.h1}>Síntomas (base del chatbot)</h1>
      <p className={styles.sub}>
        Alta, edición y baja. Si hay contenido educativo enlazado, puede bloquear
        el borrado.
      </p>
      {err && <p className={styles.alert}>{err}</p>}

      <form className={styles.form} onSubmit={editId ? saveEdit : create}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>
          {editId ? `Editar #${editId}` : 'Nuevo síntoma'}
        </h2>
        <label>
          Nombre
          <input
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </label>
        <label>
          Categoría
          <input
            required
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          />
        </label>
        <label>
          Descripción
          <textarea
            required
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.esCritico}
            onChange={(e) => setForm({ ...form, esCritico: e.target.checked })}
          />{' '}
          Es crítico
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => setForm({ ...form, activo: e.target.checked })}
          />{' '}
          Activo
        </label>
        <div className={styles.actions}>
          <button type="submit" className={styles.submit}>
            {editId ? 'Guardar' : 'Crear'}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null)
                setForm(empty)
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Crítico</th>
              <th>Activo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.nombre}</td>
                <td>{s.categoria}</td>
                <td>{s.esCritico ? 'sí' : 'no'}</td>
                <td>{s.activo ? 'sí' : 'no'}</td>
                <td>
                  <div className={styles.actions}>
                    <button type="button" onClick={() => startEdit(s)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className={styles.danger}
                      onClick={() => remove(s.id)}
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
