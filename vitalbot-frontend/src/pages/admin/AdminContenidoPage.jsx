import { useEffect, useState } from 'react'
import {
  adminListContenido,
  adminListSintomas,
  adminCreateContenido,
  adminPatchContenido,
  adminDeleteContenido,
} from '../../api/admin.js'
import styles from './AdminLayout.module.css'

export default function AdminContenidoPage() {
  const [items, setItems] = useState([])
  const [sintomas, setSintomas] = useState([])
  const [err, setErr] = useState('')
  const [form, setForm] = useState({
    sintomaId: '',
    titulo: '',
    cuerpo: '',
    nivelRiesgoAsociado: 'bajo',
    activo: true,
  })
  const [editId, setEditId] = useState(null)

  async function load() {
    setErr('')
    try {
      const [c, s] = await Promise.all([
        adminListContenido(),
        adminListSintomas(),
      ])
      setItems(c.items || [])
      setSintomas(s.sintomas || [])
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
      await adminCreateContenido({
        ...form,
        sintomaId: Number(form.sintomaId),
      })
      setForm({
        sintomaId: '',
        titulo: '',
        cuerpo: '',
        nivelRiesgoAsociado: 'bajo',
        activo: true,
      })
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  function startEdit(row) {
    setEditId(row.id)
    setForm({
      sintomaId: String(row.sintomaId),
      titulo: row.titulo,
      cuerpo: row.cuerpo,
      nivelRiesgoAsociado: row.nivelRiesgoAsociado,
      activo: row.activo,
    })
  }

  async function saveEdit(e) {
    e.preventDefault()
    setErr('')
    try {
      await adminPatchContenido(editId, {
        sintomaId: Number(form.sintomaId),
        titulo: form.titulo,
        cuerpo: form.cuerpo,
        nivelRiesgoAsociado: form.nivelRiesgoAsociado,
        activo: form.activo,
      })
      setEditId(null)
      setForm({
        sintomaId: '',
        titulo: '',
        cuerpo: '',
        nivelRiesgoAsociado: 'bajo',
        activo: true,
      })
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  async function remove(id) {
    if (!window.confirm('¿Eliminar este contenido?')) return
    setErr('')
    try {
      await adminDeleteContenido(id)
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  return (
    <>
      <h1 className={styles.h1}>Contenido educativo</h1>
      <p className={styles.sub}>
        Textos vinculados a un síntoma y a un nivel de riesgo (bajo / medio /
        alto).
      </p>
      {err && <p className={styles.alert}>{err}</p>}

      <form className={styles.form} onSubmit={editId ? saveEdit : create}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>
          {editId ? `Editar #${editId}` : 'Nuevo contenido'}
        </h2>
        <label>
          Síntoma
          <select
            required
            value={form.sintomaId}
            onChange={(e) => setForm({ ...form, sintomaId: e.target.value })}
          >
            <option value="">— elegir —</option>
            {sintomas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Título
          <input
            required
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          />
        </label>
        <label>
          Cuerpo
          <textarea
            required
            value={form.cuerpo}
            onChange={(e) => setForm({ ...form, cuerpo: e.target.value })}
          />
        </label>
        <label>
          Nivel riesgo asociado
          <select
            value={form.nivelRiesgoAsociado}
            onChange={(e) =>
              setForm({ ...form, nivelRiesgoAsociado: e.target.value })
            }
          >
            <option value="bajo">bajo</option>
            <option value="medio">medio</option>
            <option value="alto">alto</option>
          </select>
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
                setForm({
                  sintomaId: '',
                  titulo: '',
                  cuerpo: '',
                  nivelRiesgoAsociado: 'bajo',
                  activo: true,
                })
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
              <th>Síntoma</th>
              <th>Título</th>
              <th>Riesgo</th>
              <th>Activo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.sintomaNombre}</td>
                <td>{r.titulo}</td>
                <td>{r.nivelRiesgoAsociado}</td>
                <td>{r.activo ? 'sí' : 'no'}</td>
                <td>
                  <div className={styles.actions}>
                    <button type="button" onClick={() => startEdit(r)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className={styles.danger}
                      onClick={() => remove(r.id)}
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
