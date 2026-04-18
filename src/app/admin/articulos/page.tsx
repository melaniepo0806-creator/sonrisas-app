'use client'
import { Suspense, useEffect, useState, useCallback } from 'react'
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
  destacado: boolean
  orden: number
  publicado: boolean
}

const ETAPAS = ['0-1','2-6','6-12']
const CATEGORIAS = ['lavado','alimentacion','dentista','salud','ortodoncia']
const EMPTY: Articulo = {
  etapa: '0-1', categoria: 'lavado', titulo: '', resumen: '', contenido: '',
  imagen_url: '', video_url: '', destacado: false, orden: 0, publicado: true,
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
    const payload = { ...editing, resumen: editing.resumen || null, contenido: editing.contenido || null }
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
      <p className="text-gray-500 text-sm mb-5">Gestiona las guías que ven los padres en la app.</p>

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
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">Etapa {a.etapa}</span>
                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.categoria}</span>
                  {a.destacado && <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⭐ Destacado</span>}
                  {!a.publicado && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Borrador</span>}
                </div>
                <p className="font-bold text-gray-800 text-sm">{a.titulo}</p>
                {a.resumen && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{a.resumen}</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setEditing(a)} className="text-xs text-brand-600 font-bold px-2 py-1 rounded-lg hover:bg-brand-50">Editar</button>
                <button onClick={() => borrar(a)} className="text-xs text-red-500 font-bold px-2 py-1 rounded-lg hover:bg-red-50">Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-black text-gray-800">{editing.id ? 'Editar artículo' : 'Nuevo artículo'}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Título *</label>
                <input value={editing.titulo} onChange={e => setEditing({ ...editing, titulo: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Etapa</label>
                  <select value={editing.etapa} onChange={e => setEditing({ ...editing, etapa: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
                    {ETAPAS.map(x => <option key={x}>{x}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Categoría</label>
                  <select value={editing.categoria} onChange={e => setEditing({ ...editing, categoria: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
                    {CATEGORIAS.map(x => <option key={x}>{x}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Resumen</label>
                <textarea rows={2} value={editing.resumen || ''} onChange={e => setEditing({ ...editing, resumen: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Contenido (markdown)</label>
                <textarea rows={6} value={editing.contenido || ''} onChange={e => setEditing({ ...editing, contenido: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Imagen (URL)</label>
                  <input value={editing.imagen_url || ''} onChange={e => setEditing({ ...editing, imagen_url: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="https://…" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Video (URL)</label>
                  <input value={editing.video_url || ''} onChange={e => setEditing({ ...editing, video_url: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="https://…" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Orden</label>
                  <input type="number" value={editing.orden} onChange={e => setEditing({ ...editing, orden: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editing.destacado} onChange={e => setEditing({ ...editing, destacado: e.target.checked })} />
                    Destacado
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editing.publicado} onChange={e => setEditing({ ...editing, publicado: e.target.checked })} />
                    Publicado
                  </label>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-2 justify-end sticky bottom-0 bg-white">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm font-bold text-gray-500">Cancelar</button>
              <button onClick={guardar} disabled={!editing.titulo}
                className="px-5 py-2 text-sm font-bold bg-brand-500 text-white rounded-xl disabled:opacity-50">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
