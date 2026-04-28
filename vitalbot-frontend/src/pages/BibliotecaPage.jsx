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
      <nav className={styles.topBar}>
        <div className={styles.topBarInner}>
          <Link to="/inicio" className={styles.topBarLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Volver a Inicio
          </Link>
          <div className={styles.integrationBadge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Verificado por MedlinePlus
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <img src="/logo-vitalbot.png" alt="VitalBot Logo" className={styles.logoImg} />
          <h1 className={styles.heroTitle}>Biblioteca Médica</h1>
          <p className={styles.heroSub}>Encuentra información de salud oficial, clara y confiable sobre enfermedades, síntomas y medicamentos.</p>
          
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Ej: Asma, Ibuprofeno, Dolor de cabeza..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className={styles.searchBtn} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {error && (
          <div className={styles.errorBox}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {!searched && !loading && !error && (
          <div className={styles.statusMessage}>
            <div className={styles.statusIcon}>📚</div>
            <p style={{ margin: 0 }}>Escribe un término en el buscador para explorar la base de datos.</p>
          </div>
        )}

        {loading && (
          <div className={styles.statusMessage}>
            <div className={styles.statusIcon}>⏳</div>
            <p style={{ margin: 0 }}>Consultando la Biblioteca Nacional de Medicina...</p>
          </div>
        )}

        {searched && !loading && results.length === 0 && !error && (
          <div className={styles.statusMessage}>
            <div className={styles.statusIcon}>🔍</div>
            <p>No encontramos un <strong>Tema de Salud</strong> exacto para "{query}".</p>
            <p style={{ fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
              Nuestra conexión actual se enfoca en temas principales. Si buscas un medicamento específico o un artículo enciclopédico, búscalo en toda la red de MedlinePlus.
            </p>
            <a 
              href={`https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v:project=medlineplus-spanish&query=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.ctaBtn} ${styles.ctaBtnPrimary}`}
            >
              Buscar en todo MedlinePlus Web
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        )}

        {searched && !loading && results.length > 0 && (
          <>
            <div className={styles.resultsHeader}>
              <span>Resultados para <strong>"{query}"</strong></span>
              <span style={{ fontSize: '0.9rem' }}>{results.length} temas encontrados</span>
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
                  <div className={styles.resultUrl}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    {item.url}
                  </div>
                  <p className={styles.resultSnippet}>{item.snippet}</p>
                </article>
              ))}
            </div>
            
            <div className={styles.ctaBox}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>¿Buscas algo más específico?</h3>
              <p className={styles.ctaText}>Si no encontraste lo que buscabas entre los Temas de Salud, puedes explorar los directorios de Medicamentos o la Enciclopedia completa.</p>
              <a 
                href={`https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v:project=medlineplus-spanish&query=${encodeURIComponent(query)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaBtn}
              >
                Buscar "{query}" en MedlinePlus Oficial
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
