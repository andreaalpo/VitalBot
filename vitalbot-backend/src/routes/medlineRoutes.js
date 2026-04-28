import { Router } from 'express'
import { searchHandler } from '../controllers/medlineController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Proteger la ruta para que solo usuarios autenticados puedan buscar
router.get('/search', requireAuth, searchHandler)

export default router
