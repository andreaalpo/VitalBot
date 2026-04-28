import { parseStringPromise } from 'xml2js'

const MEDLINE_API_URL = 'https://wsearch.nlm.nih.gov/ws/query?db=healthTopicsSpanish'

export async function searchMedline(query) {
  try {
    const response = await fetch(`${MEDLINE_API_URL}&term=${encodeURIComponent(query)}`)
    if (!response.ok) {
      throw new Error(`Error en la API de MedlinePlus: ${response.status}`)
    }

    const xmlData = await response.text()
    const result = await parseStringPromise(xmlData, { explicitArray: false })

    const searchResult = result.nlmSearchResult

    // Check if there are any documents
    if (!searchResult || !searchResult.list || !searchResult.list.document) {
      return []
    }

    // `document` could be an array or a single object
    let documents = searchResult.list.document
    if (!Array.isArray(documents)) {
      documents = [documents]
    }

    // Extract relevant data
    return documents.map((doc) => {
      // Content could be an array of objects like { $: { name: 'title' }, _: 'Title content' }
      let title = 'Sin título'
      let snippet = ''
      let summary = ''

      const contents = Array.isArray(doc.content) ? doc.content : [doc.content]

      for (const item of contents) {
        if (!item || !item.$) continue
        
        const contentStr = item._ || ''
        // Clean up HTML tags returned by API (e.g. <span class="qt0">)
        const cleanContent = contentStr.replace(/<[^>]+>/g, '')

        if (item.$.name === 'title') {
          title = cleanContent
        } else if (item.$.name === 'snippet') {
          snippet = cleanContent
        } else if (item.$.name === 'FullSummary') {
          summary = cleanContent
        }
      }

      return {
        url: doc.$.url,
        title,
        snippet: snippet || summary,
      }
    })
  } catch (error) {
    console.error('[medlineService] Error fetching data:', error)
    throw new Error('No se pudo obtener información de MedlinePlus')
  }
}
