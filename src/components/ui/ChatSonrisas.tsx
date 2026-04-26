'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type Mensaje = {
  id: string
  consulta_id: string
  rol: 'padre' | 'admin'
  contenido: string
  created_at: string
}

type Consulta = {
  id: string
  asunto: string | null
  estado: 'pendiente' | 'respondida' | 'cerrada'
  no_leido_padre: boolean
  ultimo_mensaje: string | null
  ultimo_mensaje_at: string | null
  created_at: string
}

const SUGERENCIAS = [
  '¿Cuándo empezar a usar pasta con flúor?',
  '¿Mi peque puede dormir con el biberón?',
  'Le sangran las encías al cepillarse, ¿qué hago?',
  '¿A qué edad la primera visita al dentista?',
]

function formatHora(iso: string): string {
  const d = new Date(iso)
  const hoy = new Date()
  const esHoy = d.toDateString() === hoy.toDateString()
  if (esHoy) return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export default function ChatSonrisas({ mode = 'floating' }: { mode?: 'floating' | 'card' | 'page' }) {
  const [abierto, setAbierto] = useState(mode === 'page')
  const [vista, setVista] = useState<'lista' | 'hilo' | 'nueva'>('lista')
  const [userId, setUserId] = useState<string | null>(null)
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [consultaActiva, setConsultaActiva] = useState<Consulta | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [textoNuevo, setTextoNuevo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [tieneNoLeido, setTieneNoLeido] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))
  }, [])

  const cargarConsultas = useCallback(async () => {
    if (!userId) return
    setCargando(true)
    const { data, error } = await supabase
      .from('consultas')
      .select('id, asunto, estado, no_leido_padre, ultimo_mensaje, ultimo_mensaje_at, created_at')
      .eq('parent_id', userId)
      .order('ultimo_mensaje_at', { ascending: false })
      .limit(30)
    setCargando(false)
    if (error) { setError(error.message); return }
    setConsultas(data || [])
    setTieneNoLeido((data || []).some(c => c.no_leido_padre))
  }, [userId])

  useEffect(() => { cargarConsultas() }, [cargarConsultas])

  useEffect(() => {
    if (!userId) return
    const ch = supabase
      .channel(`consultas-padre-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'consultas', filter: `parent_id=eq.${userId}` },
        () => { cargarConsultas() })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'consulta_mensajes' },
        (payload) => {
          const m = payload.new as Mensaje
          if (consultaActiva && m.consulta_id === consultaActiva.id) {
            setMensajes(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m])
          }
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [userId, consultaActiva, cargarConsultas])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [mensajes, enviando])

  async function abrirConsulta(c: Consulta) {
    setConsultaActiva(c)
    setVista('hilo')
    setError(null)
    setCargando(true)
    const { data, error } = await supabase
      .from('consulta_mensajes')
      .select('id, consulta_id, rol, contenido, created_at')
      .eq('consulta_id', c.id)
      .order('created_at', { ascending: true })
    setCargando(false)
    if (error) { setError(error.message); return }
    setMensajes((data || []) as Mensaje[])
    if (c.no_leido_padre) {
      await supabase.from('consultas').update({ no_leido_padre: false }).eq('id', c.id)
      setConsultas(prev => prev.map(x => x.id === c.id ? { ...x, no_leido_padre: false } : x))
      setTieneNoLeido(false)
    }
  }

  async function crearConsulta(texto: string) {
    if (!userId || !texto.trim() || enviando) return
    setError(null)
    setEnviando(true)
    try {
      const asunto = texto.trim().slice(0, 80)
      const { data: c, error: e1 } = await supabase
        .from('consultas')
        .insert({ parent_id: userId, asunto })
        .select('id, asunto, estado, no_leido_padre, ultimo_mensaje, ultimo_mensaje_at, created_at')
        .single()
      if (e1 || !c) throw e1 || new Error('No se pudo crear la consulta')
      const { error: e2 } = await supabase
        .from('consulta_mensajes')
        .insert({ consulta_id: c.id, autor_id: userId, rol: 'padre', contenido: texto.trim() })
      if (e2) throw e2
      setTextoNuevo('')
      await cargarConsultas()
      await abrirConsulta(c as Consulta)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear consulta')
    } finally {
      setEnviando(false)
    }
  }

  async function enviarMensaje(texto: string) {
    if (!userId || !consultaActiva || !texto.trim() || enviando) return
    setError(null)
    setEnviando(true)
    const optimista: Mensaje = {
      id: 'opt-' + Date.now(),
      consulta_id: consultaActiva.id,
      rol: 'padre',
      contenido: texto.trim(),
      created_at: new Date().toISOString(),
    }
    setMensajes(m => [...m, optimista])
    setTextoNuevo('')
    const { error } = await supabase
      .from('consulta_mensajes')
      .insert({ consulta_id: consultaActiva.id, autor_id: userId, rol: 'padre', contenido: texto.trim() })
    setEnviando(false)
    if (error) {
      setMensajes(m => m.filter(x => x.id !== optimista.id))
      setError(error.message)
    }
  }

  function volverALista() {
    setVista('lista')
    setConsultaActiva(null)
    setMensajes([])
    cargarConsultas()
  }

  return <ChatRender
    abierto={abierto} setAbierto={setAbierto} mode={mode}
    vista={vista} setVista={setVista}
    consultas={consultas} consultaActiva={consultaActiva}
    mensajes={mensajes} textoNuevo={textoNuevo} setTextoNuevo={setTextoNuevo}
    enviando={enviando} error={error} cargando={cargando}
    tieneNoLeido={tieneNoLeido}
    scrollRef={scrollRef}
    abrirConsulta={abrirConsulta} crearConsulta={crearConsulta}
    enviarMensaje={enviarMensaje} volverALista={volverALista}
  />
}

type RenderProps = {
  abierto: boolean
  setAbierto: (b: boolean) => void
  mode: 'floating' | 'card' | 'page'
  vista: 'lista' | 'hilo' | 'nueva'
  setVista: (v: 'lista' | 'hilo' | 'nueva') => void
  consultas: Consulta[]
  consultaActiva: Consulta | null
  mensajes: Mensaje[]
  textoNuevo: string
  setTextoNuevo: (s: string) => void
  enviando: boolean
  error: string | null
  cargando: boolean
  tieneNoLeido: boolean
  scrollRef: React.RefObject<HTMLDivElement>
  abrirConsulta: (c: Consulta) => void
  crearConsulta: (t: string) => void
  enviarMensaje: (t: string) => void
  volverALista: () => void
}

function ChatRender(p: RenderProps) {
  const { abierto, setAbierto, mode, vista, setVista, consultas, consultaActiva, mensajes,
    textoNuevo, setTextoNuevo, enviando, error, cargando, tieneNoLeido, scrollRef,
    abrirConsulta, crearConsulta, enviarMensaje, volverALista } = p

  if (!abierto) {
    if (mode === 'card') {
      return (
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir consultas con el equipo Sonrisas"
          className="w-full bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-3xl p-4 shadow-card flex items-center gap-4 active:scale-[0.98] transition-transform text-left relative"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-3xl flex-shrink-0">💬</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-black text-base leading-tight">Consulta a Sonrisas</p>
              {tieneNoLeido && <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">RESPUESTA</span>}
            </div>
            <p className="text-white/85 text-xs leading-snug">Pregúntanos lo que sea sobre la salud bucal de tu peque ✨</p>
          </div>
          <span className="text-2xl flex-shrink-0">→</span>
        </button>
      )
    }
    return (
      <button
        onClick={() => setAbierto(true)}
        aria-label="Abrir consultas con el equipo Sonrisas"
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg flex items-center justify-center text-2xl active:scale-95 transition-transform border-2 border-white"
      >
        💬
        {tieneNoLeido && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />}
      </button>
    )
  }

  const isPage = mode === 'page'

  return (
    <div className={isPage
      ? 'flex flex-col flex-1 min-h-0 bg-white overflow-hidden'
      : 'fixed inset-0 z-50 sm:inset-auto sm:bottom-24 sm:right-4 sm:w-[400px] sm:max-h-[70vh] sm:rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden border border-brand-100'}>
      <div className="bg-gradient-to-r from-brand-500 to-brand-700 text-white p-4 flex items-center gap-3 flex-shrink-0">
        {vista === 'hilo' && (
          <button onClick={volverALista}
            className="text-white/80 hover:text-white text-xl w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">←</button>
        )}
        <div className="w-10 h-10 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-2xl">💬</div>
        <div className="flex-1 min-w-0">
          <p className="font-black leading-tight truncate">
            {vista === 'hilo' && consultaActiva ? (consultaActiva.asunto || 'Consulta') : 'Equipo Sonrisas'}
          </p>
          <p className="text-xs text-white/80">
            {vista === 'hilo' && consultaActiva
              ? (consultaActiva.estado === 'respondida' ? 'Respondida' : consultaActiva.estado === 'cerrada' ? 'Cerrada' : 'En espera de respuesta')
              : 'Te contestamos lo antes posible'}
          </p>
        </div>
        {vista === 'lista' && (
          <button onClick={() => setVista('nueva')}
            className="bg-white/20 hover:bg-white/30 text-white text-xs font-black px-3 py-1.5 rounded-full">+ Nueva</button>
        )}
        {!isPage && (
          <button onClick={() => setAbierto(false)}
            className="text-white/80 hover:text-white text-2xl w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center leading-none">×</button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-brand-50 to-white">
        {vista === 'lista' && <VistaLista consultas={consultas} cargando={cargando} abrirConsulta={abrirConsulta} setVista={setVista} />}
        {vista === 'nueva' && <VistaNueva enviando={enviando} setTextoNuevo={setTextoNuevo} />}
        {vista === 'hilo' && <VistaHilo cargando={cargando} mensajes={mensajes} consultaActiva={consultaActiva} />}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600 text-center mt-3">{error}</div>
        )}
      </div>

      {(vista === 'hilo' || vista === 'nueva') && (
        <form
          onSubmit={e => {
            e.preventDefault()
            if (vista === 'nueva') crearConsulta(textoNuevo)
            else enviarMensaje(textoNuevo)
          }}
          className={`${isPage ? 'p-3 pb-20' : 'p-3'} border-t border-gray-100 flex items-end gap-2 bg-white flex-shrink-0`}
        >
          <textarea
            value={textoNuevo}
            onChange={e => setTextoNuevo(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (vista === 'nueva') crearConsulta(textoNuevo)
                else enviarMensaje(textoNuevo)
              }
            }}
            rows={1}
            placeholder={vista === 'nueva' ? 'Escribe tu pregunta…' : 'Escribe un mensaje…'}
            className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 max-h-32"
            disabled={enviando}
          />
          <button type="submit" disabled={enviando || !textoNuevo.trim()}
            className="w-11 h-11 rounded-full bg-brand-500 text-white flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 active:scale-95 transition flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      )}
    </div>
  )
}

function VistaLista({ consultas, cargando, abrirConsulta, setVista }: {
  consultas: Consulta[]; cargando: boolean
  abrirConsulta: (c: Consulta) => void
  setVista: (v: 'lista' | 'hilo' | 'nueva') => void
}) {
  if (cargando) return <p className="text-center text-brand-400 text-xs">Cargando…</p>
  if (consultas.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-3">💬✨</div>
        <p className="font-black text-brand-800 mb-1">Aún no tienes consultas</p>
        <p className="text-brand-500 text-sm mb-4">Pregúntanos lo que necesites — el equipo te responde personalmente.</p>
        <button onClick={() => setVista('nueva')}
          className="bg-brand-500 text-white font-black px-5 py-2.5 rounded-2xl text-sm">Hacer una pregunta</button>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {consultas.map(c => (
        <button key={c.id} onClick={() => abrirConsulta(c)}
          className="block w-full text-left bg-white border border-brand-100 rounded-2xl px-4 py-3 hover:border-brand-300 transition relative">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-bold text-brand-800 text-sm truncate flex-1">{c.asunto || 'Consulta'}</p>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0
              ${c.estado === 'respondida' ? 'bg-green-100 text-green-700'
                : c.estado === 'cerrada' ? 'bg-gray-100 text-gray-500'
                : 'bg-yellow-100 text-yellow-700'}`}>
              {c.estado === 'respondida' ? 'Respondida' : c.estado === 'cerrada' ? 'Cerrada' : 'Pendiente'}
            </span>
          </div>
          {c.ultimo_mensaje && <p className="text-brand-500 text-xs line-clamp-2">{c.ultimo_mensaje}</p>}
          <p className="text-brand-300 text-[10px] mt-1">
            {c.ultimo_mensaje_at ? formatHora(c.ultimo_mensaje_at) : ''}
          </p>
          {c.no_leido_padre && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full" />}
        </button>
      ))}
    </div>
  )
}

