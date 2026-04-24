'use client'
import { Suspense, useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Articulo = {
  id?: string
  etapa: string
  categoria: string
  titulo: string
  resumen: string | null
  contenido: string | null
  imagen_url: string | null
  video_url: string | null
  icono_emoji: string | null
  pasos: string[] | null
  sabias_que: string | null
  imagenes_extra: string[] | null
  destacado: boolean
  orden: number
  publicado: boolean
}

const ETAPAS = ['0-1', '2-6', '6-12']
const CATEGORIAS = ['lavado', 'alimentacion', 'dentista', 'salud', 'ortodoncia']
const EMOJIS = ['🦷', '🪥', '🍎', '🥦', '🥛', '🥤', '🍭', '🍬', '🍫', '🩺', '👨‍⚕️', '👩‍⚕️', '💉', '💊', '📅', '⏰', '🎈', '🎉', '⭐', '❤️', '💙', '🧒', '👶', '🤱', '✨', '💡', '📖', '📸', '🎥', '🏆']
const STORAGE_BUCKET = 'site-assets'

const EMPTY: Articulo = {
  etapa: '0-1',
  categoria: 'lavado',
  titulo: '',
  resumen: '',
  contenido: '',
  imagen_url: '',
  video_url: '',
  icono_emoji: '',
  pasos: [],
  sabias_que: '',
  imagenes_extra: [],
  destacado: false,
  orden: 0,
  publicado: true,
}

// Extrae ID de YouTube de cualquier formato (watch, youtu.be, shorts, embed)
function youtubeId(url: string | null): string | null {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function AdminArticulosPage() {
  return (
    <Suspense fallback={<p className="text-gray-400 text-sm text-center py-8">Cargando…</p>}>
      <AdminArticulosInner />
    </Suspense>
  )
}

function AdminArticulosInner() {
  const search = useSearchParams()
  const [list, setList] = useState<Articulo[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Articulo | null>(null)
  const [filtroEtapa, setFiltroEtapa] = useState('todas')
  const [q, setQ] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('articulos').select('*').order('etapa').order('orden')
    setList((data as Articulo[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (search.get('new')) setEditing({ ...EMPTY }) }, [search])

  async function guardar() {
    if (!editing) return
    const payload = {
      ...editing,
      resumen: editing.resumen || null,
      contenido: editing.contenido || null,
      icono_emoji: editing.icono_emoji || null,
      sabias_que: editing.sabias_que || null,
      pasos: (editing.pasos || []).filter(p => p && p.trim()),
      imagenes_extra: (editing.imagenes_extra || []).filter(p => p && p.trim()),
    }
    let err: unknown = null
    if (editing.id) {
      const { error } = await supabase.from('articulos').update(payload).eq('id', editing.id); err = error
    } else {
      const { error } = await supabase.from('articulos').insert(payload); err = error
    }
    if (err) { alert('Error: ' + (err as Error).message); return }
    setEditing(null)
    setSavedMsg('Guardado ✓')
    setTimeout(() => setSavedMsg(''), 2000)
    load()
  }

  async function borrar(a: Articulo) {
    if (!a.id) return
    if (!confirm(`¿Borrar "${a.titulo}"?`)) return
    await supabase.from('articulos').delete().eq('id', a.id)
    load()
  }

  const filtrados = list.filter(a =>
    (filtroEtapa === 'todas' || a.etapa === filtroEtapa) &&
    (!q || a.titulo.toLowerCase().includes(q.toLowerCase()))
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-black text-gray-800">Contenido</h1>
        <button onClick={() => setEditing({ ...EMPTY })}
          className="bg-brand-500 text-white font-bold text-sm px-4 py-2 rounded-xl shadow-sm hover:bg-brand-600">
          + Nuevo artículo
        </button>
      </div>
      <p className="text-gray-500 text-sm mb-5">Gestiona las guías que ven los padres en la app. Ahora puedes añadir fotos, videos de YouTube, pasos y tips personalizados.</p>

      {savedMsg && <p className="mb-3 bg-green-50 text-green-700 text-sm text-center py-2 rounded-xl">{savedMsg}</p>}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={filtroEtapa} onChange={e => setFiltroEtapa(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
          <option value="todas">Todas las etapas</option>
          {ETAPAS.map(e => <option key={e} value={e}>Etapa {e}</option>)}
        </select>
        <input type="search" placeholder="Buscar por título…" value={q} onChange={e => setQ(e.target.value)}
          className="flex-1 min-w-[180px] border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white" />
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-gray-400 text-sm text-center py-8">Cargando…</p>
      ) : filtrados.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Sin artículos.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
          {filtrados.map(a => (
            <div key={a.id} className="p-4 flex items-start gap-3">
              {a.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.imagen_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center text-2xl flex-shrink-0">
                  {a.icono_emoji || '🦷'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">Etapa {a.etapa}</span>
                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.categoria}</span>
                  {a.destacado && <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⭐ Destacado</span>}
                  {!a.publicado && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Borrador</span>}
                  {a.video_url && <span className="text-xs font-bold bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">▶ Video</span>}
                </div>
                <p className="font-bold text-gray-800 text-sm">{a.titulo}</p>
                {a.resumen && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{a.resumen}</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setEditing({ ...EMPTY, ...a, pasos: a.pasos || [], imagenes_extra: a.imagenes_extra || [] })} className="text-xs text-brand-600 font-bold px-2 py-1 rounded-lg hover:bg-brand-50">Editar</button>
                <button onClick={() => borrar(a)} className="text-xs text-red-500 font-bold px-2 py-1 rounded-lg hover:bg-red-50">Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editing && (
        <EditorModal
          articulo={editing}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={guardar}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Editor Modal
// ─────────────────────────────────────────────────────────────────────────────
function EditorModal({
  articulo,
  onChange,
  onCancel,
  onSave,
}: {
  articulo: Articulo
  onChange: (a: Articulo) => void
  onCancel: () => void
  onSave: () => void
}) {
  const [tab, setTab] = useState<'basico' | 'contenido' | 'media' | 'extras'>('basico')
  const [preview, setPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const extraFileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function uploadImage(file: File, target: 'principal' | 'extra') {
    setUploading(true)
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `articulos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: false, contentType: file.type })
      if (error) { alert('No se pudo subir la imagen: ' + error.message); return }
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
      const url = data.publicUrl
      if (target === 'principal') {
        onChange({ ...articulo, imagen_url: url })
      } else {
        onChange({ ...articulo, imagenes_extra: [...(articulo.imagenes_extra || []), url] })
      }
    } finally {
      setUploading(false)
    }
  }

  const ytId = youtubeId(articulo.video_url)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[95dvh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-800 text-lg">{articulo.id ? 'Editar artículo' : 'Nuevo artículo'}</h2>
            <button onClick={onCancel} className="text-gray-400 text-2xl leading-none">×</button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {([
              ['basico', '📝 Básico'],
              ['contenido', '📄 Contenido'],
              ['media', '🎥 Fotos y video'],
              ['extras', '✨ Pasos y tips'],
            ] as const).map(([val, label]) => (
              <button key={val} onClick={() => setTab(val)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition
                  ${tab === val ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {label}
              </button>
            ))}
            <button onClick={() => setPreview(p => !p)}
              className={`ml-auto px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition
                ${preview ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
              👁 {preview ? 'Ocultar' : 'Preview'}
            </button>
          </div>
        </div>

        {/* Preview */}
        {preview && <ArticuloPreview articulo={articulo} />}

        <div className="p-4 sm:p-5 space-y-4">
          {/* ── TAB BÁSICO ── */}
          {tab === 'basico' && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Título *</label>
                <input value={articulo.titulo} onChange={e => onChange({ ...articulo, titulo: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Ej: ¿Pasta de dientes en bebés?" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Etapa</label>
                  <select value={articulo.etapa} onChange={e => onChange({ ...articulo, etapa: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
                    {ETAPAS.map(x => <option key={x}>{x}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Categoría</label>
                  <select value={articulo.categoria} onChange={e => onChange({ ...articulo, categoria: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
                    {CATEGORIAS.map(x => <option key={x}>{x}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Resumen</label>
                <textarea rows={2} value={articulo.resumen || ''} onChange={e => onChange({ ...articulo, resumen: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Frase corta que aparece bajo el título en la guía." />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-2 block">Icono / Emoji personalizado</label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-3xl border border-brand-100">
                    {articulo.icono_emoji || '🦷'}
                  </div>
                  <input value={articulo.icono_emoji || ''} onChange={e => onChange({ ...articulo, icono_emoji: e.target.value })}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-lg" placeholder="Pega un emoji o deja vacío" maxLength={4} />
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {EMOJIS.map(em => (
                    <button key={em} type="button" onClick={() => onChange({ ...articulo, icono_emoji: em })}
                      className={`aspect-square text-xl rounded-lg border transition
                        ${articulo.icono_emoji === em ? 'bg-brand-100 border-brand-400 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Orden</label>
                  <input type="number" value={articulo.orden} onChange={e => onChange({ ...articulo, orden: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={articulo.destacado} onChange={e => onChange({ ...articulo, destacado: e.target.checked })} />
                    Destacado
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={articulo.publicado} onChange={e => onChange({ ...articulo, publicado: e.target.checked })} />
                    Publicado
                  </label>
                </div>
              </div>
            </>
          )}

          {/* ── TAB CONTENIDO ── */}
          {tab === 'contenido' && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">
                  Información clave (texto principal)
                </label>
                <textarea rows={12} value={articulo.contenido || ''} onChange={e => onChange({ ...articulo, contenido: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono leading-relaxed"
                  placeholder="Escribe aquí el cuerpo del artículo. Separa párrafos con una línea en blanco."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: separa los párrafos con una línea en blanco. Se mostrarán como bloques de texto en la guía.
                </p>
              </div>
            </>
          )}

          {/* ── TAB MEDIA ── */}
          {tab === 'media' && (
            <>
              {/* Imagen principal */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-2 block">Imagen principal</label>
                {articulo.imagen_url ? (
                  <div className="relative mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={articulo.imagen_url} alt="" className="w-full max-h-56 object-cover rounded-2xl border border-gray-100" />
                    <button onClick={() => onChange({ ...articulo, imagen_url: '' })}
                      className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full">Quitar</button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center mb-2">
                    <p className="text-3xl mb-2">🖼️</p>
                    <p className="text-sm text-gray-500 mb-3">Sube una foto o pega una URL</p>
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      className="bg-brand-500 text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-50">
                      {uploading ? 'Subiendo…' : '📤 Subir imagen'}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'principal'); e.target.value = '' }} />
                  </div>
                )}
                <input value={articulo.imagen_url || ''} onChange={e => onChange({ ...articulo, imagen_url: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs" placeholder="https://… (o sube la imagen arriba)" />
              </div>

              {/* Video YouTube */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-2 block">Video de YouTube (URL)</label>
                <input value={articulo.video_url || ''} onChange={e => onChange({ ...articulo, video_url: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="https://www.youtube.com/watch?v=… o https://youtu.be/…" />
                {ytId ? (
                  <div className="mt-2 aspect-video rounded-2xl overflow-hidden border border-gray-100">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Preview video"
                    />
                  </div>
                ) : articulo.video_url ? (
                  <p className="text-xs text-amber-600 mt-1">⚠️ URL no reconocida como YouTube. Pega el link de youtube.com o youtu.be.</p>
                ) : null}
              </div>

              {/* Imágenes extra (galería) */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-2 block">Imágenes extra (galería)</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {(articulo.imagenes_extra || []).map((url, i) => (
                    <div key={i} className="relative aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-gray-100" />
                      <button onClick={() => onChange({ ...articulo, imagenes_extra: (articulo.imagenes_extra || []).filter((_, j) => j !== i) })}
                        className="absolute top-1 right-1 bg-black/60 text-white w-6 h-6 rounded-full text-xs">×</button>
                    </div>
                  ))}
                  <button onClick={() => extraFileInputRef.current?.click()} disabled={uploading}
                    className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-brand-300 hover:text-brand-500 disabled:opacity-50">
                    <span className="text-2xl">+</span>
                    <span className="text-[10px] font-bold">{uploading ? 'Subiendo…' : 'Añadir'}</span>
                  </button>
                </div>
                <input ref={extraFileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'extra'); e.target.value = '' }} />
              </div>
            </>
          )}

          {/* ── TAB EXTRAS ── */}
          {tab === 'extras' && (
            <>
              {/* Pasos */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-2 block">Pasos / ¿Qué hacer?</label>
                <div className="space-y-2 mb-2">
                  {(articulo.pasos || []).map((paso, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-black flex-shrink-0 mt-1">{i + 1}</div>
                      <textarea value={paso} rows={2} onChange={e => {
                        const next = [...(articulo.pasos || [])]; next[i] = e.target.value
                        onChange({ ...articulo, pasos: next })
                      }} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder={`Paso ${i + 1}`} />
                      <div className="flex flex-col gap-1">
                        <button disabled={i === 0} onClick={() => {
                          const next = [...(articulo.pasos || [])];
                          [next[i - 1], next[i]] = [next[i], next[i - 1]]
                          onChange({ ...articulo, pasos: next })
                        }} className="text-gray-400 hover:text-brand-500 text-xs px-1 disabled:opacity-30">↑</button>
                        <button disabled={i === (articulo.pasos?.length || 0) - 1} onClick={() => {
                          const next = [...(articulo.pasos || [])];
                          [next[i + 1], next[i]] = [next[i], next[i + 1]]
                          onChange({ ...articulo, pasos: next })
                        }} className="text-gray-400 hover:text-brand-500 text-xs px-1 disabled:opacity-30">↓</button>
                        <button onClick={() => {
                          onChange({ ...articulo, pasos: (articulo.pasos || []).filter((_, j) => j !== i) })
                        }} className="text-red-400 hover:text-red-600 text-xs px-1">×</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => onChange({ ...articulo, pasos: [...(articulo.pasos || []), ''] })}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2 text-sm font-bold text-gray-500 hover:border-brand-300 hover:text-brand-500">
                  + Añadir paso
                </button>
              </div>

              {/* Sabías que */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">💡 Sabías que... (tip amarillo)</label>
                <textarea rows={3} value={articulo.sabias_que || ''} onChange={e => onChange({ ...articulo, sabias_que: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Dato curioso o tip extra que aparece resaltado en amarillo." />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-2 justify-end sticky bottom-0 bg-white">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-500">Cancelar</button>
          <button onClick={onSave} disabled={!articulo.titulo}
            className="px-5 py-2 text-sm font-bold bg-brand-500 text-white rounded-xl disabled:opacity-50">
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview: cómo se verá el artículo en la guía
// ─────────────────────────────────────────────────────────────────────────────
function ArticuloPreview({ articulo }: { articulo: Articulo }) {
  const ytId = youtubeId(articulo.video_url)
  const paragraphs = (articulo.contenido || '').split(/\n\s*\n/).filter(p => p.trim())

  return (
    <div className="bg-gradient-to-b from-brand-50 to-white border-y-2 border-purple-200 p-4">
      <p className="text-[10px] font-black text-purple-600 uppercase tracking-wide mb-2">PREVIEW — así se verá en la app</p>
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          {articulo.imagen_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={articulo.imagen_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-brand-50 flex items-center justify-center text-3xl flex-shrink-0">
              {articulo.icono_emoji || '🦷'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-brand-800 text-base leading-tight">{articulo.titulo || '(sin título)'}</h3>
            <p className="text-xs text-brand-400 font-bold mt-0.5">Etapa {articulo.etapa} · {articulo.categoria}</p>
          </div>
        </div>
        {articulo.resumen && <p className="text-sm text-brand-600 mb-3">{articulo.resumen}</p>}
        {paragraphs.length > 0 && (
          <div className="space-y-2 mb-3">
            {paragraphs.map((p, i) => <p key={i} className="text-sm text-brand-700 leading-relaxed">{p}</p>)}
          </div>
        )}
        {(articulo.pasos || []).length > 0 && (
          <div className="space-y-2 mb-3">
            <p className="font-black text-brand-800 text-sm">¿Qué hacer?</p>
            {(articulo.pasos || []).map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-xs text-brand-700 leading-relaxed flex-1">{p}</p>
              </div>
            ))}
          </div>
        )}
        {articulo.sabias_que && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3">
            <p className="text-yellow-700 font-black text-xs mb-1">💡 Sabías que...</p>
            <p className="text-yellow-600 text-xs">{articulo.sabias_que}</p>
          </div>
        )}
        {ytId && (
          <div className="aspect-video rounded-xl overflow-hidden mb-2">
            <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full" allowFullScreen title="preview" />
          </div>
        )}
      </div>
    </div>
  )
}
