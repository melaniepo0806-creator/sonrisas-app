'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Mensaje = { rol: 'user' | 'assistant'; contenido: string; id?: string }

const SUGERENCIAS = [
  '¿Cuándo empezar a usar pasta con flúor?',
  '¿Mi peque puede dormir con el biberón?',
  'Le sangran las encías al cepillarse, ¿qué hago?',
  '¿A qué edad la primera visita al dentista?',
]

export default function ChatSonrisas({ mode = 'floating' }: { mode?: 'floating' | 'card' }) {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [conversacionId, setConversacionId] = useState<string | null>(null)
  const [pregunta, setPregunta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usados, setUsados] = useState<{ usados: number; limite: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [mensajes, enviando])

  async function enviar(texto: string) {
    if (!texto.trim() || enviando) return
    setError(null)
    setEnviando(true)
    setMensajes(m => [...m, { rol: 'user', contenido: texto }])
    setPregunta('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Inicia sesión para usar el chat.')
        setEnviando(false)
        return
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat-ia`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ pregunta: texto, conversacion_id: conversacionId }),
        },
      )

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          setError(`Has llegado al límite de ${data.limite || 30} preguntas hoy. Vuelve mañana 💛`)
        } else {
          setError(data.error === 'gemini_error' ? 'La IA no pudo responder ahora mismo. Intenta de nuevo.' : `Error: ${data.error || res.status}`)
        }
        setEnviando(false)
        return
      }

      setConversacionId(data.conversacion_id)
      setMensajes(m => [...m, { rol: 'assistant', contenido: data.respuesta }])
      setUsados({ usados: data.usados, limite: data.limite })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      setError('Sin conexión: ' + msg)
    } finally {
      setEnviando(false)
    }
  }

  function reiniciar() {
    setMensajes([])
    setConversacionId(null)
    setError(null)
  }

  return (
    <>
      {/* Disparador: card destacada (modo 'card') o botón flotante (modo 'floating') */}
      {!abierto && mode === 'card' && (
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir chat con Sonrisas IA"
          className="w-full bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-3xl p-4 shadow-card flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-3xl flex-shrink-0">
            🦷
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-black text-base leading-tight">Sonrisas IA</p>
              <span className="bg-yellow-400 text-brand-800 text-[9px] font-black px-1.5 py-0.5 rounded-full">NUEVO</span>
            </div>
            <p className="text-white/85 text-xs leading-snug">Pregúntame lo que sea sobre la salud bucal de tu peque ✨</p>
          </div>
          <span className="text-2xl flex-shrink-0">→</span>
        </button>
      )}

      {!abierto && mode === 'floating' && (
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir chat con Sonrisas IA"
          className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg flex items-center justify-center text-2xl active:scale-95 transition-transform border-2 border-white"
        >
          🦷
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-brand-800 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white">IA</span>
        </button>
      )}

      {/* Panel del chat */}
      {abierto && (
        <div className="fixed inset-0 z-50 sm:inset-auto sm:bottom-24 sm:right-4 sm:w-[400px] sm:max-h-[70vh] sm:rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden border border-brand-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-700 text-white p-4 flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-2xl">🦷</div>
            <div className="flex-1 min-w-0">
              <p className="font-black leading-tight">Sonrisas IA</p>
              <p className="text-xs text-white/80">Asistente dental pediátrica</p>
            </div>
            {mensajes.length > 0 && (
              <button onClick={reiniciar} title="Nueva conversación"
                className="text-white/80 hover:text-white text-lg w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">↻</button>
            )}
            <button onClick={() => setAbierto(false)} className="text-white/80 hover:text-white text-2xl w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center leading-none">×</button>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-brand-50 to-white">
            {mensajes.length === 0 && (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">🦷✨</div>
                <p className="font-black text-brand-800 mb-1">¡Hola! Soy Sonrisas</p>
                <p className="text-brand-500 text-sm mb-4">Pregúntame lo que sea sobre la salud bucal de tu peque.</p>
                <div className="space-y-2">
                  {SUGERENCIAS.map((s, i) => (
                    <button key={i} onClick={() => enviar(s)} disabled={enviando}
                      className="block w-full text-left bg-white border border-brand-100 rounded-2xl px-4 py-2.5 text-sm text-brand-700 hover:border-brand-300 hover:bg-brand-50 transition disabled:opacity-50">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                {m.rol === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs flex-shrink-0">🦷</div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                  ${m.rol === 'user'
                    ? 'bg-brand-500 text-white rounded-tr-sm'
                    : 'bg-white border border-brand-100 text-brand-800 rounded-tl-sm shadow-sm'}`}>
                  {m.contenido}
                </div>
              </div>
            ))}

            {enviando && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs">🦷</div>
                <div className="bg-white border border-brand-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-brand-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600 text-center">{error}</div>
            )}
          </div>

          {/* Footer / input */}
          <form
            onSubmit={e => { e.preventDefault(); enviar(pregunta) }}
            className="p-3 border-t border-gray-100 flex items-end gap-2 bg-white flex-shrink-0"
          >
            <textarea
              value={pregunta}
              onChange={e => setPregunta(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(pregunta) }
              }}
              rows={1}
              placeholder="Escribe tu pregunta…"
              className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 max-h-32"
              disabled={enviando}
            />
            <button type="submit" disabled={enviando || !pregunta.trim()}
              className="w-11 h-11 rounded-full bg-brand-500 text-white flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 active:scale-95 transition flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </form>
          {usados && (
            <p className="text-[10px] text-gray-400 text-center pb-2">{usados.usados} / {usados.limite} mensajes hoy</p>
          )}
        </div>
      )}
    </>
  )
}