function VistaNueva({ enviando, setTextoNuevo }: {
  enviando: boolean; setTextoNuevo: (s: string) => void
}) {
  return (
    <div>
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">💬</div>
        <p className="font-black text-brand-800 mb-1">Cuéntanos tu duda</p>
        <p className="text-brand-500 text-xs">El equipo de Sonrisas te responderá pronto.</p>
      </div>
      <p className="text-brand-700 text-xs font-bold mb-2">Sugerencias rápidas</p>
      <div className="space-y-2 mb-4">
        {SUGERENCIAS.map((s, i) => (
          <button key={i} onClick={() => setTextoNuevo(s)} disabled={enviando}
            className="block w-full text-left bg-white border border-brand-100 rounded-2xl px-4 py-2.5 text-sm text-brand-700 hover:border-brand-300 hover:bg-brand-50 transition disabled:opacity-50">
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function VistaHilo({ cargando, mensajes, consultaActiva }: {
  cargando: boolean; mensajes: Mensaje[]; consultaActiva: Consulta | null
}) {
  return (
    <div className="space-y-3">
      {cargando && <p className="text-center text-brand-400 text-xs">Cargando…</p>}
      {mensajes.map(m => (
        <div key={m.id} className={`flex ${m.rol === 'padre' ? 'justify-end' : 'justify-start'} gap-2`}>
          {m.rol === 'admin' && (
            <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs flex-shrink-0">🦷</div>
          )}
          <div className={`max-w-[80%] flex flex-col ${m.rol === 'padre' ? 'items-end' : 'items-start'}`}>
            <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
              ${m.rol === 'padre'
                ? 'bg-brand-500 text-white rounded-tr-sm'
                : 'bg-white border border-brand-100 text-brand-800 rounded-tl-sm shadow-sm'}`}>
              {m.contenido}
            </div>
            <span className="text-[10px] text-brand-300 mt-0.5">{formatHora(m.created_at)}</span>
          </div>
        </div>
      ))}
      {consultaActiva?.estado === 'pendiente' && mensajes.length > 0 && mensajes[mensajes.length - 1].rol === 'padre' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 text-xs text-yellow-700 text-center">
          💛 Recibida — el equipo te responde pronto.
        </div>
      )}
    </div>
  )
}
