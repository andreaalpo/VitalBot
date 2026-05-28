import { useMemo, useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
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

  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  // Nuevos estados para la integración de consultas e historial
  const [consultas, setConsultas] = useState([])
  const [currentConsultaId, setCurrentConsultaId] = useState(null)
  const [currentRiskLevel, setCurrentRiskLevel] = useState('Pendiente')
  
  // Estados para audio (STT y TTS)
  const [isListening, setIsListening] = useState(false)
  const [speakingMessageIdx, setSpeakingMessageIdx] = useState(null)

  const chatBodyRef = useRef(null)
  const recognitionRef = useRef(null)

  // Cargar consultas iniciales y arrancar una nueva consulta al montar la página
  useEffect(() => {
    fetchRecentConsultas()
    startNewConsulta()

    // Configurar reconocimiento de voz (STT)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.lang = 'es-CO'
      rec.interimResults = false

      rec.onstart = () => {
        setIsListening(true)
      }

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputText(prev => prev ? `${prev} ${transcript}` : transcript)
      }

      rec.onerror = (event) => {
        console.error('Error en reconocimiento de voz:', event)
        setIsListening(false)
      }

      rec.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = rec
    }

    return () => {
      // Detener cualquier reproducción de voz al salir de la página
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Auto-scroll al recibir mensajes
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    }
  }, [messages, isTyping])

  function logout() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    sessionStorage.removeItem('vitalbot_token')
    sessionStorage.removeItem('vitalbot_user')
    navigate('/', { replace: true })
  }

  // Obtener listado de consultas previas
  const fetchRecentConsultas = async () => {
    try {
      const data = await api('/chatbot/consultas')
      setConsultas(data.consultas || [])
    } catch (err) {
      console.error('Error al obtener consultas recientes:', err)
    }
  }

  // Iniciar una nueva sesión de consulta
  const startNewConsulta = async () => {
    setIsTyping(true)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setSpeakingMessageIdx(null)
    }
    try {
      const data = await api('/chatbot/consulta', { method: 'POST' })
      setCurrentConsultaId(data.consultaId)
      setMessages([data.welcomeMessage])
      setCurrentRiskLevel('Pendiente')
      fetchRecentConsultas()
    } catch (err) {
      console.error('Error al iniciar nueva consulta:', err)
      // Fallback local en caso de error de conexión
      setMessages([
        {
          role: 'bot',
          text: `**¡Hola, ${displayName}!** Soy VitalBot.\n\nEstoy aquí para orientarte sobre tus síntomas y ayudarte a entender mejor qué podría estar pasando. ¿En qué te puedo ayudar hoy?`,
          references: []
        }
      ])
    } finally {
      setIsTyping(false)
    }
  }

  // Cargar una consulta del historial
  const loadConsulta = async (id) => {
    setIsTyping(true)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setSpeakingMessageIdx(null)
    }
    try {
      const data = await api(`/chatbot/consulta/${id}`)
      setCurrentConsultaId(id)
      setMessages(data.messages || [])
      setCurrentRiskLevel(data.consulta?.nivelRiesgo || 'Pendiente')
    } catch (err) {
      console.error('Error al cargar consulta:', err)
    } finally {
      setIsTyping(false)
    }
  }

  // Dictado por voz (STT)
  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert('El dictado por voz no está soportado en este navegador. Te recomendamos usar Google Chrome o Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  // Lectura en voz alta (TTS)
  const speakText = (text, index) => {
    if ('speechSynthesis' in window) {
      if (speakingMessageIdx === index) {
        window.speechSynthesis.cancel()
        setSpeakingMessageIdx(null)
        return
      }

      window.speechSynthesis.cancel()

      // Limpiar markdown del texto para que el lector no pronuncie asteriscos ni corchetes
      const cleanText = text
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
        .replace(/[*#>`_-]/g, ' ')

      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = 'es-ES'

      // Intentar configurar una voz en español nativo del sistema
      const voices = window.speechSynthesis.getVoices()
      const spanishVoice = voices.find(v => v.lang.startsWith('es-'))
      if (spanishVoice) {
        utterance.voice = spanishVoice
      }

      utterance.onend = () => {
        setSpeakingMessageIdx(null)
      }

      utterance.onerror = () => {
        setSpeakingMessageIdx(null)
      }

      setSpeakingMessageIdx(index)
      window.speechSynthesis.speak(utterance)
    } else {
      alert('La síntesis de voz no está soportada en este navegador.')
    }
  }

  // Enviar mensaje
  const handleSend = async (e) => {
    if (e) e.preventDefault()
    if (!inputText.trim()) return

    const userMsg = inputText.trim()
    setInputText('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setIsTyping(true)

    // Cancelar voz si el usuario responde
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setSpeakingMessageIdx(null)
    }

    try {
      let activeId = currentConsultaId

      // Si por alguna razón no tenemos una sesión de consulta activa, la iniciamos en caliente
      if (!activeId) {
        const initData = await api('/chatbot/consulta', { method: 'POST' })
        activeId = initData.consultaId
        setCurrentConsultaId(activeId)
      }

      const data = await api(`/chatbot/consulta/${activeId}/message`, {
        method: 'POST',
        body: JSON.stringify({ message: userMsg })
      })

      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: data.text,
        references: data.references || []
      }])
      
      setCurrentRiskLevel(data.riskLevel || 'Pendiente')
      fetchRecentConsultas() // Refrescar el historial del sidebar
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

  // Helper to render bold text and links inside elements
  const renderInlineMarkdown = (text) => {
    if (!text) return ''
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

  // Parse lines to create structured block elements (headings, lists, blockquotes, paragraphs)
  const renderMessageContent = (text) => {
    if (!text) return null

    const lines = text.split('\n')
    const elements = []
    let currentList = null

    const flushList = (key) => {
      if (currentList) {
        const ListTag = currentList.type
        elements.push(
          <ListTag key={key} className={ListTag === 'ul' ? styles.parsedUl : styles.parsedOl}>
            {currentList.items.map((item, idx) => (
              <li key={idx} className={styles.parsedLi}>
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ListTag>
        )
        currentList = null
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      const bulletMatch = line.match(/^(\s*)([-*•])\s+(.*)/)
      const numberMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/)

      if (bulletMatch) {
        if (!currentList || currentList.type !== 'ul') {
          flushList(`list-flush-${i}`)
          currentList = { type: 'ul', items: [] }
        }
        currentList.items.push(bulletMatch[3])
      } else if (numberMatch) {
        if (!currentList || currentList.type !== 'ol') {
          flushList(`list-flush-${i}`)
          currentList = { type: 'ol', items: [] }
        }
        currentList.items.push(numberMatch[3])
      } else {
        flushList(`list-flush-${i}`)

        if (trimmed === '') {
          elements.push(<div key={`spacer-${i}`} className={styles.parsedSpacer} />)
        } else if (trimmed.startsWith('### ')) {
          elements.push(
            <h4 key={`h4-${i}`} className={styles.parsedH4}>
              {renderInlineMarkdown(trimmed.slice(4))}
            </h4>
          )
        } else if (trimmed.startsWith('## ')) {
          elements.push(
            <h3 key={`h3-${i}`} className={styles.parsedH3}>
              {renderInlineMarkdown(trimmed.slice(3))}
            </h3>
          )
        } else if (trimmed.startsWith('# ')) {
          elements.push(
            <h2 key={`h2-${i}`} className={styles.parsedH2}>
              {renderInlineMarkdown(trimmed.slice(2))}
            </h2>
          )
        } else if (trimmed.startsWith('> ')) {
          elements.push(
            <blockquote key={`quote-${i}`} className={styles.parsedBlockquote}>
              {renderInlineMarkdown(trimmed.slice(2))}
            </blockquote>
          )
        } else {
          elements.push(
            <p key={`p-${i}`} className={styles.parsedP}>
              {renderInlineMarkdown(line)}
            </p>
          )
        }
      }
    }

    flushList(`list-flush-end`)
    return elements
  }

  // Determinar clases de CSS del nivel de riesgo para el badge superior
  const riskClass = 
    currentRiskLevel === 'Alto' ? styles.riskHigh :
    currentRiskLevel === 'Medio' ? styles.riskMedium :
    currentRiskLevel === 'Bajo' ? styles.riskLow : styles.riskIndetermined

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

        <button type="button" className={styles.newConsult} onClick={startNewConsulta}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nueva Consulta
        </button>

        <section className={styles.recent}>
          <h3 className={styles.sideHeading}>Consultas Recientes</h3>
          <ul className={styles.recentList}>
            {consultas.length === 0 ? (
              <li className={styles.noConsults}>No hay consultas previas</li>
            ) : (
              consultas.map((c) => {
                const date = new Date(c.fechaHora).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })
                
                const label = c.recomendacion 
                  ? (c.recomendacion.length > 28 ? c.recomendacion.substring(0, 28) + '...' : c.recomendacion)
                  : `Consulta del ${date}`

                const activeClass = currentConsultaId === Number(c.id) ? styles.activeConsulta : ''

                return (
                  <li 
                    key={c.id} 
                    className={`${styles.recentItem} ${activeClass}`} 
                    onClick={() => loadConsulta(c.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <div className={styles.recentItemContent}>
                      <span className={styles.recentItemTitle}>{label}</span>
                      <span className={styles.recentItemDate}>{date}</span>
                    </div>
                    <span className={`${styles.riskDotMini} ${
                      c.nivelRiesgo === 'Alto' ? styles.lowHighDot : 
                      c.nivelRiesgo === 'Medio' ? styles.lowMediumDot : 
                      c.nivelRiesgo === 'Bajo' ? styles.lowLowDot : styles.lowIndeterminedDot
                    }`} />
                  </li>
                )
              })
            )}
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
          <div className={styles.chatHeaderRight}>
            <div className={`${styles.riskBadge} ${riskClass}`}>
              Riesgo: {currentRiskLevel}
            </div>
            <div className={styles.online}>
              <span className={styles.onlineDot} /> Conectado
            </div>
          </div>
        </header>

        <section className={styles.chatBody} ref={chatBodyRef}>
          <div className={styles.messageList}>
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.role === 'user' ? styles.messageWrapperUser : styles.messageWrapperBot}>
                <article className={msg.role === 'user' ? styles.userBubble : styles.botBubble}>
                  {renderMessageContent(msg.text)}
                  
                  {msg.role === 'bot' && (
                    <button 
                      type="button" 
                      className={`${styles.listen} ${speakingMessageIdx === idx ? styles.speaking : ''}`}
                      onClick={() => speakText(msg.text, idx)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {speakingMessageIdx === idx ? (
                          <rect x="4" y="4" width="16" height="16" rx="2" ry="2" fill="currentColor"></rect>
                        ) : (
                          <>
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                          </>
                        )}
                      </svg>
                      {speakingMessageIdx === idx ? 'Detener' : 'Escuchar'}
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
            
            {/* Botón de reconocimiento de voz (STT) */}
            <button 
              type="button" 
              className={`${styles.micBtn} ${isListening ? styles.listening : ''}`} 
              onClick={toggleListen}
              disabled={isTyping}
              title="Dictar por voz"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill={isListening ? 'currentColor' : 'none'}></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </button>

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
