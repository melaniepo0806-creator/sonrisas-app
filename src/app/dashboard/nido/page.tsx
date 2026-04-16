'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/ui/BottomNav'
import Sparkles from '@/components/ui/Sparkles'

type Post = {
  id: string; author_id: string; content: string; image_url?: string
  likes_count: number; comments_count: number; created_at: string
  autor_nombre?: string; autor_avatar?: string; liked?: boolean
}

const POSTS_DEMO: Post[] = [
  { id: '1', author_id: 'demo1', content: 'Primera visita al dentista, ¡todo un éxito! María no lloró nada 💪', likes_count: 24, comments_count: 3, created_at: new Date(Date.now()-3600000).toISOString(), autor_nombre: '@maria_mama', autor_avatar: '👩' },
  { id: '2', author_id: 'demo2', content: '¿Qué cepillo recomiendan? ¡A qué dentista van?', likes_count: 8, comments_count: 5, created_at: new Date(Date.now()-18000000).toISOString(), autor_nombre: '@papa_lucas', autor_avatar: '👨' },
  { id: '3', author_id: 'demo3', content: 'Mi hijo odio el cepillo. ¿Algún consejo para motivarlo? 😅', likes_count: 15, comments_count: 7, created_at: new Date(Date.now()-86400000).toISOString(), autor_nombre: '@papa_lucas', autor_avatar: '👨🏽' },
]

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  if (diff < 3600000) return `Hace ${Math.floor(diff/60000)} min`
  if (diff < 86400000) return `Hace ${Math.floor(diff/3600000)} h`
  return `Hace ${Math.floor(diff/86400000)} días`
}

// Avatar initial from name
function getInitial(name: string) {
  return name ? name.charAt(0).toUpperCase() : '?'
}

