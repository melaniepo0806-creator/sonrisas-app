'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/ui/BottomNav'
import Sparkles from '@/components/ui/Sparkles'
import SonrisasLogo from '@/components/ui/SonrisasLogo'

// ── Tipos ───────────────────────────────────────────────────────────────────
type Tratamiento = {
  id: string
  parent_id: string
  hijo_id: string | null
  nombre: string
  descripcion: string | null
  tipo: 'ortodoncia' | 'cirugia' | 'caries' | 'preventivo' | 'medicacion' | 'otro'
  fecha_inicio: string
  fecha_fin: string | null
  activo: boolean
  color: string | null
  icono: string | null
  proxima_cita: string | null
  created_at: string
}

type Entrada = {
  id: string
  parent_id: string
  hijo_id: string | null
  tratamiento_id: string | null
  fecha: string
  tipo: 'nota' | 'sintoma' | 'cita' | 'medicacion' | 'foto' | 'sentimiento' | 'logro'
  titulo: string | null
  contenido: string
  image_url: string | null
  animo: number | null
  tags: string[] | null
  created_at: string
}

const TIPOS_TRATAMIENTO = [
  { val: 'ortodoncia',  label: 'Ortodoncia',  icono: '😬', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { val: 'cirugia',     label: 'Cirugía',     icono: '🏥', color: 'bg-red-100 text-red-700 border-red-200' },
  { val: 'caries',      label: 'Caries',      icono: '🦷', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { val: 'preventivo',  label: 'Preventivo',  icono: '🛡️', color: 'bg-green-100 text-green-700 border-green-200' },
  { val: 'medicacion',  label: 'Medicación',  icono: '💊', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { val: 'otro',        label: 'Otro',        icono: '📋', color: 'bg-gray-100 text-gray-700 border-gray-200' },
] as const

const TIPOS_ENTRADA = [
  { val: 'nota',        label: 'Nota',         icono: '📝' },
  { val: 'sintoma',     label: 'Síntoma',      icono: '🤒' },
  { val: 'cita',        label: 'Cita',         icono: '📅' },
  { val: 'medicacion',  label: 'Medicación',   icono: '💊' },
  { val: 'foto',        label: 'Foto',         icono: '📸' },
  { val: 'sentimiento', label: 'Cómo me siento', icono: '💭' },
  { val: 'logro',       label: 'Logro',        icono: '🌟' },
] as const

const ANIMO_EMOJIS = ['😢', '😟', '😐', '🙂', '😄'] // 1–5

function fechaHoy(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatearFecha(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1)
  if (date.getTime() === hoy.getTime()) return 'Hoy'
  if (date.getTime() === ayer.getTime()) return 'Ayer'
  return `${d} ${meses[m - 1]} ${y !== hoy.getFullYear() ? y : ''}`.trim()
}

function diasDesde(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  return Math.floor((hoy.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

// ── Componente principal ────────────────────────────────────────────────────
export default function DiarioPage() {
  const router = useRouter()
  const [parentId, setParentId] = useState<string | null>(null)
  const [hijoId, setHijoId] = useState<string | null>(null)
  const [hijoNombre, setHijoNombre] = useState<string>('tu peque')
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([])
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroTratamiento, setFiltroTratamiento] = useState<string | 'todos'>('todos')

  // Modales
  const [showNuevoTratamiento, setShowNuevoTratamiento] = useState(false)
  const [showNuevaEntrada, setShowNuevaEntrada] = useState(false)
  const [editandoEntrada, setEditandoEntrada] = useState<Entrada | null>(null)
  const [editandoTratamiento, setEditandoTratamiento] = useState<Tratamiento | null>(null)

  const cargar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setParentId(user.id)

    // Hijo principal
    const { data: hijos } = await supabase.from('hijos')
      .select('id, nombre').eq('parent_id', user.id).limit(1)
    if (hijos?.[0]) {
      setHijoId(hijos[0].id)
      setHijoNombre(hijos[0].nombre || 'tu peque')
    }

    const [{ data: trats }, { data: ents }] = await Promise.all([
      supabase.from('tratamientos').select('*').eq('parent_id', user.id).order('activo', { ascending: false }).order('fecha_inicio', { ascending: false }),
      supabase.from('diario_entradas').select('*').eq('parent_id', user.id).order('fecha', { ascending: false }).order('created_at', { ascending: false }),
    ])
    setTratamientos((trats as Tratamiento[]) || [])
    setEntradas((ents as Entrada[]) || [])
    setCargando(false)
  }, [router])

  useEffect(() => { cargar() }, [cargar])

  const tratamientosActivos = useMemo(() => tratamientos.filter(t => t.activo), [tratamientos])
  const tratamientosArchivados = useMemo(() => tratamientos.filter(t => !t.activo), [tratamientos])

  const entradasFiltradas = useMemo(() => {
    if (filtroTratamiento === 'todos') return entradas
    return entradas.filter(e => e.tratamiento_id === filtroTratamiento)
  }, [entradas, filtroTratamiento])

  // Agrupar entradas por fecha
  const entradasPorFecha = useMemo(() => {
    const grupos: Record<string, Entrada[]> = {}
    for (const e of entradasFiltradas) {
      if (!grupos[e.fecha]) grupos[e.fecha] = []
      grupos[e.fecha].push(e)
    }
    return Object.entries(grupos).sort((a, b) => b[0].localeCompare(a[0]))
  }, [entradasFiltradas])

  async function eliminarEntrada(id: string) {
    if (!confirm('¿Borrar esta entrada del diario?')) return
    setEntradas(prev => prev.filter(e => e.id !== id))
    await supabase.from('diario_entradas').delete().eq('id', id)
  }

  async function archivarTratamiento(id: string, activo: boolean) {
    const fecha_fin = activo ? null : fechaHoy()
    setTratamientos(prev => prev.map(t => t.id === id ? { ...t, activo, fecha_fin } : t))
    await supabase.from('tratamientos').update({ activo, fecha_fin }).eq('id', id)
  }

  async function eliminarTratamiento(id: string) {
    if (!confirm('¿Borrar este tratamiento? Las entradas asociadas no se eliminarán.')) return
    setTratamientos(prev => prev.filter(t => t.id !== id))
    await supabase.from('tratamientos').delete().eq('id', id)
  }

  return (
    <div className="app-container">
      <Sparkles />
      <div className="page-content pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SonrisasLogo size={36} />
            <div>
              <h1 className="text-2xl font-black text-brand-800 leading-tight">Diario</h1>
              <p className="text-brand-400 text-xs">Acompaña a {hijoNombre}</p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            aria-label="Volver"
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-brand-500"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>

        {/* Banner motivador */}
        <div className="card bg-gradient-to-br from-brand-500 to-brand-700 text-white mb-5 py-4 flex items-center gap-3">
          <div className="text-4xl flex-shrink-0">📖</div>
          <div className="flex-1">
            <p className="font-black text-base leading-tight">Tu diario familiar</p>
            <p className="text-white/80 text-xs leading-snug">Anota síntomas, citas, emociones y avances. Vuelve cuando lo necesites — no estás sola en esto 💛</p>
          </div>
        </div>

        {/* Tratamientos activos */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-brand-800 text-base">Tratamientos activos</h2>
            <button onClick={() => { setEditandoTratamiento(null); setShowNuevoTratamiento(true) }}
              className="text-brand-500 text-xs font-bold bg-brand-50 px-3 py-1.5 rounded-full">
              + Nuevo
            </button>
          </div>

          {tratamientosActivos.length === 0 ? (
            <button onClick={() => { setEditandoTratamiento(null); setShowNuevoTratamiento(true) }}
              className="w-full bg-white border-2 border-dashed border-brand-200 rounded-3xl p-6 text-center active:scale-[0.98] transition-all">
              <p className="text-3xl mb-1">🦷</p>
              <p className="font-black text-brand-700 text-sm">Empieza a registrar un tratamiento</p>
              <p className="text-brand-400 text-xs mt-1">Ortodoncia, recuperación, caries, medicación... lleva el seguimiento aquí</p>
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              {tratamientosActivos.map(t => {
                const tipoInfo = TIPOS_TRATAMIENTO.find(x => x.val === t.tipo) || TIPOS_TRATAMIENTO[5]
                const dias = diasDesde(t.fecha_inicio)
                const numEntradas = entradas.filter(e => e.tratamiento_id === t.id).length
                return (
                  <div key={t.id} className={`rounded-3xl p-4 border ${tipoInfo.color}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                        {t.icono || tipoInfo.icono}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-base leading-tight">{t.nombre}</p>
                        <p className="text-xs opacity-70 mt-0.5">{tipoInfo.label} · día {dias + 1}</p>
                        {t.descripcion && <p className="text-xs opacity-80 mt-1.5 line-clamp-2">{t.descripcion}</p>}
                        {t.proxima_cita && (
                          <div className="mt-2 inline-flex items-center gap-1 bg-white/70 px-2 py-1 rounded-full text-[10px] font-bold">
                            📅 Próxima cita: {formatearFecha(t.proxima_cita)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-current border-opacity-10">
                      <button onClick={() => setFiltroTratamiento(t.id)}
                        className="text-xs font-bold opacity-80 active:opacity-100">
                        {numEntradas} entrada{numEntradas === 1 ? '' : 's'} →
                      </button>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setEditandoTratamiento(t); setShowNuevoTratamiento(true) }}
                          className="text-xs font-bold bg-white/70 px-2.5 py-1 rounded-full active:scale-95">✏️</button>
                        <button onClick={() => archivarTratamiento(t.id, false)}
                          className="text-xs font-bold bg-white/70 px-2.5 py-1 rounded-full active:scale-95">✓ Archivar</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Filtros de tratamiento */}
        {tratamientosActivos.length > 0 && (
          <div className="flex gap-2 mb-4 -mx-5 px-5 pb-1" style={{ overflowX: 'auto', flexWrap: 'nowrap', scrollbarWidth: 'none' }}>
            <button onClick={() => setFiltroTratamiento('todos')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${filtroTratamiento === 'todos' ? 'bg-brand-500 text-white' : 'bg-white text-brand-500 border border-brand-100'}`}>
              Todo el diario
            </button>
            {tratamientosActivos.map(t => (
              <button key={t.id} onClick={() => setFiltroTratamiento(t.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${filtroTratamiento === t.id ? 'bg-brand-500 text-white' : 'bg-white text-brand-500 border border-brand-100'}`}>
                <span>{t.icono || '🦷'}</span> {t.nombre}
              </button>
            ))}
          </div>
        )}

        {/* Timeline de entradas */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-brand-800 text-base">Mis notas</h2>
            <button onClick={() => { setEditandoEntrada(null); setShowNuevaEntrada(true) }}
              className="text-brand-500 text-xs font-bold bg-brand-50 px-3 py-1.5 rounded-full">
              + Nueva entrada
            </button>
          </div>

          {cargando ? (
            <p className="text-center text-brand-400 text-sm py-8">Cargando…</p>
          ) : entradasPorFecha.length === 0 ? (
            <button onClick={() => { setEditandoEntrada(null); setShowNuevaEntrada(true) }}
              className="w-full bg-white border-2 border-dashed border-brand-200 rounded-3xl p-6 text-center active:scale-[0.98] transition-all">
              <p className="text-3xl mb-1">✍️</p>
              <p className="font-black text-brand-700 text-sm">Empieza tu diario</p>
              <p className="text-brand-400 text-xs mt-1">Anota cómo está hoy, qué te preocupa, qué celebráis...</p>
            </button>
          ) : (
            <div className="flex flex-col gap-5">
              {entradasPorFecha.map(([fecha, ents]) => (
                <div key={fecha}>
                  <p className="font-black text-brand-600 text-xs uppercase tracking-wide mb-2">{formatearFecha(fecha)}</p>
                  <div className="flex flex-col gap-2">
                    {ents.map(e => {
                      const tipoInfo = TIPOS_ENTRADA.find(x => x.val === e.tipo) || TIPOS_ENTRADA[0]
                      const trat = e.tratamiento_id ? tratamientos.find(t => t.id === e.tratamiento_id) : null
                      return (
                        <div key={e.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-lg flex-shrink-0">
                              {tipoInfo.icono}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-black text-brand-800 text-sm leading-tight">{e.titulo || tipoInfo.label}</p>
                                <div className="flex gap-1">
                                  <button onClick={() => { setEditandoEntrada(e); setShowNuevaEntrada(true) }}
                                    className="text-[10px] text-brand-400 active:text-brand-600">✏️</button>
                                  <button onClick={() => eliminarEntrada(e.id)}
                                    className="text-[10px] text-gray-300 active:text-red-500">🗑️</button>
                                </div>
                              </div>
                              {trat && (
                                <p className="text-[10px] font-bold text-brand-500 mb-1">{trat.icono || '🦷'} {trat.nombre}</p>
                              )}
                              <p className="text-brand-700 text-sm leading-relaxed whitespace-pre-wrap">{e.contenido}</p>
                              {e.image_url && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={e.image_url} alt="" className="mt-2 w-full max-h-48 object-cover rounded-xl" />
                              )}
                              {typeof e.animo === 'number' && (
                                <p className="mt-2 text-[10px] text-brand-400">Ánimo: <span className="text-base">{ANIMO_EMOJIS[e.animo - 1]}</span></p>
                              )}
                              {e.tags && e.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {e.tags.map((t, i) => (
                                    <span key={i} className="bg-brand-50 text-brand-600 text-[10px] font-bold px-2 py-0.5 rounded-full">#{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tratamientos archivados */}
        {tratamientosArchivados.length > 0 && (
          <section className="mt-8">
            <h2 className="font-black text-brand-600 text-sm mb-3 opacity-70">Archivados</h2>
            <div className="flex flex-col gap-2">
              {tratamientosArchivados.map(t => {
                const tipoInfo = TIPOS_TRATAMIENTO.find(x => x.val === t.tipo) || TIPOS_TRATAMIENTO[5]
                return (
                  <div key={t.id} className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3 opacity-70">
                    <span className="text-2xl">{t.icono || tipoInfo.icono}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-brand-700 text-sm leading-tight">{t.nombre}</p>
                      <p className="text-xs text-brand-400">{tipoInfo.label} · {t.fecha_inicio} — {t.fecha_fin || '—'}</p>
                    </div>
                    <button onClick={() => archivarTratamiento(t.id, true)}
                      className="text-[10px] font-bold text-brand-500">↻ Reactivar</button>
                    <button onClick={() => eliminarTratamiento(t.id)}
                      className="text-[10px] text-gray-300 active:text-red-500">🗑️</button>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Modal: Nueva entrada / editar */}
      {showNuevaEntrada && parentId && (
        <ModalEntrada
          parentId={parentId}
          hijoId={hijoId}
          tratamientos={tratamientosActivos}
          edicion={editandoEntrada}
          onClose={() => { setShowNuevaEntrada(false); setEditandoEntrada(null) }}
          onSaved={(e, isUpdate) => {
            if (isUpdate) {
              setEntradas(prev => prev.map(x => x.id === e.id ? e : x))
            } else {
              setEntradas(prev => [e, ...prev])
            }
            setShowNuevaEntrada(false); setEditandoEntrada(null)
          }}
        />
      )}

      {/* Modal: Nuevo tratamiento / editar */}
      {showNuevoTratamiento && parentId && (
        <ModalTratamiento
          parentId={parentId}
          hijoId={hijoId}
          edicion={editandoTratamiento}
          onClose={() => { setShowNuevoTratamiento(false); setEditandoTratamiento(null) }}
          onSaved={(t, isUpdate) => {
            if (isUpdate) {
              setTratamientos(prev => prev.map(x => x.id === t.id ? t : x))
            } else {
              setTratamientos(prev => [t, ...prev])
            }
            setShowNuevoTratamiento(false); setEditandoTratamiento(null)
          }}
        />
      )}

      <BottomNav />
    </div>
  )
}

// ── Modal: nueva/editar entrada ─────────────────────────────────────────────
function ModalEntrada({ parentId, hijoId, tratamientos, edicion, onClose, onSaved }: {
  parentId: string
  hijoId: string | null
  tratamientos: Tratamiento[]
  edicion: Entrada | null
  onClose: () => void
  onSaved: (e: Entrada, isUpdate: boolean) => void
}) {
  const [tipo, setTipo] = useState<Entrada['tipo']>(edicion?.tipo || 'nota')
  const [titulo, setTitulo] = useState(edicion?.titulo || '')
  const [contenido, setContenido] = useState(edicion?.contenido || '')
  const [fecha, setFecha] = useState(edicion?.fecha || fechaHoy())
  const [tratamientoId, setTratamientoId] = useState<string | null>(edicion?.tratamiento_id || null)
  const [animo, setAnimo] = useState<number | null>(edicion?.animo || null)
  const [tagsTexto, setTagsTexto] = useState((edicion?.tags || []).join(', '))
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(edicion?.image_url || null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { setError('La imagen es muy grande (máx 5 MB)'); return }
    setImageFile(f)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  async function subirImagen(file: File): Promise<string | null> {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `diario/${parentId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('site-assets').upload(path, file, {
      contentType: file.type || 'image/jpeg', upsert: false,
    })
    if (error) { console.error(error); return null }
    const { data } = supabase.storage.from('site-assets').getPublicUrl(path)
    return data?.publicUrl || null
  }

  async function guardar() {
    if (!contenido.trim()) { setError('Escribe el contenido de la entrada'); return }
    setGuardando(true); setError(null)

    let image_url: string | null = edicion?.image_url || null
    if (imageFile) {
      image_url = await subirImagen(imageFile)
      if (!image_url) { setError('No se pudo subir la imagen'); setGuardando(false); return }
    }

    const tags = tagsTexto.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)
    const payload = {
      parent_id: parentId,
      hijo_id: hijoId,
      tratamiento_id: tratamientoId,
      fecha,
      tipo,
      titulo: titulo.trim() || null,
      contenido: contenido.trim(),
      image_url,
      animo,
      tags: tags.length > 0 ? tags : null,
    }

    if (edicion) {
      const { data, error } = await supabase.from('diario_entradas')
        .update(payload).eq('id', edicion.id).select().single()
      if (error || !data) { setError(error?.message || 'No se pudo guardar'); setGuardando(false); return }
      onSaved(data as Entrada, true)
    } else {
      const { data, error } = await supabase.from('diario_entradas')
        .insert(payload).select().single()
      if (error || !data) { setError(error?.message || 'No se pudo guardar'); setGuardando(false); return }
      onSaved(data as Entrada, false)
    }
    setGuardando(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-brand-800 text-lg">{edicion ? 'Editar entrada' : 'Nueva entrada'}</h3>
          <button onClick={onClose} className="text-brand-400 text-2xl leading-none">×</button>
        </div>

        {/* Tipo de entrada */}
        <p className="text-xs font-black text-brand-700 uppercase tracking-wide mb-2">Tipo</p>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {TIPOS_ENTRADA.map(t => (
            <button key={t.val} onClick={() => setTipo(t.val)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl border-2 transition-all
                ${tipo === t.val ? 'border-brand-500 bg-brand-50' : 'border-gray-100 bg-white'}`}>
              <span className="text-xl">{t.icono}</span>
              <span className="text-[9px] font-bold text-brand-700 leading-tight text-center">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tratamiento */}
        {tratamientos.length > 0 && (
          <>
            <p className="text-xs font-black text-brand-700 uppercase tracking-wide mb-2">Tratamiento (opcional)</p>
            <div className="flex gap-2 mb-4 -mx-1 px-1 pb-1" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
              <button onClick={() => setTratamientoId(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ${tratamientoId === null ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-brand-500 border-brand-100'}`}>
                Sin tratamiento
              </button>
              {tratamientos.map(t => (
                <button key={t.id} onClick={() => setTratamientoId(t.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ${tratamientoId === t.id ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-brand-500 border-brand-100'}`}>
                  {t.icono || '🦷'} {t.nombre}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Fecha */}
        <p className="text-xs font-black text-brand-700 uppercase tracking-wide mb-2">Fecha</p>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm mb-4 outline-none focus:border-brand-400" />

        {/* Título (opcional) */}
        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título (opcional)"
          className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm mb-3 outline-none focus:border-brand-400" />

        {/* Contenido */}
        <textarea value={contenido} onChange={e => setContenido(e.target.value)} placeholder="¿Qué quieres anotar hoy?"
          rows={5} className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm mb-3 outline-none focus:border-brand-400 resize-none" />

        {/* Ánimo */}
        {(tipo === 'sentimiento' || tipo === 'sintoma') && (
          <>
            <p className="text-xs font-black text-brand-700 uppercase tracking-wide mb-2">¿Cómo se siente?</p>
            <div className="flex justify-between mb-4">
              {ANIMO_EMOJIS.map((emo, i) => (
                <button key={i} onClick={() => setAnimo(animo === i + 1 ? null : i + 1)}
                  className={`text-3xl w-12 h-12 rounded-full flex items-center justify-center transition-all
                    ${animo === i + 1 ? 'bg-brand-100 ring-2 ring-brand-500 scale-110' : 'bg-gray-50 active:scale-95'}`}>
                  {emo}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Imagen */}
        <div className="flex items-center gap-3 mb-3">
          <label className="cursor-pointer bg-brand-50 border border-brand-200 text-brand-600 font-bold text-xs px-3 py-2 rounded-full active:scale-95">
            📸 {imagePreview ? 'Cambiar foto' : 'Adjuntar foto'}
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
          {imagePreview && (
            <button onClick={() => { setImageFile(null); setImagePreview(null) }}
              className="text-xs text-red-500 font-bold">Quitar</button>
          )}
        </div>
        {imagePreview && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={imagePreview} alt="preview" className="w-full max-h-40 object-cover rounded-2xl mb-3" />
        )}

        {/* Tags */}
        <input value={tagsTexto} onChange={e => setTagsTexto(e.target.value)}
          placeholder="Etiquetas separadas por coma (opcional, ej: dolor, encías)"
          className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm mb-4 outline-none focus:border-brand-400" />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-3 py-2 text-red-600 text-xs mb-3">{error}</div>
        )}

        <button onClick={guardar} disabled={guardando}
          className="w-full bg-brand-500 text-white font-black rounded-2xl py-3 active:scale-95 disabled:opacity-50">
          {guardando ? 'Guardando…' : edicion ? 'Guardar cambios' : 'Añadir al diario'}
        </button>
      </div>
    </div>
  )
}

// ── Modal: nuevo/editar tratamiento ─────────────────────────────────────────
function ModalTratamiento({ parentId, hijoId, edicion, onClose, onSaved }: {
  parentId: string
  hijoId: string | null
  edicion: Tratamiento | null
  onClose: () => void
  onSaved: (t: Tratamiento, isUpdate: boolean) => void
}) {
  const [nombre, setNombre] = useState(edicion?.nombre || '')
  const [tipo, setTipo] = useState<Tratamiento['tipo']>(edicion?.tipo || 'otro')
  const [descripcion, setDescripcion] = useState(edicion?.descripcion || '')
  const [icono, setIcono] = useState(edicion?.icono || '🦷')
  const [fechaInicio, setFechaInicio] = useState(edicion?.fecha_inicio || fechaHoy())
  const [proximaCita, setProximaCita] = useState(edicion?.proxima_cita || '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ICONOS_RAPIDOS = ['🦷', '🪥', '😬', '💊', '🏥', '🛡️', '✨', '❤️']

  async function guardar() {
    if (!nombre.trim()) { setError('Pon un nombre al tratamiento'); return }
    setGuardando(true); setError(null)

    const payload = {
      parent_id: parentId,
      hijo_id: hijoId,
      nombre: nombre.trim(),
      tipo,
      descripcion: descripcion.trim() || null,
      icono,
      fecha_inicio: fechaInicio,
      proxima_cita: proximaCita || null,
    }

    if (edicion) {
      const { data, error } = await supabase.from('tratamientos')
        .update(payload).eq('id', edicion.id).select().single()
      if (error || !data) { setError(error?.message || 'No se pudo guardar'); setGuardando(false); return }
      onSaved(data as Tratamiento, true)
    } else {
      const { data, error } = await supabase.from('tratamientos')
        .insert(payload).select().single()
      if (error || !data) { setError(error?.message || 'No se pudo guardar'); setGuardando(false); return }
      onSaved(data as Tratamiento, false)
    }
    setGuardando(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-brand-800 text-lg">{edicion ? 'Editar tratamiento' : 'Nuevo tratamiento'}</h3>
          <button onClick={onClose} className="text-brand-400 text-2xl leading-none">×</button>
        </div>

        {/* Nombre */}
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre (ej: Ortodoncia 2025)"
          className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm mb-3 outline-none focus:border-brand-400" />

        {/* Tipo */}
        <p className="text-xs font-black text-brand-700 uppercase tracking-wide mb-2">Tipo</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {TIPOS_TRATAMIENTO.map(t => (
            <button key={t.val} onClick={() => setTipo(t.val)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl border-2 transition-all
                ${tipo === t.val ? 'border-brand-500 bg-brand-50' : 'border-gray-100 bg-white'}`}>
              <span className="text-xl">{t.icono}</span>
              <span className="text-[10px] font-bold text-brand-700 leading-tight">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Icono */}
        <p className="text-xs font-black text-brand-700 uppercase tracking-wide mb-2">Icono</p>
        <div className="flex gap-2 mb-4">
          {ICONOS_RAPIDOS.map(em => (
            <button key={em} onClick={() => setIcono(em)}
              className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center text-xl transition-all
                ${icono === em ? 'border-brand-500 bg-brand-50' : 'border-gray-100 bg-white'}`}>
              {em}
            </button>
          ))}
        </div>

        {/* Descripción */}
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
          placeholder="Descripción (opcional)" rows={3}
          className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm mb-3 outline-none focus:border-brand-400 resize-none" />

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs font-black text-brand-700 uppercase tracking-wide mb-1">Inicio</p>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </div>
          <div>
            <p className="text-xs font-black text-brand-700 uppercase tracking-wide mb-1">Próxima cita</p>
            <input type="date" value={proximaCita} onChange={e => setProximaCita(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-3 py-2 text-red-600 text-xs mb-3">{error}</div>
        )}

        <button onClick={guardar} disabled={guardando}
          className="w-full bg-brand-500 text-white font-black rounded-2xl py-3 active:scale-95 disabled:opacity-50">
          {guardando ? 'Guardando…' : edicion ? 'Guardar cambios' : 'Crear tratamiento'}
        </button>
      </div>
    </div>
  )
}
