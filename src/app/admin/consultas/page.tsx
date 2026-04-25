'use client'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

// ── Tipos ───────────────────────────────────────────────────────────────────
type EstadoConsulta = 'pendiente' | 'respondida' | 'cerrada'
type Prioridad = 'baja' | 'normal' | 'alta' | 'urgente'

type Consulta = {
  id: string
  parent_id: string
  hijo_id: string | null
  asunto: string | null
  estado: EstadoConsulta
  prioridad: Prioridad
  no_leido_admin: boolean
  ultimo_mensaje: string | null
  ultimo_mensaje_at: string | null
  created_at: string
  // Joined
  parent_nombre?: string
  parent_email?: string
  parent_avatar?: string
}

type Mensaje = {
  id: string
  consulta_id: string
  autor_id: string
  rol: 'padre' | 'admin'
  contenido: string
  plantilla_id: string | null
  created_at: string
}

type Plantilla = {
  id: string
  titulo: string
  categoria: string | null
  contenido: string
  tags: string[]
  veces_usada: number
  activa: boolean
}

const FILTROS: { id: EstadoConsulta | 'todas'; label: string; emoji: string }[] = [
  { id: 'pendiente',  label: 'Pendientes',  emoji: '🟡' },
  { id: 'respondida', label: 'Respondidas', emoji: '🟢' },
  { id: 'cerrada',    label: 'Cerradas',    emoji: '⚪' },
  { id: 'todas',      label: 'Todas',       emoji: '📋' },
]