export default function NidoPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'recientes'|'popular'|'mios'>('recientes')
  const [posts, setPosts] = useState<Post[]>(POSTS_DEMO)
  const [showMenu, setShowMenu] = useState(false)
  const [showNuevoPost, setShowNuevoPost] = useState(false)
  const [nuevoTexto, setNuevoTexto] = useState('')
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [userId, setUserId] = useState<string|null>(null)
  const [userName, setUserName] = useState<string>('Tú')
  const [publicando, setPublicando] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        const { data: prof } = await supabase.from('profiles').select('nombre_completo').eq('id', user.id).single()
        if (prof?.nombre_completo) setUserName(prof.nombre_completo.split(' ')[0])
      }
    })
    cargarPosts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  async function cargarPosts() {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(20)
    if (data && data.length > 0) {
      const { data: { user } } = await supabase.auth.getUser()
      const uid = user?.id || null
      const enriched = await Promise.all(data.map(async p => {
        const { data: prof } = await supabase.from('profiles').select('nombre_completo').eq('id', p.author_id).single()
        const { data: likeCheck } = uid ? await supabase.from('post_likes').select('post_id').eq('post_id', p.id).eq('user_id', uid).maybeSingle() : { data: null }
        return { ...p, autor_nombre: prof?.nombre_completo || 'Usuario', autor_avatar: '', liked: !!likeCheck }
      }))
      setPosts(enriched)
    }
  }

  async function toggleLike(post: Post) {
    if (!userId) return
    const liked = post.liked
    setPosts(ps => ps.map(p => p.id === post.id ? { ...p, liked: !liked, likes_count: liked ? p.likes_count - 1 : p.likes_count + 1 } : p))
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', userId)
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: userId })
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImagenFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagenPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function publicar() {
    if ((!nuevoTexto.trim() && !imagenFile) || !userId) return
    setPublicando(true)
    let image_url: string | undefined = undefined

    if (imagenFile) {
      const ext = imagenFile.name.split('.').pop()
      const filename = `${userId}_${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage.from('post-images').upload(filename, imagenFile, { upsert: true })
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(filename)
        image_url = urlData.publicUrl
      }
    }

    await supabase.from('posts').insert({ author_id: userId, content: nuevoTexto, image_url })
    setNuevoTexto('')
    setImagenPreview(null)
    setImagenFile(null)
    setShowNuevoPost(false)
    setPublicando(false)
    cargarPosts()
  }

  function cerrarModal() {
    setShowNuevoPost(false)
    setNuevoTexto('')
    setImagenPreview(null)
    setImagenFile(null)
  }

  const menuOpciones = [
    { icono: '✏️', label: 'Nueva publicación', sub: 'Comparte texto con la comunidad', action: () => { setShowMenu(false); setShowNuevoPost(true) } },
    { icono: '📸', label: 'Subir foto', sub: 'Comparte el progreso de tu hijo', action: () => { setShowMenu(false); setShowNuevoPost(true); setTimeout(() => fileInputRef.current?.click(), 300) } },
    { icono: '✅', label: 'Registrar rutina', sub: 'Marcar cepillado de hoy', action: () => { setShowMenu(false); router.push('/dashboard') } },
    { icono: '👶', label: 'Agregar hijo', sub: 'Nuevo perfil para otro niño', action: () => { setShowMenu(false); router.push('/agregar-hijo') } },
    { icono: '📅', label: 'Agendar cita dental', sub: 'Agendar cita dental', action: () => { setShowMenu(false); router.push('/dashboard/perfil') } },
  ]

  const postsVisibles = tab === 'mios' ? posts.filter(p => p.author_id === userId) :
    tab === 'popular' ? [...posts].sort((a,b) => b.likes_count - a.likes_count) : posts

  return (
    <div className="app-container">
      <Sparkles />

      {/* Modal nueva publicación */}
      {showNuevoPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 pb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-brand-800 text-lg">Nueva publicación</h3>
              <button onClick={cerrarModal} className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center">×</button>
            </div>

            {/* User info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center font-black text-brand-700">
                {getInitial(userName)}
              </div>
              <div>
                <p className="font-bold text-brand-800 text-sm">{userName}</p>
                <p className="text-brand-400 text-xs">Publicación pública</p>
              </div>
            </div>

            <textarea value={nuevoTexto} onChange={e => setNuevoTexto(e.target.value)}
              placeholder="¿Qué quieres compartir con la comunidad?" rows={3}
              className="input-field resize-none mb-3 text-sm" />

            {/* Image preview */}
            {imagenPreview && (
              <div className="relative mb-3">
                <img src={imagenPreview} alt="preview" className="w-full rounded-2xl object-cover max-h-48" />
                <button onClick={() => { setImagenPreview(null); setImagenFile(null) }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full text-white flex items-center justify-center text-lg">×</button>
              </div>
            )}

            {/* Actions row */}
            <div className="flex items-center gap-3 mb-4">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 font-semibold text-sm active:scale-95 transition-all">
                <span>📸</span> Foto
              </button>
              <p className="text-brand-300 text-xs flex-1">Comparte momentos</p>
            </div>

            <button onClick={publicar} disabled={(!nuevoTexto.trim() && !imagenFile) || publicando}
              className="btn-primary disabled:opacity-50">
              {publicando ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}

      {/* Menú + */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowMenu(false)}>
          <div ref={menuRef} className="w-full max-w-sm bg-white rounded-t-3xl p-4 pb-10" onClick={e => e.stopPropagation()}>
            {menuOpciones.map((op, i) => (
              <button key={i} onClick={op.action}
                className="w-full flex items-center gap-4 p-4 hover:bg-brand-50 rounded-2xl transition-all active:scale-95 text-left">
                <div className="w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center text-2xl">{op.icono}</div>
                <div>
                  <p className="font-black text-brand-800">{op.label}</p>
                  <p className="text-brand-500 text-xs">{op.sub}</p>
                </div>
              </button>
            ))}
            <button onClick={() => setShowMenu(false)} className="w-full mt-2 py-3 text-red-400 font-bold text-sm">Cancelar</button>
          </div>
        </div>
      )}

      <div className="page-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-brand-800">Nido</h1>
            <p className="text-brand-500 text-xs">Comparte y aprende con otros padres</p>
          </div>
          <button onClick={() => router.push('/notificaciones')}
            className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center relative">
            🔔
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">2</span>
          </button>
        </div>

        {/* Header card */}
        <div className="card bg-gradient-to-br from-brand-500 to-brand-600 text-white mb-4 py-3">
          <p className="font-black text-lg">Comunidad Sonrisas 🪺</p>
          <p className="text-white/80 text-xs">Comparte y aprende con otros padres</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-brand-50 rounded-2xl p-1">
          {(['recientes','popular','mios'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all capitalize ${tab === t ? 'bg-white text-brand-600 shadow-sm' : 'text-brand-400'}`}>
              {t === 'recientes' ? 'Recientes' : t === 'popular' ? 'Popular' : 'Mis posts'}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="flex flex-col gap-4 mb-4">
          {postsVisibles.length === 0 ? (
            <div className="text-center py-10 text-brand-400">
              <p className="text-4xl mb-2">🪺</p>
              <p className="font-semibold">Aún no hay publicaciones aquí</p>
              <p className="text-sm">¡Sé el primero en compartir!</p>
            </div>
          ) : postsVisibles.map(post => (
            <div key={post.id} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center font-black text-brand-700 text-base flex-shrink-0">
                  {getInitial(post.autor_nombre || 'U')}
                </div>
                <div className="flex-1">
                  <p className="font-black text-brand-800 text-sm">{post.autor_nombre || 'Usuario'}</p>
                  <p className="text-brand-400 text-xs">{timeAgo(post.created_at)}</p>
                </div>
              </div>
              {post.image_url && <img src={post.image_url} alt="" className="w-full rounded-2xl mb-3 object-cover max-h-48" />}
              <p className="text-brand-700 text-sm mb-3 leading-relaxed">{post.content}</p>
              <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                <button onClick={() => toggleLike(post)} className={`flex items-center gap-1.5 text-sm font-bold transition-all active:scale-95 ${post.liked ? 'text-red-500' : 'text-gray-400'}`}>
                  <span className="text-lg">{post.liked ? '❤️' : '🤍'}</span> {post.likes_count}
                </button>
                <button className="flex items-center gap-1.5 text-sm font-bold text-gray-400">
                  <span className="text-lg">💬</span> {post.comments_count || 0}
                </button>
                <button className="flex items-center gap-1.5 text-sm font-bold text-gray-400 ml-auto">
                  <span className="text-lg">📤</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB + */}
      <button onClick={() => setShowMenu(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl z-40 active:scale-95 transition-all hover:bg-brand-600">
        +
      </button>

      <BottomNav />
    </div>
  )
}
