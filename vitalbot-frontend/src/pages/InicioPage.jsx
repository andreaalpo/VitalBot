import { useMemo, useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './InicioPage.module.css'

export default function InicioPage() {
  const navigate = useNavigate()
  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('vitalbot_user') || 'null')
    } catch {
      return null
    }
  }, [])
  const isAdminUser = user?.role === 'administrador'
  
  const displayName = user?.name || 'Esteban'
  const displayEmail = user?.email || 'prueba@example.com'
  const avatarLetter = displayName.charAt(0).toUpperCase()

  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: `**¡Hola, ${displayName}!** Soy VitalBot.\n\nEstoy aquí para orientarte sobre tus síntomas y ayudarte a entender mejor qué podría estar pasando. ¿En qué te puedo ayudar hoy?`,
      references: []
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatBodyRef = useRef(null)

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    }
  }, [messages, isTyping])

  function logout() {
    sessionStorage.removeItem('vitalbot_token')
    sessionStorage.removeItem('vitalbot_user')
    navigate('/', { replace: true })
  }

  const handleSend = async (e) => {
    if (e) e.preventDefault()
    if (!inputText.trim()) return

    const userMsg = inputText.trim()
    setInputText('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setIsTyping(true)

    try {
      const token = sessionStorage.getItem('vitalbot_token')
      const res = await fetch('http://localhost:3000/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Error de conexión')
      }

      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: data.text,
        references: data.references || []
      }])
    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: 'Lo siento, tuve un problema al procesar tu mensaje. Inténtalo de nuevo más tarde.' 
      }])
    } finally {
      setIsTyping(false)
    }
  }

  // Simple Markdown parser to render bold text and links
  const renderText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const titleMatch = part.match(/\[(.*?)\]/)
        const urlMatch = part.match(/\((.*?)\)/)
        if (titleMatch && urlMatch) {
          return (
            <a 
              key={index} 
              href={urlMatch[1]} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: '500' }}
            >
              {titleMatch[1]}
            </a>
          )
        }
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <section className={styles.brandBlock}>
          <div className={styles.brandRow}>
            <img
              src="/logo-vitalbot.png"
              alt="VitalBot"
              className={styles.logo}
              width={48}
              height={48}
            />
            <div>
              <h2 className={styles.brandTitle}>VitalBot</h2>
              <p className={styles.brandSub}>Orientación en Salud</p>
            </div>
          </div>
        </section>

        <section className={styles.userBlock}>
          <div className={styles.avatar}>{avatarLetter}</div>
          <div>
            <p className={styles.userName}>{displayName}</p>
            <p className={styles.userEmail}>{displayEmail}</p>
          </div>
        </section>

        <button type="button" className={styles.newConsult} onClick={() => window.location.reload()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nueva Consulta
        </button>

        <section className={styles.recent}>
          <h3 className={styles.sideHeading}>Consultas Recientes</h3>
          <ul className={styles.recentList}>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Dolor de cabeza crónico
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Posible gastritis
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Dolor de estómago
            </li>
          </ul>
        </section>

        <section className={styles.library}>
          <Link to="/biblioteca" className={styles.libraryLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            Biblioteca Médica
          </Link>
        </section>

        <section className={styles.risk}>
          <h3 className={styles.sideHeading}>Niveles de Riesgo</h3>
          <ul className={styles.riskList}>
            <li>
              <span className={`${styles.riskDot} ${styles.low}`} /> Bajo — Autocuidado
            </li>
            <li>
              <span className={`${styles.riskDot} ${styles.medium}`} /> Medio — Cita médica
            </li>
            <li>
              <span className={`${styles.riskDot} ${styles.high}`} /> Alto — Urgencias
            </li>
          </ul>
        </section>

        {isAdminUser && (
          <Link to="/admin" className={styles.adminLink}>
            Panel Administrativo →
          </Link>
        )}

        <button type="button" className={styles.logout} onClick={logout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Cerrar Sesión
        </button>

        <p className={styles.disclaimer}>
          ⚕ VitalBot no emite diagnósticos médicos.
        </p>
      </aside>

      <main className={styles.chatArea}>
        <header className={styles.chatHeader}>
          <div>
            <h1 className={styles.chatTitle}>Orientación de Salud</h1>
            <p className={styles.chatSub}>
              Describe tus síntomas de forma detallada
            </p>
          </div>
          <div className={styles.online}>
            <span className={styles.onlineDot} /> Conectado
          </div>
        </header>

        <section className={styles.chatBody} ref={chatBodyRef}>
          <div className={styles.messageList}>
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.role === 'user' ? styles.messageWrapperUser : styles.messageWrapperBot}>
                <article className={msg.role === 'user' ? styles.userBubble : styles.botBubble}>
                  {msg.text.split('\n').map((paragraph, pIdx) => (
                    <p key={pIdx} style={{ minHeight: paragraph ? 'auto' : '1rem' }}>
                      {renderText(paragraph)}
                    </p>
                  ))}
                  
                  {msg.role === 'bot' && idx === 0 && (
                    <button type="button" className={styles.listen}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      </svg>
                      Escuchar
                    </button>
                  )}

                  {msg.references && msg.references.length > 0 && (
                    <div className={styles.referencesContainer}>
                      <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Fuentes de MedlinePlus:</h4>
                      <div className={styles.referencesList}>
                        {msg.references.map((ref, rIdx) => (
                          <a key={rIdx} href={ref.url} target="_blank" rel="noopener noreferrer" className={styles.referenceCard}>
                            <div className={styles.referenceTitle}>{ref.title}</div>
                            <div className={styles.referenceUrl}>{new URL(ref.url).hostname}</div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              </div>
            ))}
            
            {isTyping && (
              <div className={styles.messageWrapperBot}>
                <article className={`${styles.botBubble} ${styles.typingIndicator}`}>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                </article>
              </div>
            )}
          </div>
        </section>

        <footer className={styles.chatFooter}>
          <p className={styles.warning}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Sin emergencias: si sientes riesgo de vida, acude o llama a Urgencias de inmediato.
          </p>
          <form className={styles.inputRow} onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Ej: Tengo fiebre alta desde hace 2 días y dolor muscular..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isTyping}
            />
            <button type="submit" className={styles.sendBtn} disabled={isTyping || !inputText.trim()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '-2px' }}>
                <line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </footer>
      </main>
    </div>
  )
}
