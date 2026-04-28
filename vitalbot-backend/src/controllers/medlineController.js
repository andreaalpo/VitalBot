import { searchMedline } from '../services/medlineService.js'

export async function searchHandler(req, res, next) {
  try {
    const query = req.query.q

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'El parámetro de búsqueda (q) es requerido' })
    }

    const results = await searchMedline(query)
    
    res.json({
      query,
      count: results.length,
      data: results
    })
  } catch (error) {
    next(error)
  }
}
