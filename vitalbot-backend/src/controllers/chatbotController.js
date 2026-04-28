import { processMessage } from '../services/chatbotService.js'

export async function sendMessage(req, res, next) {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ error: 'El mensaje es requerido' })
    }

    const response = await processMessage(message)
    res.json(response)
  } catch (error) {
    next(error)
  }
}
