'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type Post = {
  id: string
  author_id: string
  content: string
  image_url: string | null
  likes_count: number
  comments_count: number
  oculto: boolean
  created_at: string
  perfil?: { nombre_completo: string | null; username: string | null } | null
}

type Comentario = {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  perfil?: { nombre_completo: string | null; username: string | null } | null
}

export default function AdminComunidad() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'visibles' | 'ocultos'>('todos')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<Post | null>(null)
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [loadingCom, setLoadingCom] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select('*, perfil:profiles!posts_author_id_fkey(nombre_completo, username)')
      .order('created_at', { ascending: false })
      .limit(200)
    setPosts((data as Post[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleOculto(p: Post) {
    await supabase.from('posts').update({ oculto: !p.oculto }).eq('id', p.id)
    load()
  }

  async function borrarPost(p: Post) {
    if (!confirm('¿Borrar este post definitivamente? También se eliminarán sus comentarios.')) return
    await supabase.from('posts').delete().eq('id', p.id)
    if (open?.id === p.id) setOpen(null)
    load()
  }

  async function borrarComentario(c: Comentario) {
    if (!confirm('¿Borrar este comentario?')) return
    await supabase.from('comentarios').delete().eq('id', c.id)
    setComentarios(comentarios.filter(x => x.id !== c.id))
    // decrement contador local
    setPosts(posts.map(p => p.id === c.post_id ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p))
  }

  async function abrir(p: Post) {
    setOpen(p)
    setLoadingCom(true)
    const { data } = await supabase
      .from('comentarios')
      .select('*, perfil:profiles!comentarios_author_id_fkey(nombre_completo, username)')
      .eq('post_id', p.id)
      .order('created_at', { ascending: true })
    setComentarios((data as Comentario[]) || [])
    setLoadingCom(false)
  }

  const filtrados = posts.filter(p => {
    if (filtro === 'visibles' && p.oculto) return false
    if (filtro === 'ocultos' && !p.oculto) return false
    if (q) {
      const s = q.toLowerCase()
      if (!p.content.toLowerCase().includes(s)
          && !(p.perfil?.nombre_completo || '').toLowerCase().includes(s)
          && !(p.perfil?.username || '').toLowerCase().includes(s)) return false
    }
    return true
  })

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-1">Comunidad (Nido)</h1>
      <p className="text-gray-500 text-sm mb-5">{posts.length} posts · modera, oculta o elimina contenido inadecuado.</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <select value={filtro} onChange={e => setFiltro(e.target.value as 'todos' | 'visibles' | 'ocultos')}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
          <option value="todos">Todos</option>
          <option value="visibles">Solo visibles</option>
          <option value="ocultos">Solo ocultos</option>
        </select>
        <input type="search" placeholder="Buscar por texto o autor…" value={q} onChange={e => setQ(e.target.value)}
          className="flex-1 min-w-[180px] border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white" />
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-8">Cargando…</p>
      ) : filtrados.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Sin posts.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
          {filtrados.map(p => (
            <div key={p.id} className={`p-4 flex items-start gap-3 ${p.oculto ? 'bg-red-50/30' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-bold text-gray-800">{p.perfil?.nombre_completo || 'Anónimo'}</span>
                  {p.perfil?.username && <span className="text-xs text-gray-400">@{p.perfil.username}</span>}
                  <span className="text-xs text-gray-400">· {new Date(p.created_at).toLocaleString('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                  {p.oculto && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Oculto</span>}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words line-clamp-4">{p.content}</p>
                {p.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt="" className="mt-2 rounded-xl max-h-48 object-cover" />
                )}
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                  <span>❤ {p.likes_count}</span>
                  <button onClick={() => abrir(p)} className="text-brand-600 font-bold hover:underline">
                    💬 {p.comments_count} comentarios
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button onClick={() => toggleOculto(p)}
                  className={`text-xs font-bold px-2 py-1 rounded-lg ${p.oculto ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'}`}>
                  {p.oculto ? 'Mostrar' : 'Ocultar'}
                </button>
                <button onClick={() => borrarPost(p)}
                  className="text-xs text-red-500 font-bold px-2 py-1 rounded-lg hover:bg-red-50">
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal comentarios */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-black text-gray-800">Comentarios</h2>
              <button onClick={() => setOpen(null)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="p-5">
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">
                  {open.perfil?.nombre_completo || 'Anónimo'}
                  {open.perfil?.username ? ` · @${open.perfil.username}` : ''}
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{open.content}</p>
              </div>
              {loadingCom ? (
                <p className="text-gray-400 text-sm text-center py-6">Cargando comentarios…</p>
              ) : comentarios.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">Aún no hay comentarios.</p>
              ) : (
                <ul className="space-y-3">
                  {comentarios.map(c => (
                    <li key={c.id} className="flex items-start gap-2 border-b border-gray-100 pb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700">
                          {c.perfil?.nombre_completo || 'Anónimo'}
                          {c.perfil?.username && <span className="text-gray-400 font-normal"> · @{c.perfil.username}</span>}
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{new Date(c.created_at).toLocaleString('es-ES')}</p>
                      </div>
                      <button onClick={() => borrarComentario(c)}
                        className="text-xs text-red-500 font-bold px-2 py-1 rounded-lg hover:bg-red-50">
                        Borrar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
