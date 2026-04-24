import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import * as admin from '../controllers/adminController.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/stats', admin.stats)

router.get('/users', admin.listUsers)
router.get('/users/:id', admin.getUser)
router.patch('/users/:id', admin.patchUser)
router.delete('/users/:id', admin.deleteUser)

router.get('/sintomas', admin.listSintomas)
router.post('/sintomas', admin.createSintoma)
router.patch('/sintomas/:id', admin.patchSintoma)
router.delete('/sintomas/:id', admin.removeSintoma)

router.get('/contenido-educativo', admin.listContenido)
router.post('/contenido-educativo', admin.createContenido)
router.patch('/contenido-educativo/:id', admin.patchContenido)
router.delete('/contenido-educativo/:id', admin.removeContenido)

router.get('/reglas-medicas', admin.listReglas)
router.post('/reglas-medicas', admin.createRegla)
router.patch('/reglas-medicas/:id', admin.patchRegla)
router.delete('/reglas-medicas/:id', admin.removeRegla)

export default router
