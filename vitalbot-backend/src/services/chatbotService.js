import { query } from '../config/db.js'
import { searchMedline } from './medlineService.js'
import { env } from '../config/env.js'

/**
 * Normaliza un texto para mejorar la búsqueda:
 * Convierte a minúsculas y elimina tildes/acentos.
 */
function normalizeText(text) {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Procesa el mensaje clásico sin almacenar sesión en BD.
 */
export async function processMessage(userMessage) {
  if (!userMessage || userMessage.trim() === '') {
    return {
      text: 'No he recibido ningún mensaje. Por favor, cuéntame qué te sucede.',
      references: []
    }
  }

  const normalizedUserMessage = normalizeText(userMessage)

  let activeSymptoms = []
  try {
    const { rows } = await query('SELECT nombre, es_critico FROM sintoma WHERE activo = true')
    activeSymptoms = rows
  } catch (error) {
    console.error('[chatbotService] Error al obtener síntomas:', error)
  }

  const matchedSymptoms = []
  let isCritical = false
  for (const symptom of activeSymptoms) {
    const normalizedSymptomName = normalizeText(symptom.nombre)
    if (normalizedUserMessage.includes(normalizedSymptomName)) {
      matchedSymptoms.push(symptom.nombre)
      if (symptom.es_critico) isCritical = true
    }
  }

  let references = []
  let botText = ''

  if (matchedSymptoms.length > 0) {
    const symptomList = matchedSymptoms.join(', ')
    botText = `He identificado que mencionas: **${symptomList}**. `
    botText += `Aquí tienes información oficial de MedlinePlus que podría serte útil:`

    const mainSymptom = matchedSymptoms[0]
    try {
      const results = await searchMedline(mainSymptom)
      references = results.slice(0, 3)
      
      if (results.length > 0) {
        botText += `\n\nSegún la Biblioteca Nacional de Medicina sobre **${results[0].title}**: \n"${results[0].snippet}"\n`
      }
    } catch (error) {
      console.error('[chatbotService] Error en MedlinePlus:', error)
    }
  } else {
    botText = `No he identificado un síntoma específico en mi base de datos, pero he buscado tu consulta en MedlinePlus. `
    
    try {
      const results = await searchMedline(userMessage)
      if (results.length > 0) {
        botText += `Esto es lo que encontré sobre **${results[0].title}**:\n\n> "${results[0].snippet}"\n`
        references = results.slice(0, 3)
      } else {
        botText = `No he encontrado información sobre lo que mencionas en los "Temas de Salud" principales. `
        botText += `Por favor, intenta darme más detalles o ser más específico. `
      }
    } catch (error) {
      console.error('[chatbotService] Error en MedlinePlus:', error)
      botText += `Sin embargo, en este momento no puedo conectarme con la base médica.`
    }
  }

  botText += `\n\n*Recuerda: Esta información es educativa y no reemplaza el consejo de un profesional de la salud.*`

  return {
    text: botText,
    references,
    matchedSymptoms
  }
}

/**
 * Procesa un mensaje de chat dentro de una consulta registrada en la BD.
 * Realiza una consulta RAG a Gemini integrando MedlinePlus y reglas locales.
 */
export async function processConsultaMessage(consultaId, userId, userMessage) {
  // 1. Validar propiedad de la consulta
  const verify = await query(
    `SELECT c.id, c.nivel_riesgo FROM consulta c
     JOIN pseudonimo_usuario p ON c.pseudonimo_usuario = p.id
     WHERE c.id = $1 AND p.usuario_id = $2`,
    [consultaId, userId]
  )
  if (verify.rows.length === 0) {
    throw new Error('Consulta no autorizada o no encontrada')
  }

  // 2. Obtener el número de mensajes actuales para establecer el orden del nuevo mensaje de usuario
  const orderRes = await query('SELECT COUNT(*)::int AS count FROM mensaje_chat WHERE consulta_id = $1', [consultaId])
  const userOrder = orderRes.rows[0].count

  // 3. Registrar mensaje del usuario en mensaje_chat
  await query(
    `INSERT INTO mensaje_chat (consulta_id, rol, contenido, orden, fecha_hora)
     VALUES ($1, 'user', $2, $3, NOW())`,
    [consultaId, userMessage, userOrder]
  )

  // 4. Obtener el historial completo de la consulta
  const historyRes = await query(
    `SELECT rol, contenido FROM mensaje_chat WHERE consulta_id = $1 ORDER BY orden ASC`,
    [consultaId]
  )
  const history = historyRes.rows.map(h => ({ role: h.rol, text: h.contenido }))

  // 5. Obtener síntomas y reglas activas de la base de datos
  let activeSymptoms = []
  let activeRules = []
  try {
    const sympRes = await query('SELECT id, nombre, categoria, es_critico FROM sintoma WHERE activo = true')
    activeSymptoms = sympRes.rows

    const rulesRes = await query('SELECT id, nombre, condicion_json, nivel_riesgo_resultado, recomendacion FROM regla_medica WHERE activa = true')
    activeRules = rulesRes.rows
  } catch (error) {
    console.error('[chatbotService] Error al obtener síntomas/reglas locales:', error)
  }

  // 6. Detectar cuáles síntomas coinciden heurísticamente en el mensaje del usuario para optimizar la búsqueda de MedlinePlus
  const normalizedUserMessage = normalizeText(userMessage)
  const matchedSymptoms = []
  for (const symptom of activeSymptoms) {
    const normalizedSymptomName = normalizeText(symptom.nombre)
    if (normalizedUserMessage.includes(normalizedSymptomName)) {
      matchedSymptoms.push(symptom.nombre)
    }
  }

  // 7. Consultar MedlinePlus para información médica externa
  let medlineResults = []
  try {
    // Si detectamos un síntoma específico en la BD, buscamos ese síntoma; de lo contrario, buscamos el mensaje original del usuario
    const searchQuery = matchedSymptoms.length > 0 ? matchedSymptoms[0] : userMessage
    medlineResults = await searchMedline(searchQuery)
  } catch (error) {
    console.error('[chatbotService] Error al buscar en MedlinePlus:', error)
  }
  const references = medlineResults.slice(0, 3)

  // Variables para la respuesta final
  let responseText = ''
  let riskLevel = 'Pendiente'
  let recommendation = ''
  let criticalAlert = false
  let matchedSymptomIds = []

  // 8. Llamar a la API de Gemini (si está configurada)
  if (env.GEMINI_API_KEY) {
    try {
      // Formatear síntomas locales
      const symptomsStr = activeSymptoms.map(s => `- ID: ${s.id}, Nombre: "${s.nombre}", Categoría: "${s.categoria}", Crítico: ${s.es_critico}`).join('\n')
      
      // Formatear reglas locales
      const rulesStr = activeRules.map(r => `- ID: ${r.id}, Nombre: "${r.nombre}", Condición: ${JSON.stringify(r.condicion_json)}, Riesgo: "${r.nivel_riesgo_resultado}", Recomendación: "${r.recomendacion}"`).join('\n')
      
      // Formatear resultados de MedlinePlus
      const medlineStr = references.length > 0 
        ? references.map(r => `- Título: "${r.title}", Resumen: "${r.snippet}", URL: "${r.url}"`).join('\n')
        : 'No se encontraron resultados relevantes de MedlinePlus para esta búsqueda.'

      const systemInstructionText = `Eres VitalBot, un orientador de salud virtual de inteligencia artificial empático, compasivo y profesional.
Analiza la conversación actual del paciente, utiliza el contexto suministrado (síntomas locales, reglas médicas y resultados de búsqueda de MedlinePlus) y devuelve una respuesta estructurada en formato JSON que responda al paciente.

### SÍNTOMAS DISPONIBLES EN LA BASE DE DATOS LOCAL:
${symptomsStr}

### REGLAS MÉDICAS LOCALES APLICABLES:
${rulesStr}

### RESULTADOS DE BÚSQUEDA EN MEDLINEPLUS (INFORMACIÓN OFICIAL):
${medlineStr}

### INSTRUCCIONES:
1. Analiza el último mensaje del paciente y determina si presenta alguno de los síntomas locales. Si es así, incluye sus IDs en el array 'matched_symptom_ids'.
2. Evalúa el nivel de riesgo en 'risk_level' ('Bajo', 'Medio' o 'Alto'). Debe ser 'Alto' si hay peligro de vida (dolor de pecho, dificultad respiratoria grave, confusión, pérdida de sangre severa, etc.) o si alguna regla local lo indica. Debe ser 'Medio' si requiere consulta médica regular. Debe ser 'Bajo' para síntomas leves de autocuidado.
3. Si los resultados de MedlinePlus están vacíos o no corresponden al síntoma del paciente, utiliza tu conocimiento médico general propio para proporcionar una orientación segura, clara y útil, pero aclara amablemente que la búsqueda oficial en MedlinePlus no arrojó resultados directos.
4. Si la información del paciente es muy vaga o ambigua para determinar sus síntomas o el nivel de riesgo, haz preguntas de seguimiento empáticas y directas en 'response_text' para obtener más detalles.
5. Escribe 'response_text' en español para el paciente:
   - Estructúrala de forma legible usando negritas, listas o saltos de línea para facilitar su lectura.
   - Usa EXCLUSIVAMENTE formato Markdown estándar (por ejemplo: **texto** para negrita, y - elemento para viñetas). NO uses ninguna etiqueta HTML como <ul>, <li> o <b>.
   - Sé empático, profesional y claro.
   - Explica lo que podría estar sucediendo basándote en la información educativa disponible.
   - Recomienda las acciones apropiadas para el nivel de riesgo (autocuidado, cita médica presencial o ir a urgencias).
   - SIEMPRE termina el texto con la advertencia: '*Recuerda: Esta información es educativa y no reemplaza el consejo de un profesional de la salud.*'
6. En 'recommendation' redacta una breve instrucción de recomendación para el paciente (máx. 150 caracteres).
7. En 'critical_alert' pon true si el riesgo es Alto, de lo contrario false.
`

      // Mapear historial al formato nativo de turnos de Gemini
      const contents = []
      for (const h of history) {
        const role = h.role === 'user' ? 'user' : 'model'
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          // Si hay mensajes consecutivos con el mismo rol, los fusionamos con un salto de línea
          contents[contents.length - 1].parts[0].text += '\n' + h.text
        } else {
          contents.push({
            role,
            parts: [{ text: h.text }]
          })
        }
      }

      const geminiBody = {
        systemInstruction: {
          parts: [{ text: systemInstructionText }]
        },
        contents,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              response_text: { type: "STRING" },
              risk_level: { type: "STRING", enum: ["Bajo", "Medio", "Alto"] },
              critical_alert: { type: "BOOLEAN" },
              recommendation: { type: "STRING" },
              matched_symptom_ids: {
                type: "ARRAY",
                items: { type: "INTEGER" }
              }
            },
            required: ["response_text", "risk_level", "critical_alert", "recommendation", "matched_symptom_ids"]
          }
        }
      }

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody)
        }
      )

      if (!geminiRes.ok) {
        const errorText = await geminiRes.text()
        throw new Error(`Gemini API respondió con código ${geminiRes.status}: ${errorText}`)
      }

      const geminiData = await geminiRes.json()
      const rawJson = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!rawJson) {
        throw new Error('La API de Gemini devolvió una respuesta vacía o con formato inesperado.')
      }

      const parsed = JSON.parse(rawJson.trim())
      responseText = parsed.response_text
      riskLevel = parsed.risk_level
      recommendation = parsed.recommendation
      criticalAlert = parsed.critical_alert
      matchedSymptomIds = parsed.matched_symptom_ids || []

    } catch (geminiError) {
      console.error('[chatbotService] Error en llamada a Gemini API, activando fallback:', geminiError)
      // Activar el motor de fallback en caso de error
      const fallback = runFallbackEngine(userMessage, activeSymptoms, references)
      responseText = fallback.responseText
      riskLevel = fallback.riskLevel
      recommendation = fallback.recommendation
      criticalAlert = fallback.criticalAlert
      matchedSymptomIds = fallback.matchedSymptomIds
    }
  } else {
    // Si no hay API KEY, usar el fallback heurístico local
    const fallback = runFallbackEngine(userMessage, activeSymptoms, references)
    responseText = fallback.responseText
    riskLevel = fallback.riskLevel
    recommendation = fallback.recommendation
    criticalAlert = fallback.criticalAlert
    matchedSymptomIds = fallback.matchedSymptomIds
  }

  // 8. Registrar síntomas identificados en sintoma_registrado
  for (const symptomId of matchedSymptomIds) {
    try {
      const dup = await query(
        'SELECT id FROM sintoma_registrado WHERE consulta_id = $1 AND sintoma_id = $2',
        [consultaId, symptomId]
      )
      if (dup.rows.length === 0) {
        await query(
          `INSERT INTO sintoma_registrado (consulta_id, sintoma_id, descripcion_libre, frecuencia, gravedad)
           VALUES ($1, $2, $3, 'No especificada', 'No especificada')`,
          [consultaId, symptomId, userMessage]
        )
      }
    } catch (symptomErr) {
      console.error(`[chatbotService] Error al registrar síntoma ID ${symptomId} en la BD:`, symptomErr)
    }
  }

  // 9. Guardar mensaje del bot en mensaje_chat
  const botOrder = userOrder + 1
  await query(
    `INSERT INTO mensaje_chat (consulta_id, rol, contenido, orden, fecha_hora)
     VALUES ($1, 'bot', $2, $3, NOW())`,
    [consultaId, responseText, botOrder]
  )

  // 10. Actualizar el estado de la consulta con el nivel de riesgo y la recomendación
  await query(
    `UPDATE consulta
     SET nivel_riesgo = $1, recomendacion = $2, alerta_critica = $3, estado = 'activa'
     WHERE id = $4`,
    [riskLevel, recommendation, criticalAlert, consultaId]
  )

  return {
    text: responseText,
    references,
    riskLevel,
    recommendation,
    criticalAlert
  }
}

