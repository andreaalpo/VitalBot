import { Router } from 'express'
import * as chatbotController from '../controllers/chatbotController.js'

import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Proteger la ruta de chat (opcional, pero recomendado)
router.post('/message', requireAuth, chatbotController.sendMessage)

export default router
