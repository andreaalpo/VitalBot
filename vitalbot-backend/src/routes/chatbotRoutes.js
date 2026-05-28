import { Router } from 'express'
import * as chatbotController from '../controllers/chatbotController.js'

import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Rutas de consultas e historial del chatbot
router.post('/message', requireAuth, chatbotController.sendMessage)
router.post('/consulta', requireAuth, chatbotController.startConsulta)
router.get('/consultas', requireAuth, chatbotController.getConsultas)
router.get('/consulta/:id', requireAuth, chatbotController.getConsultaDetails)
router.post('/consulta/:id/message', requireAuth, chatbotController.sendConsultaMessage)

export default router
