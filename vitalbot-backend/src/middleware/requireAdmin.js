/**
 * Uso: después de requireAuth. Endpoints solo para rol administrador.
 */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'administrador') {
    return res.status(403).json({ message: 'Se requieren permisos de administrador.' })
  }
  next()
}
