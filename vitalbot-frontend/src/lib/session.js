export function getToken() {
  return sessionStorage.getItem('vitalbot_token')
}

export function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('vitalbot_user') || 'null')
  } catch {
    return null
  }
}

export function isAuthenticated() {
  return Boolean(getToken())
}

/** Rol en API: "administrador" | "usuario" */
export function isAdmin() {
  return getStoredUser()?.role === 'administrador'
}
