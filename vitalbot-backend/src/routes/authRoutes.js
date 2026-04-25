import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)
router.get('/me', requireAuth, authController.me)
router.patch('/me', requireAuth, authController.patchMe)

export default router
