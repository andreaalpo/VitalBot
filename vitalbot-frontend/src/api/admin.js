import { api } from './client.js'

export const adminStats = () => api('/admin/stats')

export const adminListUsers = () => api('/admin/users')
export const adminGetUser = (id) => api(`/admin/users/${id}`)
export const adminPatchUser = (id, body) =>
  api(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
export const adminDeleteUser = (id) =>
  api(`/admin/users/${id}`, { method: 'DELETE' })

export const adminListSintomas = () => api('/admin/sintomas')
export const adminCreateSintoma = (body) =>
  api('/admin/sintomas', { method: 'POST', body: JSON.stringify(body) })
export const adminPatchSintoma = (id, body) =>
  api(`/admin/sintomas/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
export const adminDeleteSintoma = (id) =>
  api(`/admin/sintomas/${id}`, { method: 'DELETE' })

export const adminListContenido = () => api('/admin/contenido-educativo')
export const adminCreateContenido = (body) =>
  api('/admin/contenido-educativo', {
    method: 'POST',
    body: JSON.stringify(body),
  })
export const adminPatchContenido = (id, body) =>
  api(`/admin/contenido-educativo/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
export const adminDeleteContenido = (id) =>
  api(`/admin/contenido-educativo/${id}`, { method: 'DELETE' })

export const adminListReglas = () => api('/admin/reglas-medicas')
export const adminCreateRegla = (body) =>
  api('/admin/reglas-medicas', { method: 'POST', body: JSON.stringify(body) })
export const adminPatchRegla = (id, body) =>
  api(`/admin/reglas-medicas/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
export const adminDeleteRegla = (id) =>
  api(`/admin/reglas-medicas/${id}`, { method: 'DELETE' })
