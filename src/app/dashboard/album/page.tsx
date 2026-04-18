'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/ui/BottomNav'
import SonrisasLogo from '@/components/ui/SonrisasLogo'

type Album   = { id: string; titulo: string; descripcion?: string | null; portada_url?: string | null; favorito: boolean; created_at: string }
type Memoria = { id: string; album_id: string | null; fecha: string; titulo: string | null; nota: string | null; foto_url: string | null; created_at: string }

type Vista = 'inicio' | 'detalle' | 'nuevo_album' | 'libro'

export default function AlbumPage() {
  const router = useRouter()
  const [vista, setVista] = useState<Vista>('inicio')
  const [albumes, setAlbumes]   = useState<Album[]>([])
  const [memorias, setMemorias] = useState<Memoria[]>([])
  const [loading, setLoading]   = useState(true)
  const [albumSel, setAlbumSel] = useState<Album | null>(null)
  const [memSel, setMemSel]     = useState<Memoria | null>(null)

  const cargar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const [albRes, memRes] = await Promise.all([
      supabase.from('albumes').select('*').eq('parent_id', user.id).order('created_at', { ascending: false }),
      supabase.from('memorias').select('*').eq('parent_id', user.id).order('fecha', { ascending: false }),
    ])
    setAlbumes(albRes.data || [])
    setMemorias(memRes.data || [])
    setLoading(false)
  }, [router])

  useEffect(() => { cargar() }, [cargar])

  // ── Álbum detalle (libro virtual) ──
  if (vista === 'libro' && albumSel) {
    const mems = memorias.filter(m => m.album_id === albumSel.id)
    return <LibroVirtual album={albumSel} memorias={mems} onBack={() => setVista('detalle')} memSel={memSel} setMemSel={setMemSel} />
  }

  // ── Álbum detalle (grid de recuerdos) ──
  if (vista === 'detalle' && albumSel) {
    const mems = memorias.filter(m => m.album_id === albumSel.id)
    return (
      <div className="app-container">
        <div className="page-content">
          <button onClick={() => setVista('inicio')} className="flex items-center gap-1 text-brand-500 font-bold text-sm mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Mis álbumes
          </button>

          <div className="card bg-gradient-to-br from-pink-400 to-brand-500 text-white mb-4">
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-wide">Álbum</p>
            <h1 className="text-2xl font-black leading-tight">{albumSel.titulo}</h1>
            {albumSel.descripcion && <p className="text-white/80 text-xs mt-1">{albumSel.descripcion}</p>}
            <p className="text-white/70 text-[11px] mt-2">{mems.length} {mems.length === 1 ? 'recuerdo' : 'recuerdos'}</p>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setVista('libro')}
              disabled={mems.length === 0}
              className="flex-1 bg-brand-500 text-white font-black py-3 rounded-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
              📖 Abrir libro
            </button>
          </div>

          {mems.length === 0 ? (
            <div className="card text-center py-10 text-brand-400 text-sm">
              Todavía no hay recuerdos en este álbum.
              <p className="text-brand-300 text-xs mt-2">Añade uno desde el calendario del perfil.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {mems.map(m => (
                <button key={m.id} onClick={() => { setMemSel(m); setVista('libro') }}
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-sm active:scale-95 transition-all">
                  {m.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.foto_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-brand-100 flex items-center justify-center text-5xl">📝</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-[11px] font-black truncate">{m.titulo || 'Recuerdo'}</p>
                    <p className="text-white/80 text-[10px]">{new Date(m.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    )
  }

  // ── Nuevo álbum ──
  if (vista === 'nuevo_album') {
    return <FormNuevoAlbum onBack={() => setVista('inicio')} onSaved={() => { setVista('inicio'); cargar() }} />
  }

  // ── Home (lista de álbumes + recuerdos recientes) ──
  const sinAlbum = memorias.filter(m => !m.album_id)
  return (
    <div className="app-container">
      <div className="page-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <SonrisasLogo size={40} />
            <div>
              <h1 className="text-xl font-black text-brand-800 leading-tight">Mis álbumes</h1>
              <p className="text-brand-400 text-xs font-semibold">Libro de recuerdos virtual</p>
            </div>
          </div>
          <button
            onClick={() => setVista('nuevo_album')}
            className="bg-gradient-to-br from-pink-500 to-brand-500 text-white font-black text-xs px-3 py-2 rounded-xl active:scale-95">
            + Álbum
          </button>
        </div>

        {loading ? (
          <div className="card text-center py-10">
            <div className="animate-spin w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full mx-auto mb-2" />
            <p className="text-brand-400 text-sm">Cargando recuerdos…</p>
          </div>
        ) : (
          <>
            {/* Álbumes */}
            {albumes.length === 0 && sinAlbum.length === 0 ? (
              <div className="card text-center py-10 bg-gradient-to-br from-pink-50 to-brand-50 border border-pink-100">
                <div className="text-5xl mb-3">📖</div>
                <h2 className="font-black text-brand-800 text-lg mb-1">Todavía no hay recuerdos</h2>
                <p className="text-brand-500 text-sm mb-4 px-4">
                  Crea un álbum y añade tus primeros recuerdos desde el calendario del perfil.
                </p>
                <button onClick={() => setVista('nuevo_album')}
                  className="bg-brand-500 text-white font-black px-5 py-2.5 rounded-2xl text-sm active:scale-95">
                  + Crear mi primer álbum
                </button>
              </div>
            ) : (
              <>
                {albumes.length > 0 && (
                  <>
                    <p className="text-brand-400 text-xs font-bold uppercase tracking-wide ml-1 mb-2">Álbumes</p>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {albumes.map(a => {
                        const count = memorias.filter(m => m.album_id === a.id).length
                        const portada = a.portada_url || memorias.find(m => m.album_id === a.id && m.foto_url)?.foto_url
                        return (
                          <button key={a.id}
                            onClick={() => { setAlbumSel(a); setVista('detalle') }}
                            className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white shadow-md active:scale-95 transition-all">
                            {portada ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={portada} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-brand-100 to-brand-200 flex items-center justify-center text-6xl">📖</div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                              <p className="text-white font-black text-sm truncate">{a.titulo}</p>
                              <p className="text-white/80 text-[11px]">{count} {count === 1 ? 'recuerdo' : 'recuerdos'}</p>
                            </div>
                            {a.favorito && (
                              <span className="absolute top-2 right-2 bg-yellow-400 text-white text-xs w-7 h-7 rounded-full flex items-center justify-center shadow">⭐</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}

                {/* Recuerdos sin álbum */}
                {sinAlbum.length > 0 && (
                  <>
                    <p className="text-brand-400 text-xs font-bold uppercase tracking-wide ml-1 mb-2">Sin álbum</p>
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {sinAlbum.slice(0, 9).map(m => (
                        <button key={m.id}
                          onClick={() => { setMemSel(m); setAlbumSel(null); setVista('inicio') }}
                          className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 active:scale-95">
                          {m.foto_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.foto_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-brand-100 flex items-center justify-center text-2xl">📝</div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5">
                            <p className="text-white text-[9px] truncate">{m.titulo || new Date(m.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* CTA añadir */}
                <button
                  onClick={() => router.push('/dashboard/perfil')}
                  className="w-full card bg-brand-50 border border-brand-100 text-brand-700 font-bold text-sm py-4 active:scale-95 mb-6">
                  📅 Añadir un recuerdo desde el calendario →
                </button>
              </>
            )}
          </>
        )}

        {/* Visor de recuerdo seleccionado (si no hay álbum) */}
        {memSel && !albumSel && (
          <VisorMemoria
            memoria={memSel}
            albumes={albumes}
            onClose={() => setMemSel(null)}
            onUpdated={() => { setMemSel(null); cargar() }}
            onDeleted={() => { setMemSel(null); cargar() }}
          />
        )}
      </div>
      <BottomNav />
    </div>
  )
}

// ── Libro virtual: páginas pasables ──────────────────────────────────────────
function LibroVirtual({ album, memorias, onBack, memSel, setMemSel }: {
  album: Album
  memorias: Memoria[]
  onBack: () => void
  memSel: Memoria | null
  setMemSel: (m: Memoria | null) => void
}) {
  const [idx, setIdx] = useState(() => {
    if (!memSel) return 0
    const i = memorias.findIndex(m => m.id === memSel.id)
    return i >= 0 ? i : 0
  })

  useEffect(() => { if (memSel) setMemSel(null) }, [memSel, setMemSel])

  if (memorias.length === 0) {
    return (
      <div className="app-container">
        <div className="page-content">
          <button onClick={onBack} className="text-brand-500 font-bold text-sm mb-4">← Volver</button>
          <div className="card text-center py-12 text-brand-400">Este álbum está vacío.</div>
        </div>
      </div>
    )
  }

  const mem = memorias[idx]
  const total = memorias.length

  return (
    <div className="app-container bg-gradient-to-br from-pink-50 via-white to-brand-50">
      <div className="page-content flex flex-col min-h-screen">
        <button onClick={onBack} className="flex items-center gap-1 text-brand-500 font-bold text-sm mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {album.titulo}
        </button>

        {/* Página del libro */}
        <div className="relative bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden flex-1 mb-4">
          {/* Spine/lomo decorativo */}
          <div className="absolute left-0 inset-y-0 w-2 bg-gradient-to-b from-pink-200 via-brand-200 to-pink-200" />

          <div className="p-5 pl-7 h-full flex flex-col">
            <p className="text-pink-400 text-[11px] font-bold uppercase tracking-widest">
              {new Date(mem.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h2 className="font-black text-brand-800 text-xl mt-1 leading-tight">{mem.titulo || 'Recuerdo'}</h2>

            {mem.foto_url && (
              <div className="mt-3 rounded-2xl overflow-hidden bg-gray-100 max-h-72">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mem.foto_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            {mem.nota && (
              <p className="text-brand-700 text-sm leading-relaxed mt-3 whitespace-pre-wrap flex-1">
                {mem.nota}
              </p>
            )}
            {!mem.nota && !mem.foto_url && (
              <p className="text-brand-300 text-sm mt-3 italic">Sin nota.</p>
            )}
          </div>

          {/* Número de página */}
          <p className="absolute bottom-2 right-4 text-brand-300 text-[10px] font-bold">{idx + 1} / {total}</p>
        </div>

        {/* Navegación */}
        <div className="flex gap-2 mb-4">
          <button
            disabled={idx === 0}
            onClick={() => setIdx(i => Math.max(0, i - 1))}
            className="flex-1 bg-white border-2 border-pink-200 text-pink-600 font-black py-3 rounded-2xl active:scale-95 disabled:opacity-40 disabled:border-gray-100 disabled:text-gray-300">
            ← Anterior
          </button>
          <button
            disabled={idx === total - 1}
            onClick={() => setIdx(i => Math.min(total - 1, i + 1))}
            className="flex-1 bg-gradient-to-r from-pink-500 to-brand-500 text-white font-black py-3 rounded-2xl active:scale-95 disabled:opacity-40">
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Formulario nuevo álbum ────────────────────────────────────────────────────
function FormNuevoAlbum({ onBack, onSaved }: { onBack: () => void; onSaved: () => void }) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [portada, setPortada] = useState<string | null>(null)
  const [favorito, setFavorito] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const TEMPLATES = [
    { k: 'primeros_dientes', t: 'Primeros dientes', e: '🦷' },
    { k: 'cumpleanos',       t: 'Cumpleaños',       e: '🎂' },
    { k: 'vacaciones',       t: 'Vacaciones',       e: '🏖️' },
    { k: 'familia',          t: 'Familia',          e: '👨‍👩‍👧' },
    { k: 'sonrisas',         t: 'Sonrisas',         e: '😁' },
  ]

  function handlePortada(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { setError('La portada no puede superar 3MB'); return }
    const reader = new FileReader()
    reader.onload = ev => setPortada(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function guardar() {
    setError('')
    if (!titulo.trim()) { setError('Ponle un título al álbum'); return }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      const { data: hijos } = await supabase.from('hijos').select('id').eq('parent_id', user.id).limit(1)
      const { error: insErr } = await supabase.from('albumes').insert({
        parent_id: user.id,
        hijo_id: hijos?.[0]?.id ?? null,
        titulo,
        descripcion: descripcion || null,
        portada_url: portada,
        favorito,
      })
      if (insErr) throw insErr
      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div className="page-content">
        <button onClick={onBack} className="flex items-center gap-1 text-brand-500 font-bold text-sm mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Volver
        </button>
        <h2 className="text-2xl font-black text-brand-800 mb-1">Nuevo álbum</h2>
        <p className="text-brand-400 text-xs mb-5">Agrupa recuerdos por tema, viaje o etapa.</p>

        <div className="flex flex-col gap-4">
          {/* Plantillas rápidas */}
          <div className="card">
            <p className="text-brand-700 font-bold text-sm mb-2">Sugerencias</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map(t => (
                <button key={t.k}
                  onClick={() => setTitulo(t.t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all
                    ${titulo === t.t ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-600'}`}>
                  <span className="mr-1">{t.e}</span>{t.t}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-brand-600 font-semibold text-xs mb-1 block">Título *</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} className="input-field" placeholder="Ej: Primeros dientes" maxLength={60} />
              </div>
              <div>
                <label className="text-brand-600 font-semibold text-xs mb-1 block">Descripción</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} className="input-field resize-none" placeholder="Una línea para recordar de qué trata el álbum" maxLength={200} />
              </div>
              <div>
                <label className="text-brand-600 font-semibold text-xs mb-1 block">Portada</label>
                {portada ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={portada} alt="" className="w-full h-40 object-cover rounded-2xl" />
                    <button onClick={() => setPortada(null)} className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold rounded-full px-3 py-1">✕ Quitar</button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 cursor-pointer bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-3 hover:border-brand-300 transition-all">
                    <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-xl">🖼️</div>
                    <div>
                      <p className="font-bold text-brand-700 text-sm">Subir portada (opcional)</p>
                      <p className="text-brand-400 text-xs">JPG, PNG · máx. 3MB</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePortada} />
                  </label>
                )}
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={favorito} onChange={e => setFavorito(e.target.checked)} className="w-5 h-5 accent-yellow-400" />
                <span className="text-brand-700 text-sm font-semibold">⭐ Marcar como favorito</span>
              </label>
            </div>
          </div>

          {error && <p className="text-red-500 text-center font-bold text-sm bg-red-50 rounded-2xl py-3">{error}</p>}

          <button onClick={guardar} disabled={loading || !titulo.trim()} className="btn-primary">
            {loading ? 'Creando…' : 'Crear álbum'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Visor/editor de un recuerdo ──────────────────────────────────────────────
function VisorMemoria({ memoria, albumes, onClose, onUpdated, onDeleted }: {
  memoria: Memoria
  albumes: Album[]
  onClose: () => void
  onUpdated: () => void
  onDeleted: () => void
}) {
  const [albumId, setAlbumId] = useState<string | null>(memoria.album_id)
  const [saving, setSaving] = useState(false)

  async function moverAAlbum(id: string | null) {
    setSaving(true)
    await supabase.from('memorias').update({ album_id: id }).eq('id', memoria.id)
    setAlbumId(id)
    setSaving(false)
    onUpdated()
  }

  async function eliminar() {
    if (!confirm('¿Eliminar este recuerdo? No se podrá recuperar.')) return
    await supabase.from('memorias').delete().eq('id', memoria.id)
    onDeleted()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {memoria.foto_url && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={memoria.foto_url} alt="" className="w-full h-64 object-cover rounded-t-3xl" />
            <button onClick={onClose} className="absolute top-3 right-3 bg-black/60 text-white text-lg w-8 h-8 rounded-full flex items-center justify-center">×</button>
          </div>
        )}
        <div className="p-5">
          {!memoria.foto_url && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-pink-400 text-xs font-bold uppercase tracking-wide">Recuerdo</p>
              <button onClick={onClose} className="text-gray-400 text-xl">×</button>
            </div>
          )}
          <p className="text-pink-400 text-[11px] font-bold uppercase tracking-widest">
            {new Date(memoria.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h3 className="font-black text-brand-800 text-xl mt-1">{memoria.titulo || 'Sin título'}</h3>
          {memoria.nota && <p className="text-brand-700 text-sm whitespace-pre-wrap mt-2">{memoria.nota}</p>}

          {albumes.length > 0 && (
            <div className="mt-4 bg-brand-50 rounded-2xl p-3">
              <p className="text-brand-600 font-bold text-xs mb-2">Mover a álbum</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => moverAAlbum(null)}
                  className={`text-xs px-3 py-1.5 rounded-full font-bold ${albumId === null ? 'bg-brand-500 text-white' : 'bg-white text-brand-600'}`}>
                  Sin álbum
                </button>
                {albumes.map(a => (
                  <button key={a.id}
                    disabled={saving}
                    onClick={() => moverAAlbum(a.id)}
                    className={`text-xs px-3 py-1.5 rounded-full font-bold ${albumId === a.id ? 'bg-brand-500 text-white' : 'bg-white text-brand-600'}`}>
                    {a.titulo}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={eliminar} className="w-full mt-4 py-3 text-red-500 font-bold rounded-2xl border-2 border-red-100 text-sm">
            🗑️ Eliminar recuerdo
          </button>
        </div>
      </div>
    </div>
  )
}
