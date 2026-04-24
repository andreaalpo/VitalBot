import { useEffect, useState } from 'react'
import {
  adminListReglas,
  adminCreateRegla,
  adminPatchRegla,
  adminDeleteRegla,
} from '../../api/admin.js'
import styles from './AdminLayout.module.css'

export default function AdminReglasPage() {
  const [reglas, setReglas] = useState([])
  const [err, setErr] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    condicionJson: '{}',
    nivelRiesgoResultado: 'bajo',
    recomendacion: '',
    prioridad: 0,
    activa: true,
  })
  const [editId, setEditId] = useState(null)

  async function load() {
    setErr('')
    try {
      const data = await adminListReglas()
      setReglas(data.reglas || [])
    } catch (e) {
      setErr(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function parseJson() {
    try {
      return JSON.parse(form.condicionJson || '{}')
    } catch {
      throw new Error('condicionJson debe ser JSON válido.')
    }
  }

  async function create(e) {
    e.preventDefault()
    setErr('')
    try {
      const condicionJson = parseJson()
      await adminCreateRegla({
        nombre: form.nombre,
        condicionJson,
        nivelRiesgoResultado: form.nivelRiesgoResultado,
        recomendacion: form.recomendacion,
        prioridad: Number(form.prioridad) || 0,
        activa: form.activa,
      })
      setForm({
        nombre: '',
        condicionJson: '{}',
        nivelRiesgoResultado: 'bajo',
        recomendacion: '',
        prioridad: 0,
        activa: true,
      })
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  function startEdit(r) {
    setEditId(r.id)
    setForm({
      nombre: r.nombre,
      condicionJson: JSON.stringify(r.condicionJson ?? {}, null, 2),
      nivelRiesgoResultado: r.nivelRiesgoResultado,
      recomendacion: r.recomendacion,
      prioridad: r.prioridad,
      activa: r.activa,
    })
  }

  async function saveEdit(e) {
    e.preventDefault()
    setErr('')
    try {
      const condicionJson = parseJson()
      await adminPatchRegla(editId, {
        nombre: form.nombre,
        condicionJson,
        nivelRiesgoResultado: form.nivelRiesgoResultado,
        recomendacion: form.recomendacion,
        prioridad: Number(form.prioridad) || 0,
        activa: form.activa,
      })
      setEditId(null)
      setForm({
        nombre: '',
        condicionJson: '{}',
        nivelRiesgoResultado: 'bajo',
        recomendacion: '',
        prioridad: 0,
        activa: true,
      })
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  async function remove(id) {
    if (!window.confirm('¿Eliminar regla y sus enlaces a síntomas?')) return
    setErr('')
    try {
      await adminDeleteRegla(id)
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  return (
    <>
      <h1 className={styles.h1}>Reglas médicas</h1>
      <p className={styles.sub}>
        Condiciones en JSON (para el motor del chatbot) y recomendaciones. Las
        obsoletas puedes desactivarlas o borrarlas.
      </p>
      {err && <p className={styles.alert}>{err}</p>}

      <form className={styles.form} onSubmit={editId ? saveEdit : create}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>
          {editId ? `Editar #${editId}` : 'Nueva regla'}
        </h2>
        <label>
          Nombre único
          <input
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </label>
        <label>
          Condición JSON
          <textarea
            required
            value={form.condicionJson}
            onChange={(e) =>
              setForm({ ...form, condicionJson: e.target.value })
            }
            style={{ minHeight: 120, fontFamily: 'monospace', fontSize: 12 }}
          />
        </label>
        <label>
          Nivel riesgo resultado
          <select
            value={form.nivelRiesgoResultado}
            onChange={(e) =>
              setForm({ ...form, nivelRiesgoResultado: e.target.value })
            }
          >
            <option value="bajo">bajo</option>
            <option value="medio">medio</option>
            <option value="alto">alto</option>
          </select>
        </label>
        <label>
          Recomendación
          <textarea
            required
            value={form.recomendacion}
            onChange={(e) =>
              setForm({ ...form, recomendacion: e.target.value })
            }
          />
        </label>
        <label>
          Prioridad (mayor = más importante)
          <input
            type="number"
            value={form.prioridad}
            onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.activa}
            onChange={(e) => setForm({ ...form, activa: e.target.checked })}
          />{' '}
          Activa
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
                  nombre: '',
                  condicionJson: '{}',
                  nivelRiesgoResultado: 'bajo',
                  recomendacion: '',
                  prioridad: 0,
                  activa: true,
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
              <th>Nombre</th>
              <th>Riesgo</th>
              <th>Prioridad</th>
              <th>Activa</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {reglas.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.nombre}</td>
                <td>{r.nivelRiesgoResultado}</td>
                <td>{r.prioridad}</td>
                <td>{r.activa ? 'sí' : 'no'}</td>
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
