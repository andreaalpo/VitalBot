import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './BibliotecaPage.module.css'

export default function BibliotecaPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setSearched(true)

    try {
      const token = sessionStorage.getItem('vitalbot_token')
      const res = await fetch(`http://localhost:3000/api/medline/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al buscar en la biblioteca')
      }

      setResults(data.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Top Navigation Bar */}
      <div className={styles.topBar}>
        <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
          <span>Un servicio integrado de VitalBot</span>
          <Link to="/inicio" className={styles.topBarLink}>
            ← Volver a Inicio
          </Link>
        </div>
      </div>

      {/* Header with Logo */}
      <header className={styles.headerContainer}>
        <div className={styles.headerInner}>
          <div className={styles.logoArea}>
            <img src="/logo-vitalbot.png" alt="VitalBot Logo" className={styles.logoImg} />
            <div>
              <h1 className={styles.logoText}>VitalBot Library</h1>
              <p className={styles.logoSub}>Información de salud confiable, impulsada por MedlinePlus</p>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className={styles.searchSection}>
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar sobre enfermedades, síntomas o medicamentos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </section>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {error && (
          <div className={styles.errorBox}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {!searched && !loading && !error && (
          <div className={styles.statusMessage}>
            <p>Utiliza el buscador de arriba para encontrar información oficial y actualizada sobre temas de salud.</p>
          </div>
        )}

        {loading && (
          <div className={styles.statusMessage}>
            <p>Consultando la base de datos de la Biblioteca Nacional de Medicina...</p>
          </div>
        )}

        {searched && !loading && results.length === 0 && !error && (
          <div className={styles.statusMessage}>
            <p>No se encontraron resultados para <strong>"{query}"</strong>. Intenta usar otros términos médicos o verifica la ortografía.</p>
          </div>
        )}

        {searched && !loading && results.length > 0 && (
          <>
            <div className={styles.resultsHeader}>
              Mostrando resultados para <strong>"{query}"</strong>
            </div>
            <div className={styles.resultsList}>
              {results.map((item, index) => (
                <article key={index} className={styles.resultItem}>
                  <h2 className={styles.resultTitle}>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.resultTitleLink}
                    >
                      {item.title}
                    </a>
                  </h2>
                  <div className={styles.resultUrl}>{item.url}</div>
                  <p className={styles.resultSnippet}>{item.snippet}</p>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
