import { query } from '../config/db.js'
import { searchMedline } from './medlineService.js'

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

export async function processMessage(userMessage) {
  if (!userMessage || userMessage.trim() === '') {
    return {
      text: 'No he recibido ningún mensaje. Por favor, cuéntame qué te sucede.',
      references: []
    }
  }

  const normalizedUserMessage = normalizeText(userMessage)

  // 1. Obtener todos los síntomas activos de la base de datos
  let activeSymptoms = []
  try {
    const { rows } = await query('SELECT nombre FROM sintoma WHERE activo = true')
    activeSymptoms = rows
  } catch (error) {
    console.error('[chatbotService] Error al obtener síntomas:', error)
    // Continuamos aunque falle la BD local, usando la API como respaldo
  }

  // 2. Buscar coincidencias exactas en el texto del usuario
  const matchedSymptoms = []
  for (const symptom of activeSymptoms) {
    const normalizedSymptomName = normalizeText(symptom.nombre)
    // Búsqueda simple de subcadena
    if (normalizedUserMessage.includes(normalizedSymptomName)) {
      matchedSymptoms.push(symptom.nombre)
    }
  }

  let references = []
  let botText = ''

  // 3. Lógica de Respuesta
  if (matchedSymptoms.length > 0) {
    // Si encontramos síntomas en la BD local
    const symptomList = matchedSymptoms.join(', ')
    botText = `He identificado que mencionas: **${symptomList}**. `
    botText += `Aquí tienes información oficial de MedlinePlus que podría serte útil:`

    // Tomamos el primer síntoma identificado para buscar en MedlinePlus
    // (o podríamos hacer múltiples búsquedas, pero por simplicidad de la API tomamos el principal)
    const mainSymptom = matchedSymptoms[0]
    try {
      const results = await searchMedline(mainSymptom)
      references = results.slice(0, 3) // Tomar los 3 primeros resultados
    } catch (error) {
      console.error('[chatbotService] Error en MedlinePlus:', error)
    }

  } else {
    // Si no identificamos un síntoma específico en nuestra BD, buscamos la frase completa
    botText = `No he identificado un síntoma específico en mi base de datos, pero he buscado tu consulta en MedlinePlus. `
    
    try {
      const results = await searchMedline(userMessage)
      
      if (results.length > 0) {
        botText += `Esto es lo que encontré:`
        references = results.slice(0, 3)
      } else {
        // Fallback si tampoco hay en MedlinePlus
        botText = `No he encontrado información sobre lo que mencionas en los "Temas de Salud" principales. `
        botText += `Por favor, intenta darme más detalles o ser más específico (por ejemplo, mencionando un síntoma a la vez, como "dolor de estómago").`
      }
    } catch (error) {
      console.error('[chatbotService] Error en MedlinePlus:', error)
      botText += `Sin embargo, en este momento no puedo conectarme con la base médica. Inténtalo de nuevo más tarde.`
    }
  }

  // Advertencia estándar al final
  botText += `\n\n*Recuerda: Esta información es educativa y no reemplaza el consejo de un profesional de la salud.*`

  return {
    text: botText,
    references,
    matchedSymptoms
  }
}
