import { query } from '../config/db.js'
import { processMessage, processConsultaMessage } from '../services/chatbotService.js'

/**
 * Endpoint clásico (sin sesión en base de datos)
 */
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

/**
 * Inicia una nueva consulta en la base de datos
 */
export async function startConsulta(req, res, next) {
  try {
    const userId = Number(req.user.id)

    // 1. Obtener o crear pseudónimo de usuario
    let pseudoRes = await query(
      'SELECT id, pseudonimo FROM pseudonimo_usuario WHERE usuario_id = $1 LIMIT 1',
      [userId]
    )

    let pseudoId
    if (pseudoRes.rows.length === 0) {
      const code = Math.random().toString(36).substring(2, 6).toUpperCase()
      const num = Math.floor(1000 + Math.random() * 9000)
      const pseudonym = `Paciente-${code}${num}`
      
      const insertRes = await query(
        'INSERT INTO pseudonimo_usuario (usuario_id, pseudonimo, creado_en) VALUES ($1, $2, NOW()) RETURNING id',
        [userId, pseudonym]
      )
      pseudoId = insertRes.rows[0].id
    } else {
      pseudoId = pseudoRes.rows[0].id
    }

    // 2. Crear la consulta
    const consultaRes = await query(
      `INSERT INTO consulta (pseudonimo_usuario, nivel_riesgo, recomendacion, alerta_critica, fecha_hora, estado)
       VALUES ($1, 'Pendiente', '', false, NOW(), 'activa')
       RETURNING id`,
      [pseudoId]
    )
    const consultaId = Number(consultaRes.rows[0].id)

    // 3. Buscar el nombre del usuario para el mensaje inicial
    const userRes = await query('SELECT nombre_completo FROM usuario WHERE id = $1', [userId])
    const name = userRes.rows[0]?.nombre_completo || 'Paciente'
    const firstName = name.split(' ')[0]

    const welcomeText = `**¡Hola, ${firstName}!** Soy VitalBot.\n\nEstoy aquí para orientarte sobre tus síntomas y ayudarte a entender mejor qué podría estar pasando. ¿En qué te puedo ayudar hoy?`

    // 4. Guardar mensaje inicial de bot en la BD
    await query(
      `INSERT INTO mensaje_chat (consulta_id, rol, contenido, orden, fecha_hora)
       VALUES ($1, 'bot', $2, 0, NOW())`,
      [consultaId, welcomeText]
    )

    res.status(201).json({
      consultaId,
      welcomeMessage: {
        role: 'bot',
        text: welcomeText,
        references: []
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Obtiene el listado de consultas del usuario
 */
export async function getConsultas(req, res, next) {
  try {
    const userId = Number(req.user.id)

    const { rows } = await query(
      `SELECT c.id, c.nivel_riesgo AS "nivelRiesgo", c.recomendacion, 
              c.alerta_critica AS "alertaCritica", c.fecha_hora AS "fechaHora", c.estado
       FROM consulta c
       JOIN pseudonimo_usuario p ON c.pseudonimo_usuario = p.id
       WHERE p.usuario_id = $1
       ORDER BY c.fecha_hora DESC`,
      [userId]
    )

    res.json({ consultas: rows })
  } catch (error) {
    next(error)
  }
}

/**
 * Obtiene los detalles de una consulta específica y sus mensajes
 */
export async function getConsultaDetails(req, res, next) {
  try {
    const userId = Number(req.user.id)
    const consultaId = Number(req.params.id)

    // Validar propiedad de la consulta
    const verifyRes = await query(
      `SELECT c.id, c.nivel_riesgo AS "nivelRiesgo", c.recomendacion, c.alerta_critica AS "alertaCritica"
       FROM consulta c
       JOIN pseudonimo_usuario p ON c.pseudonimo_usuario = p.id
       WHERE c.id = $1 AND p.usuario_id = $2`,
      [consultaId, userId]
    )

    if (verifyRes.rows.length === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada o no autorizada.' })
    }

    // Obtener los mensajes de la consulta
    const messagesRes = await query(
      `SELECT rol, contenido AS text, fecha_hora AS "fechaHora"
       FROM mensaje_chat
       WHERE consulta_id = $1
       ORDER BY orden ASC`,
      [consultaId]
    )

    // Formatear mensajes para el frontend
    const messages = messagesRes.rows.map(m => ({
      role: m.rol,
      text: m.text,
      references: [] // Las referencias de MedlinePlus se incrustan en el texto o se pueden derivar
    }))

    res.json({
      consulta: verifyRes.rows[0],
      messages
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Procesa y envía un nuevo mensaje dentro de una consulta activa
 */
export async function sendConsultaMessage(req, res, next) {
  try {
    const userId = Number(req.user.id)
    const consultaId = Number(req.params.id)
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ error: 'El mensaje es requerido' })
    }

    const response = await processConsultaMessage(consultaId, userId, message)
    res.json(response)
  } catch (error) {
    next(error)
  }
}
