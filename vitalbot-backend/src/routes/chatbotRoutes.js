import { Router } from 'express'
import * as chatbotController from '../controllers/chatbotController.js'

const router = Router()

router.post('/message', chatbotController.notImplemented)
router.get('/status', chatbotController.notImplemented)

export default router
