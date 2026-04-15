'use client'
import { useState, useRef } from 'react'
import SonrisasLogo from '@/components/ui/SonrisasLogo'

const preguntas = [
  { emoji: '🦷', texto: '¿Cuándo sale el primer diente?' },
  { emoji: '😣', texto: 'Mi bebé tiene molestias, ¿qué hago?' },
  { emoji: '🪥', texto: '¿Cuánta pasta debo usar?' },
  { emoji: '🏥', texto: '¿Cuándo ir al dentista por primera vez?' },
  { emoji: '🍬', texto: '¿El azúcar daña los dientes de leche?' },
]

const respuestas: Record<string, string> = {
  '¿Cuándo sale el primer diente?':
    'Los primeros dientes de leche suelen aparecer entre los 4 y los 7 meses de edad. Los más comunes en salir primero son los incisivos centrales inferiores. Sin embargo, cada bebé tiene su propio ritmo — puede ser antes o después y es completamente normal.',
  'Mi bebé tiene molestias, ¿qué hago?':
    'La dentición puede causar irritabilidad, babeo y molestias en las encías. Puedes darle un mordedor frío (no helado), masajear suavemente las encías con un dedo limpio, o darle un paño frío y limpio para morder. Consulta al pediatra si hay fiebre alta.',
  '¿Cuánta pasta debo usar?':
    'Para bebés de 0 a 3 años: usa una cantidad del tamaño de un grano de arroz de pasta dental con flúor. Para niños de 3 a 6 años: aumenta a una cantidad del tamaño de un guisante. El flúor es esencial para fortalecer el esmalte pero debe usarse en las cantidades correctas.',
  '¿Cuándo ir al dentista por primera vez?':
    'La primera visita al dentista debería ser cuando aparece el primer diente o antes de cumplir el año, lo que ocurra primero. Las visitas tempranas establecen buenos hábitos y permiten al dentista detectar cualquier problema desde el inicio.',
  '¿El azúcar daña los dientes de leche?':
    'Sí, los dientes de leche son vulnerables a las caries. Los azúcares presentes en jugos, leche con biberón al dormir y snacks dulces pueden provocar caries de biberón. Es importante limpiar los dientes después de cada toma, especialmente la nocturna.',
}

type Msg = { from: 'user' | 'bot'; text: string }

export default function FAQPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  function scrollBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function sendMessage(text: string) {
    if (!text.trim()) return
    setMessages(prev => [...prev, { from: 'user', text }])
    setInput('')
    setTyping(true)
    scrollBottom()
    await new Promise(r => setTimeout(r, 1000))
    const resp = respuestas[text] ||
      `Gracias por tu pregunta sobre "${text}". Te recomiendo consultar con tu dentista pediátrico para obtener la mejor orientación personalizada para tu bebé. ¿Tienes alguna otra pregunta dental?`
    setMessages(prev => [...prev, { from: 'bot', text: resp }])
    setTyping(false)
    scrollBottom()
  }

  return (
    <div className="relative flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="px-5 pt-12 pb-3 border-b border-brand-100 bg-app-gradient sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <SonrisasLogo size={40} />
          <div>
            <p className="text-brand-800 font-black">Risitas</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full"/>
              <span className="text-green-600 text-xs font-semibold">En línea siempre</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 px-4 py-4 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-center text-brand-400 text-xs font-semibold mb-4">
              ¿En qué puedo ayudarte hoy?
            </p>
            {preguntas.map((p, i) => (
              <button
                key={i}
                onClick={() => sendMessage(p.texto)}
                className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5
                           shadow-sm border border-brand-100 text-left hover:bg-brand-50
                           active:scale-95 transition-all"
              >
                <span className="text-xl">{p.emoji}</span>
                <span className="text-brand-700 font-semibold text-sm">{p.texto}</span>
              </button>
            ))}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.from === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <SonrisasLogo size={24} />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${msg.from === 'user'
                ? 'bg-brand-500 text-white rounded-br-sm'
                : 'bg-white text-brand-700 shadow-sm rounded-bl-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center mr-2 flex-shrink-0">
              <SonrisasLogo size={24} />
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-brand-300 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                <span className="w-2 h-2 bg-brand-300 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                <span className="w-2 h-2 bg-brand-300 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 pb-2 bg-app-gradient">
        <form onSubmit={e => { e.preventDefault(); sendMessage(input) }}
          className="flex gap-2 items-center bg-white rounded-2xl shadow-card px-3 py-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="flex-1 outline-none text-brand-700 text-sm placeholder-brand-300"
          />
          <button type="submit"
            className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 19V5M5 12l7-7 7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