/**
 * Motor heurístico de fallback local en caso de que Gemini falle o no esté configurado.
 */
function runFallbackEngine(userMessage, activeSymptoms, references) {
  const normalizedUserMessage = normalizeText(userMessage)
  const matchedSymptomNames = []
  const matchedSymptomIds = []
  let isCritical = false

  for (const symptom of activeSymptoms) {
    const normalizedName = normalizeText(symptom.nombre)
    if (normalizedUserMessage.includes(normalizedName)) {
      matchedSymptomNames.push(symptom.nombre)
      matchedSymptomIds.push(Number(symptom.id))
      if (symptom.es_critico) {
        isCritical = true
      }
    }
  }

  let riskLevel = 'Bajo'
  let recommendation = 'Reposo y autocuidado en casa. Si empeoras o los síntomas persisten, consulta a tu médico.'
  let responseText = ''

  if (matchedSymptomIds.length > 0) {
    const symptomList = matchedSymptomNames.join(', ')
    responseText = `He identificado que mencionas los siguientes síntomas: **${symptomList}**.\n\n`
    
    if (isCritical) {
      riskLevel = 'Alto'
      recommendation = 'Acude a Urgencias de inmediato o llama al servicio de emergencias médicas.'
      responseText += `🚨 **¡Atención!** Uno o más de los síntomas detectados es de nivel crítico. Te recomendamos buscar atención médica de Urgencias de forma inmediata. No te automediques.\n\n`
    } else {
      riskLevel = 'Medio'
      recommendation = 'Agenda una cita médica presencial o virtual con tu médico de cabecera.'
      responseText += `⚠️ Te aconsejamos programar una consulta presencial con un profesional médico para que evalúe estos síntomas adecuadamente.\n\n`
    }

    if (references.length > 0) {
      responseText += `Aquí tienes información útil de MedlinePlus sobre **${references[0].title}**:\n> "${references[0].snippet}"\n`
    }
  } else {
    responseText = `No he podido identificar un síntoma catalogado en mi base de datos local, pero busqué tu consulta en MedlinePlus.\n\n`
    if (references.length > 0) {
      responseText += `Esto es lo que encontré sobre **${references[0].title}**:\n\n> "${references[0].snippet}"\n`
    } else {
      responseText += `No encontré resultados de orientación específicos. Por favor, intenta describir tus molestias con otras palabras (ej: dolor de cabeza, dolor de estómago, fiebre, tos).\n`
    }
  }

  responseText += `\n*Recuerda: Esta información es educativa y no reemplaza el consejo de un profesional de la salud.*`

  return {
    responseText,
    riskLevel,
    recommendation,
    criticalAlert: riskLevel === 'Alto',
    matchedSymptomIds
  }
}
