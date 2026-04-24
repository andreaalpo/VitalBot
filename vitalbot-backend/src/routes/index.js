import { Router } from 'express'
import authRoutes from './authRoutes.js'
import chatbotRoutes from './chatbotRoutes.js'
import adminRoutes from './adminRoutes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/admin', adminRoutes)
router.use('/chatbot', chatbotRoutes)

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'vitalbot-backend' })
})

export default router