function formatHora(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const ahora = new Date()
  const diff = (ahora.getTime() - d.getTime()) / 1000 // segundos
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `${Math.floor(diff/60)} min`
  if (diff < 86400) return `${Math.floor(diff/3600)} h`
  if (d.toDateString() === new Date(ahora.getTime() - 86400000).toDateString()) return 'ayer'
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

// ── Página principal ───────────────────────────────────────────────────────
export default function AdminConsultasPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<EstadoConsulta | 'todas'>('pendiente')
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [seleccionada, setSeleccionada] = useState<Consulta | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [respuesta, setRespuesta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [showPlantillas, setShowPlantillas] = useState(false)
  const [editandoPlantilla, setEditandoPlantilla] = useState<Plantilla | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))
  }, [])

  // ── Carga consultas + datos del padre ────────────────────────────────────
  const cargarConsultas = useCallback(async () => {
    setCargando(true)
    setError(null)
    let query = supabase
      .from('consultas')
      .select('id, parent_id, hijo_id, asunto, estado, prioridad, no_leido_admin, ultimo_mensaje, ultimo_mensaje_at, created_at')
      .order('ultimo_mensaje_at', { ascending: false })
      .limit(200)
    if (filtro !== 'todas') query = query.eq('estado', filtro)
    const { data: cons, error: e1 } = await query
    if (e1) { setError(e1.message); setCargando(false); return }
    if (!cons || cons.length === 0) { setConsultas([]); setCargando(false); return }
    // Traer profiles de los padres en una sola query
    const ids = Array.from(new Set(cons.map(c => c.parent_id)))
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, nombre_completo, email, avatar_url')
      .in('id', ids)
    const profMap = new Map((profs || []).map(p => [p.id, p]))
    const enriquecidas: Consulta[] = cons.map(c => {
      const p = profMap.get(c.parent_id)
      return {
        ...c,
        parent_nombre: p?.nombre_completo || p?.email || 'Familia',
        parent_email:  p?.email,
        parent_avatar: p?.avatar_url || '',
      }
    })
    setConsultas(enriquecidas)
    setCargando(false)
  }, [filtro])

  useEffect(() => { cargarConsultas() }, [cargarConsultas])

  // Realtime: nuevas consultas y mensajes
  useEffect(() => {
    const ch = supabase
      .channel('admin-consultas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultas' },
        () => cargarConsultas())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consulta_mensajes' },
        (payload) => {
          const m = payload.new as Mensaje
          if (seleccionada && m.consulta_id === seleccionada.id) {
            setMensajes(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m])
          }
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [cargarConsultas, seleccionada])

  // ── Cargar plantillas ────────────────────────────────────────────────────
  const cargarPlantillas = useCallback(async () => {
    const { data } = await supabase
      .from('respuestas_plantilla')
      .select('*')
      .order('veces_usada', { ascending: false })
      .order('titulo')
    setPlantillas((data || []) as Plantilla[])
  }, [])
  useEffect(() => { cargarPlantillas() }, [cargarPlantillas])

  // ── Abrir consulta ───────────────────────────────────────────────────────
  async function abrirConsulta(c: Consulta) {
    setSeleccionada(c)
    setError(null)
    setRespuesta('')
    const { data, error } = await supabase
      .from('consulta_mensajes')
      .select('*')
      .eq('consulta_id', c.id)
      .order('created_at', { ascending: true })
    if (error) { setError(error.message); return }
    setMensajes((data || []) as Mensaje[])
    if (c.no_leido_admin) {
      await supabase.from('consultas').update({ no_leido_admin: false }).eq('id', c.id)
      setConsultas(prev => prev.map(x => x.id === c.id ? { ...x, no_leido_admin: false } : x))
    }
  }

  // Auto-scroll al hilo
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [mensajes])

  // ── Enviar respuesta ─────────────────────────────────────────────────────
  async function enviarRespuesta(textoArg?: string, plantillaId?: string) {
    const texto = (textoArg ?? respuesta).trim()
    if (!userId || !seleccionada || !texto || enviando) return
    setEnviando(true)
    setError(null)
    const optimista: Mensaje = {
      id: 'opt-' + Date.now(),
      consulta_id: seleccionada.id,
      autor_id: userId,
      rol: 'admin',
      contenido: texto,
      plantilla_id: plantillaId || null,
      created_at: new Date().toISOString(),
    }
    setMensajes(m => [...m, optimista])
    setRespuesta('')
    const { error } = await supabase
      .from('consulta_mensajes')
      .insert({
        consulta_id: seleccionada.id,
        autor_id: userId,
        rol: 'admin',
        contenido: texto,
        plantilla_id: plantillaId || null,
      })
    setEnviando(false)
    if (error) {
      setMensajes(m => m.filter(x => x.id !== optimista.id))
      setError(error.message)
      return
    }
    if (plantillaId) {
      // Incrementar contador de uso
      const p = plantillas.find(pp => pp.id === plantillaId)
      if (p) {
        await supabase.from('respuestas_plantilla').update({ veces_usada: p.veces_usada + 1 }).eq('id', plantillaId)
      }
    }
  }

  // ── Cambiar estado / prioridad ───────────────────────────────────────────
  async function cambiarEstado(c: Consulta, nuevo: EstadoConsulta) {
    const { error } = await supabase.from('consultas').update({ estado: nuevo }).eq('id', c.id)
    if (error) { setError(error.message); return }
    setConsultas(prev => prev.map(x => x.id === c.id ? { ...x, estado: nuevo } : x))
    if (seleccionada?.id === c.id) setSeleccionada({ ...c, estado: nuevo })
  }
  async function cambiarPrioridad(c: Consulta, p: Prioridad) {
    const { error } = await supabase.from('consultas').update({ prioridad: p }).eq('id', c.id)
    if (error) { setError(error.message); return }
    setConsultas(prev => prev.map(x => x.id === c.id ? { ...x, prioridad: p } : x))
    if (seleccionada?.id === c.id) setSeleccionada({ ...c, prioridad: p })
  }

  // ── Filtrado por búsqueda ────────────────────────────────────────────────
  const consultasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return consultas
    return consultas.filter(c =>
      (c.asunto || '').toLowerCase().includes(q) ||
      (c.ultimo_mensaje || '').toLowerCase().includes(q) ||
      (c.parent_nombre || '').toLowerCase().includes(q) ||
      (c.parent_email || '').toLowerCase().includes(q)
    )
  }, [consultas, busqueda])

  const conteoNoLeidos = useMemo(
    () => consultas.filter(c => c.no_leido_admin).length,
    [consultas]
  )

  // Conteos globales por estado (para los filtros) — independientes del filtro actual
  const [counts, setCounts] = useState<{ pendiente: number; respondida: number; cerrada: number; todas: number }>({ pendiente: 0, respondida: 0, cerrada: 0, todas: 0 })
  useEffect(() => {
    async function loadCounts() {
      const [p, r, c, t] = await Promise.all([
        supabase.from('consultas').select('id', { count: 'exact', head: true }).eq('estado','pendiente'),
        supabase.from('consultas').select('id', { count: 'exact', head: true }).eq('estado','respondida'),
        supabase.from('consultas').select('id', { count: 'exact', head: true }).eq('estado','cerrada'),
        supabase.from('consultas').select('id', { count: 'exact', head: true }),
      ])
      setCounts({
        pendiente:  p.count || 0,
        respondida: r.count || 0,
        cerrada:    c.count || 0,
        todas:      t.count || 0,
      })
    }
    loadCounts()
  }, [consultas])

  return (
    <div>
      {/* Hero header v2 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-500 p-5 sm:p-6 mb-4 sm:mb-5 shadow-lg">
        <div className="absolute -top-10 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-8 w-44 h-44 bg-white/5 rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-white/80 text-xs font-bold tracking-wider uppercase">Bandeja de consultas</p>
            <h1 className="text-white text-2xl sm:text-3xl font-black mt-1">💬 Consultas de los padres</h1>
            <p className="text-white/85 text-sm sm:text-base mt-1.5 max-w-xl">
              {conteoNoLeidos > 0
                ? <>Tienes <b>{conteoNoLeidos}</b> mensaje{conteoNoLeidos === 1 ? '' : 's'} sin leer.</>
                : 'Estás al día. Buen trabajo. ✨'}
            </p>
          </div>
          <button
            onClick={() => setShowPlantillas(true)}
            className="bg-white text-purple-700 hover:scale-[1.02] transition-transform font-black text-sm px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 shrink-0"
          >
            ⚡ Plantillas
          </button>
        </div>

        {/* Mini stats inline */}
        <div className="relative grid grid-cols-3 gap-2 sm:gap-3 mt-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Pendientes</p>
            <p className="text-white text-xl sm:text-2xl font-black leading-tight">{counts.pendiente}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Respondidas</p>
            <p className="text-white text-xl sm:text-2xl font-black leading-tight">{counts.respondida}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Cerradas</p>
            <p className="text-white text-xl sm:text-2xl font-black leading-tight">{counts.cerrada}</p>
          </div>
        </div>
      </div>

      {/* Panel principal */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">

      <div className="grid lg:grid-cols-[340px_1fr] min-h-[600px]">
        {/* ── Bandeja izquierda ───────────────────────────────────────────── */}
        <aside className="border-r border-gray-200 bg-gray-50 flex flex-col">
          {/* Filtros */}
          <div className="p-3 border-b border-gray-200 flex flex-wrap gap-1.5 bg-white">
            {FILTROS.map(f => {
              const n = counts[f.id]
              return (
                <button key={f.id} onClick={() => { setFiltro(f.id); setSeleccionada(null) }}
                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-full transition flex items-center gap-1.5
                    ${filtro === f.id
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <span>{f.emoji}</span>
                  <span>{f.label}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0 rounded-full ${filtro === f.id ? 'bg-white/25 text-white' : 'bg-white text-gray-500'}`}>
                    {n}
                  </span>
                </button>
              )
            })}
          </div>
          {/* Búsqueda */}
          <div className="p-2 border-b border-gray-200 bg-white">
            <input
              type="text"
              placeholder="🔍 Buscar por padre, asunto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
            />
          </div>
          {/* Lista */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: '60vh' }}>
            {cargando && <p className="p-4 text-center text-gray-400 text-xs">Cargando…</p>}
            {!cargando && consultasFiltradas.length === 0 && (
              <div className="p-6 text-center">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-gray-500 text-sm font-semibold">Sin consultas {filtro !== 'todas' ? `(${filtro})` : ''}</p>
              </div>
            )}
            {consultasFiltradas.map(c => {
              const activa = seleccionada?.id === c.id
              return (
                <button key={c.id} onClick={() => abrirConsulta(c)}
                  className={`w-full text-left px-3 py-3 border-b border-gray-100 transition
                    ${activa ? 'bg-brand-50 border-l-4 border-l-brand-500' : 'hover:bg-white'}`}>
                  <div className="flex items-start gap-2">
                    <div className="w-9 h-9 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 font-black text-sm flex-shrink-0 overflow-hidden">
                      {c.parent_avatar && (c.parent_avatar.startsWith('http') || c.parent_avatar.startsWith('data:'))
                        ? <img src={c.parent_avatar} alt="" className="w-full h-full object-cover" />
                        : (c.parent_nombre?.charAt(0).toUpperCase() || '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-xs font-black truncate ${c.no_leido_admin ? 'text-brand-700' : 'text-gray-700'}`}>
                          {c.parent_nombre}
                        </p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{formatHora(c.ultimo_mensaje_at)}</span>
                      </div>
                      <p className={`text-xs truncate ${c.no_leido_admin ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
                        {c.asunto || c.ultimo_mensaje || '(sin asunto)'}
                      </p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full
                          ${c.estado === 'respondida' ? 'bg-green-100 text-green-700' :
                            c.estado === 'cerrada' ? 'bg-gray-100 text-gray-500' :
                            'bg-yellow-100 text-yellow-700'}`}>
                          {c.estado}
                        </span>
                        {c.prioridad !== 'normal' && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full
                            ${c.prioridad === 'urgente' ? 'bg-red-100 text-red-700' :
                              c.prioridad === 'alta' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-600'}`}>
                            {c.prioridad}
                          </span>
                        )}
                        {c.no_leido_admin && (
                          <span className="w-2 h-2 bg-red-500 rounded-full ml-auto" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* ── Hilo derecho ─────────────────────────────────────────────────── */}
        <section className="flex flex-col bg-white">
          {!seleccionada ? (
            <div className="flex-1 flex items-center justify-center p-10 text-center bg-gradient-to-br from-violet-50/40 via-white to-fuchsia-50/30">
              <div className="max-w-sm">
                <div className="text-6xl mb-3">💬</div>
                <p className="font-black text-gray-800 text-lg">Elige una consulta</p>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Las preguntas pendientes aparecen primero. Usa las <b>plantillas</b> para responder en segundos.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Conectado en tiempo real
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Header del hilo */}
              <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 font-black overflow-hidden">
                  {seleccionada.parent_avatar && (seleccionada.parent_avatar.startsWith('http') || seleccionada.parent_avatar.startsWith('data:'))
                    ? <img src={seleccionada.parent_avatar} alt="" className="w-full h-full object-cover" />
                    : (seleccionada.parent_nombre?.charAt(0).toUpperCase() || '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-800 text-sm truncate">{seleccionada.parent_nombre}</p>
                  <p className="text-xs text-gray-500 truncate">{seleccionada.parent_email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={seleccionada.prioridad}
                    onChange={e => cambiarPrioridad(seleccionada, e.target.value as Prioridad)}
                    className="text-[11px] font-bold border border-gray-200 rounded-full px-2 py-1 bg-white"
                    title="Prioridad"
                  >
                    <option value="baja">↓ Baja</option>
                    <option value="normal">– Normal</option>
                    <option value="alta">↑ Alta</option>
                    <option value="urgente">⚡ Urgente</option>
                  </select>
                  {seleccionada.estado !== 'cerrada' ? (
                    <button onClick={() => cambiarEstado(seleccionada, 'cerrada')}
                      className="text-[11px] font-bold bg-gray-200 hover:bg-gray-300 text-gray-700 px-2.5 py-1 rounded-full">
                      Cerrar
                    </button>
                  ) : (
                    <button onClick={() => cambiarEstado(seleccionada, 'pendiente')}
                      className="text-[11px] font-bold bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2.5 py-1 rounded-full">
                      Reabrir
                    </button>
                  )}
                </div>
              </div>

              {/* Asunto */}
              {seleccionada.asunto && (
                <div className="px-4 py-2 bg-brand-50 text-xs text-brand-700">
                  <span className="font-bold">Asunto:</span> {seleccionada.asunto}
                </div>
              )}

              {/* Mensajes */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white" style={{ maxHeight: '50vh' }}>
                {mensajes.map(m => (
                  <div key={m.id} className={`flex ${m.rol === 'admin' ? 'justify-end' : 'justify-start'} gap-2`}>
                    {m.rol === 'padre' && (
                      <div className="w-7 h-7 rounded-full bg-brand-200 text-brand-700 flex items-center justify-center text-[10px] font-black flex-shrink-0 overflow-hidden">
                        {seleccionada.parent_avatar && (seleccionada.parent_avatar.startsWith('http') || seleccionada.parent_avatar.startsWith('data:'))
                          ? <img src={seleccionada.parent_avatar} alt="" className="w-full h-full object-cover" />
                          : (seleccionada.parent_nombre?.charAt(0).toUpperCase() || '?')}
                      </div>
                    )}
                    <div className={`max-w-[75%] flex flex-col ${m.rol === 'admin' ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                        ${m.rol === 'admin'
                          ? 'bg-brand-500 text-white rounded-tr-sm'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                        {m.contenido}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5">{formatHora(m.created_at)} · {m.rol === 'admin' ? 'Tú' : 'Padre'}</span>
                    </div>
                    {m.rol === 'admin' && (
                      <div className="w-7 h-7 rounded-full bg-brand-700 text-white flex items-center justify-center text-xs flex-shrink-0">🦷</div>
                    )}
                  </div>
                ))}
                {mensajes.length === 0 && <p className="text-center text-gray-400 text-xs">Sin mensajes</p>}
              </div>

              {/* Plantillas rápidas (top 5 más usadas) */}
              {plantillas.length > 0 && (
                <div className="border-t border-gray-100 p-2 bg-gray-50 flex gap-1.5 overflow-x-auto">
                  {plantillas.slice(0, 6).map(p => (
                    <button key={p.id} onClick={() => enviarRespuesta(p.contenido, p.id)}
                      disabled={enviando}
                      title={p.contenido}
                      className="text-[11px] bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 disabled:opacity-50">
                      ⚡ {p.titulo}
                    </button>
                  ))}
                </div>
              )}

              {/* Input respuesta */}
              {seleccionada.estado !== 'cerrada' ? (
                <form
                  onSubmit={e => { e.preventDefault(); enviarRespuesta() }}
                  className="p-3 border-t border-gray-200 flex items-end gap-2 bg-white"
                >
                  <textarea
                    value={respuesta}
                    onChange={e => setRespuesta(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarRespuesta() }
                    }}
                    rows={2}
                    placeholder="Responde como Sonrisas… (Enter envía, Shift+Enter salto de línea)"
                    className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 max-h-40"
                    disabled={enviando}
                  />
                  <button type="submit" disabled={enviando || !respuesta.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-brand-500 text-white font-black text-sm disabled:opacity-50 disabled:bg-gray-300">
                    Enviar
                  </button>
                </form>
              ) : (
                <div className="p-4 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
                  Consulta cerrada — reábrela para seguir respondiendo.
                </div>
              )}

              {error && (
                <div className="px-3 py-2 bg-red-50 border-t border-red-200 text-xs text-red-600 text-center">{error}</div>
              )}
            </>
          )}
        </section>
      </div>

      </div>

      {/* Modal de plantillas */}
      {showPlantillas && (
        <ModalPlantillas
          plantillas={plantillas}
          editando={editandoPlantilla}
          setEditando={setEditandoPlantilla}
          userId={userId}
          onClose={() => { setShowPlantillas(false); setEditandoPlantilla(null) }}
          onSaved={() => cargarPlantillas()}
          onUsar={(p) => { setRespuesta(p.contenido); setShowPlantillas(false) }}
        />
      )}
    </div>
  )
}

// ── Modal de plantillas ────────────────────────────────────────────────────
function ModalPlantillas({
  plantillas, editando, setEditando, userId, onClose, onSaved, onUsar,
}: {
  plantillas: Plantilla[]
  editando: Plantilla | null
  setEditando: (p: Plantilla | null) => void
  userId: string | null
  onClose: () => void
  onSaved: () => void
  onUsar: (p: Plantilla) => void
}) {
  const [titulo, setTitulo] = useState(editando?.titulo || '')
  const [categoria, setCategoria] = useState(editando?.categoria || '')
  const [contenido, setContenido] = useState(editando?.contenido || '')
  const [tagsRaw, setTagsRaw] = useState((editando?.tags || []).join(', '))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busc, setBusc] = useState('')

  useEffect(() => {
    setTitulo(editando?.titulo || '')
    setCategoria(editando?.categoria || '')
    setContenido(editando?.contenido || '')
    setTagsRaw((editando?.tags || []).join(', '))
  }, [editando])

  const filtradas = useMemo(() => {
    const q = busc.trim().toLowerCase()
    if (!q) return plantillas
    return plantillas.filter(p =>
      p.titulo.toLowerCase().includes(q) ||
      (p.categoria || '').toLowerCase().includes(q) ||
      p.contenido.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    )
  }, [plantillas, busc])

  async function guardar() {
    if (!titulo.trim() || !contenido.trim() || !userId) return
    setGuardando(true)
    setError(null)
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
    const payload = {
      titulo: titulo.trim(),
      categoria: categoria.trim() || null,
      contenido: contenido.trim(),
      tags,
      activa: true,
      created_by: userId,
      updated_at: new Date().toISOString(),
    }
    let res
    if (editando?.id) {
      res = await supabase.from('respuestas_plantilla').update(payload).eq('id', editando.id)
    } else {
      res = await supabase.from('respuestas_plantilla').insert(payload)
    }
    setGuardando(false)
    if (res.error) { setError(res.error.message); return }
    setEditando(null)
    onSaved()
  }

  async function eliminar(p: Plantilla) {
    if (!confirm(`¿Eliminar la plantilla "${p.titulo}"?`)) return
    const { error } = await supabase.from('respuestas_plantilla').delete().eq('id', p.id)
    if (error) { setError(error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <h2 className="font-black text-gray-800">Plantillas de respuesta</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center">×</button>
        </div>

        {!editando ? (
          <>
            <div className="p-3 border-b border-gray-100 flex gap-2">
              <input
                type="text"
                placeholder="🔍 Buscar plantilla…"
                value={busc}
                onChange={e => setBusc(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
              />
              <button onClick={() => setEditando({
                id: '', titulo: '', categoria: '', contenido: '', tags: [], veces_usada: 0, activa: true
              })}
                className="bg-brand-500 hover:bg-brand-600 text-white font-black text-sm px-4 py-2 rounded-xl">
                + Nueva
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filtradas.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">Sin plantillas</p>
              )}
              {filtradas.map(p => (
                <div key={p.id} className="border border-gray-200 rounded-2xl p-3 hover:border-brand-300 transition">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-gray-800 text-sm">{p.titulo}</p>
                      {p.categoria && (
                        <span className="text-[10px] font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                          {p.categoria}
                        </span>
                      )}
                      {p.veces_usada > 0 && (
                        <span className="text-[10px] text-gray-400">· usada {p.veces_usada}x</span>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => onUsar(p)}
                        className="text-[11px] font-bold bg-brand-500 hover:bg-brand-600 text-white px-2.5 py-1 rounded-full">
                        Usar
                      </button>
                      <button onClick={() => setEditando(p)}
                        className="text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full">
                        Editar
                      </button>
                      <button onClick={() => eliminar(p)}
                        className="text-[11px] font-bold bg-red-100 hover:bg-red-200 text-red-700 px-2.5 py-1 rounded-full">
                        ✕
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 whitespace-pre-wrap">{p.contenido}</p>
                  {p.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {p.tags.map(t => (
                        <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          // Editor de plantilla
          <form onSubmit={e => { e.preventDefault(); guardar() }} className="flex-1 overflow-y-auto p-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Título *</label>
              <input
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Categoría</label>
              <input
                type="text"
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                placeholder="ej. higiene, dudas, urgencias…"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Contenido *</label>
              <textarea
                value={contenido}
                onChange={e => setContenido(e.target.value)}
                rows={6}
                required
                placeholder="Escribe la respuesta predeterminada…"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Tags (separados por coma)</label>
              <input
                type="text"
                value={tagsRaw}
                onChange={e => setTagsRaw(e.target.value)}
                placeholder="cepillado, fluor, primera-visita…"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => setEditando(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm py-2.5 rounded-xl">
                Cancelar
              </button>
              <button type="submit" disabled={guardando || !titulo.trim() || !contenido.trim()}
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-black text-sm py-2.5 rounded-xl disabled:opacity-50">
                {guardando ? 'Guardando…' : (editando?.id ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
