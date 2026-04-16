'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/ui/BottomNav'
import Sparkles from '@/components/ui/Sparkles'
import SonrisasLogo from '@/components/ui/SonrisasLogo'

type Post = {
  id: string; author_id: string; content: string; image_url?: string
  likes_count: number; comments_count: number; created_at: string
  autor_nombre?: string; autor_avatar?: string; liked?: boolean
}

type Comentario = {
  id: string; post_id: string; author_id: string; content: string; created_at: string
  autor_nombre?: string; es_especialista?: boolean
}

const POSTS_DEMO: Post[] = [
  { id: '1', author_id: 'demo1', content: 'Primera visita al dentista, ¡todo un éxito! María no lloró nada 💪', likes_count: 24, comments_count: 3, created_at: new Date(Date.now()-3600000).toISOString(), autor_nombre: '@maria_mama', autor_avatar: '👩' },
  { id: '2', author_id: 'demo2', content: '¿Qué cepillo recomiendan? ¡A qué dentista van?', likes_count: 8, comments_count: 5, created_at: new Date(Date.now()-18000000).toISOString(), autor_nombre: '@papa_lucas', autor_avatar: '👨' },
  { id: '3', author_id: 'demo3', content: 'Mi hijo odio el cepillo. ¿Algún consejo para motivarlo? 😅', likes_count: 35, comments_count: 8, created_at: new Date(Date.now()-86400000*5).toISOString(), autor_nombre: '@papa_lucas', autor_avatar: '👨🏽' },
]

const COMENTARIOS_DEMO: Record<string, Comentario[]> = {
  '3': [
    { id: 'c1', post_id: '3', author_id: 'dra', content: 'Consejo profesional: deja que él elija su cepillo en la tienda. Tener protagonismo en la decisión aumenta mucho la motivación. También puedes cepillarte tú al mismo tiempo para que te imite 🪥', created_at: new Date(Date.now()-30000).toISOString(), autor_nombre: '@dra_sonrisas', es_especialista: true },
    { id: 'c2', post_id: '3', author_id: 'u2', content: 'Nosotros usamos un cepillo con luz que parpadea 3 minuto. Al principio le daba igual pero ahora pide cepillarse él solo 😄', created_at: new Date(Date.now()-3600000).toISOString(), autor_nombre: '@padresunidos' },
    { id: 'c3', post_id: '3', author_id: 'u3', content: 'Programas de recompensa. Cada noche que se cepilla sin llorar pone una estrella en el calendario. Al llegar a 7 tiene un pequeño premio ⭐', created_at: new Date(Date.now()-7200000).toISOString(), autor_nombre: '@lucia_z' },
  ],
  '1': [
    { id: 'c4', post_id: '1', author_id: 'u4', content: '¡Qué bien! La primera vez siempre da nervios. ¿Con qué dentista fuisteis?', created_at: new Date(Date.now()-1800000).toISOString(), autor_nombre: '@mama_carla' },
  ],
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  if (diff < 60000) return `${Math.floor(diff/1000)}s`
  if (diff < 3600000) return `Hace ${Math.floor(diff/60000)} min`
  if (diff < 86400000) return `Hace ${Math.floor(diff/3600000)} h`
  return `Hace ${Math.floor(diff/86400000)} días`
}

function getInitial(name: string) {
  return name ? name.replace('@','').charAt(0).toUpperCase() : '?'
}

function AvatarCircle({ name, emoji, size = 'md' }: { name?: string; emoji?: string; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-lg'
  if (emoji) return <div className={`${sz} rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0`}>{emoji}</div>
  return <div className={`${sz} rounded-full bg-brand-200 flex items-center justify-center font-black text-brand-700 flex-shrink-0`}>{getInitial(name || 'U')}</div>
}

// ─── Vista Comentarios ─────────────────────────────────────
function VistaComentarios({ post, onBack, userId }: { post: Post; onBack: () => void; userId: string | null }) {
  const [tabComents, setTabComents] = useState<'principales'|'ultimo'|'mio'>('principales')
  const [comentarios, setComentarios] = useState<Comentario[]>(COMENTARIOS_DEMO[post.id] || [])
  const [nuevoComent, setNuevoComent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  async function enviarComentario() {
    if (!nuevoComent.trim() || !userId) return
    const c: Comentario = {
      id: Date.now().toString(), post_id: post.id, author_id: userId,
      content: nuevoComent, created_at: new Date().toISOString(), autor_nombre: 'Tú'
    }
    await supabase.from('comentarios').insert({ post_id: post.id, author_id: userId, content: nuevoComent })
    setComentarios(prev => [...prev, c])
    setNuevoComent('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const comentsFiltrados = tabComents === 'mio' ? comentarios.filter(c => c.author_id === userId) :
    tabComents === 'ultimo' ? [...comentarios].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) :
    comentarios

  return (
    <div className="app-container flex flex-col">
      <Sparkles />
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-white/80 backdrop-blur border-b border-brand-100 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <SonrisasLogo size={32} />
        <h2 className="font-black text-brand-800 text-lg flex-1">Nido</h2>
        <button className="w-9 h-9 bg-brand-50 rounded-full flex items-center justify-center text-brand-500">🔖</button>
        <button className="w-9 h-9 bg-brand-50 rounded-full flex items-center justify-center text-brand-500">🔔</button>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {/* Post */}
        <div className="mx-4 mt-4 bg-white rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <AvatarCircle name={post.autor_nombre} emoji={post.autor_avatar} />
            <div className="flex-1">
              <p className="font-black text-brand-800 text-sm">{post.autor_nombre || 'Usuario'}</p>
              <p className="text-brand-400 text-xs">{timeAgo(post.created_at)}</p>
            </div>
          </div>
          <p className="text-brand-700 text-sm leading-relaxed mb-3">{post.content}</p>
          {post.image_url && <img src={post.image_url} alt="" className="w-full rounded-2xl mb-3 object-cover max-h-48" />}
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
            <span className="flex items-center gap-1.5 text-sm text-red-400 font-bold">❤️ {post.likes_count}</span>
            <span className="flex items-center gap-1.5 text-sm text-brand-400 font-bold">💬 {comentarios.length}</span>
            <button className="ml-auto text-brand-300"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-4 mt-3 flex gap-1 bg-brand-50 rounded-2xl p-1">
          {([['principales','Principales'],['ultimo','Último'],['mio','Mío']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setTabComents(val)}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${tabComents === val ? 'bg-white text-brand-600 shadow-sm' : 'text-brand-400'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-gray-400 text-[10px] mt-2 px-4 flex items-center justify-center gap-1">
          <span>ℹ️</span> No se comprueba la veracidad médica de las respuestas
        </p>

        {/* Comentarios */}
        <div className="px-4 mt-3 flex flex-col gap-3">
          {comentsFiltrados.length === 0 ? (
            <div className="text-center py-8 text-brand-400">
              <p className="text-3xl mb-2">💬</p>
              <p className="font-semibold text-sm">Sin comentarios aún</p>
              <p className="text-xs">¡Sé el primero en responder!</p>
            </div>
          ) : comentsFiltrados.map(c => (
            <div key={c.id} className={`rounded-2xl p-4 ${c.es_especialista ? 'bg-green-50 border border-green-200' : 'bg-white shadow-sm'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AvatarCircle name={c.autor_nombre} size="sm" />
                  <span className="font-black text-brand-800 text-xs">{c.autor_nombre}</span>
                  {c.es_especialista && <span className="bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Especialista</span>}
                </div>
                <span className="text-gray-300 text-[10px]">{timeAgo(c.created_at)}</span>
              </div>
              <p className="text-brand-700 text-sm leading-relaxed">{c.content}</p>
              <div className="flex gap-3 mt-2 text-gray-300">
                <button className="text-xs flex items-center gap-1">👍</button>
                <button className="text-xs flex items-center gap-1">👎</button>
                <button className="text-xs flex items-center gap-1">↩️</button>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input comentario */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 pb-2">
        <div className="flex gap-2 items-center bg-white rounded-2xl shadow-card px-3 py-2 border border-brand-100">
          <span className="text-gray-300 text-lg">📷</span>
          <input value={nuevoComent} onChange={e => setNuevoComent(e.target.value)}
            placeholder="Responde un comentario..."
            className="flex-1 outline-none text-brand-700 text-sm placeholder-gray-300"
            onKeyDown={e => e.key === 'Enter' && enviarComentario()} />
          <button onClick={enviarComentario} disabled={!nuevoComent.trim()}
            className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

// ─── Página Principal Nido ─────────────────────────────────
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
  const [postAbierto, setPostAbierto] = useState<Post | null>(null)
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
      image_url = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(imagenFile)
      })
    }
    await supabase.from('posts').insert({ author_id: userId, content: nuevoTexto, image_url })
    setNuevoTexto(''); setImagenPreview(null); setImagenFile(null); setShowNuevoPost(false); setPublicando(false)
    cargarPosts()
  }

  if (postAbierto) return <VistaComentarios post={postAbierto} onBack={() => setPostAbierto(null)} userId={userId} />

  const postsVisibles = tab === 'mios' ? posts.filter(p => p.author_id === userId) :
    tab === 'popular' ? [...posts].sort((a,b) => b.likes_count - a.likes_count) : posts

  const menuOpciones = [
    { icono: '✏️', label: 'Nueva publicación', sub: 'Comparte texto o foto en Comunidad', action: () => { setShowMenu(false); setShowNuevoPost(true) } },
    { icono: '📸', label: 'Subir foto', sub: 'Comparte el progreso de tu hijo', action: () => { setShowMenu(false); setShowNuevoPost(true); setTimeout(() => fileInputRef.current?.click(), 300) } },
    { icono: '✅', label: 'Registrar rutina', sub: 'Marcar cepillado de hoy', action: () => { setShowMenu(false); router.push('/dashboard') } },
    { icono: '👶', label: 'Agregar hijo', sub: 'Nuevo perfil para otro niño', action: () => { setShowMenu(false); router.push('/agregar-hijo') } },
    { icono: '📅', label: 'Agendar cita dental', sub: 'Agendar cita dental', action: () => { setShowMenu(false); router.push('/dashboard/perfil') } },
  ]

  return (
    <div className="app-container">
      <Sparkles />

      {/* Modal nueva publicación */}
      {showNuevoPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 pb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-brand-800 text-lg">Nueva publicación</h3>
              <button onClick={() => { setShowNuevoPost(false); setNuevoTexto(''); setImagenPreview(null); setImagenFile(null) }} className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center">×</button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center font-black text-brand-700">{getInitial(userName)}</div>
              <div><p className="font-bold text-brand-800 text-sm">{userName}</p><p className="text-brand-400 text-xs">Publicación pública</p></div>
            </div>
            <textarea value={nuevoTexto} onChange={e => setNuevoTexto(e.target.value)}
              placeholder="¿Qué quieres compartir con la comunidad?" rows={3}
              className="input-field resize-none mb-3 text-sm" />
            {imagenPreview && (
              <div className="relative mb-3">
                <img src={imagenPreview} alt="preview" className="w-full rounded-2xl object-cover max-h-48" />
                <button onClick={() => { setImagenPreview(null); setImagenFile(null) }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full text-white flex items-center justify-center text-lg">×</button>
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 font-semibold text-sm active:scale-95 transition-all">
                <span>📸</span> Foto
              </button>
              <p className="text-brand-300 text-xs flex-1">Comparte momentos</p>
            </div>
            <button onClick={publicar} disabled={(!nuevoTexto.trim() && !imagenFile) || publicando} className="btn-primary disabled:opacity-50">
              {publicando ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}

      {/* Menú + */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowMenu(false)}>
          <div className="w-full max-w-sm bg-white rounded-t-3xl p-4 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            {menuOpciones.map((op, i) => (
              <button key={i} onClick={op.action}
                className="w-full flex items-center gap-4 p-3.5 hover:bg-brand-50 rounded-2xl transition-all active:scale-95 text-left">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-2xl">{op.icono}</div>
                <div>
                  <p className="font-black text-brand-800 text-sm">{op.label}</p>
                  <p className="text-brand-400 text-xs">{op.sub}</p>
                </div>
              </button>
            ))}
            <button onClick={() => setShowMenu(false)} className="w-full mt-3 py-3 text-red-400 font-bold text-sm">Cancelar</button>
          </div>
        </div>
      )}

      <div className="page-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SonrisasLogo size={36} />
            <h1 className="text-2xl font-black text-brand-800">Nido</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/notificaciones')}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm relative">
              🔔
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">2</span>
            </button>
            <button onClick={() => setShowMenu(true)}
              className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white text-xl shadow-sm">+</button>
          </div>
        </div>

        {/* Comunidad card */}
        <div className="card bg-gradient-to-br from-brand-500 to-brand-600 text-white mb-4 py-3">
          <p className="font-black text-lg">Comunidad Sonrisas 🪺</p>
          <p className="text-white/80 text-xs">Comparte y aprende con otros padres</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-brand-50 rounded-2xl p-1">
          {(['recientes','popular','mios'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${tab === t ? 'bg-white text-brand-600 shadow-sm' : 'text-brand-400'}`}>
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
                <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center font-black text-brand-700 text-lg flex-shrink-0">
                  {post.autor_avatar || getInitial(post.autor_nombre || 'U')}
                </div>
                <div className="flex-1">
                  <p className="font-black text-brand-800 text-sm">{post.autor_nombre || 'Usuario'}</p>
                  <p className="text-brand-400 text-xs">{timeAgo(post.created_at)}</p>
                </div>
              </div>
              <p className="text-brand-700 text-sm mb-3 leading-relaxed">{post.content}</p>
              {post.image_url && <img src={post.image_url} alt="" className="w-full rounded-2xl mb-3 object-cover max-h-48" />}
              <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                <button onClick={() => toggleLike(post)} className={`flex items-center gap-1.5 text-sm font-bold transition-all active:scale-95 ${post.liked ? 'text-red-500' : 'text-gray-400'}`}>
                  <span className="text-lg">{post.liked ? '❤️' : '🤍'}</span> {post.likes_count}
                </button>
                <button onClick={() => setPostAbierto(post)} className="flex items-center gap-1.5 text-sm font-bold text-gray-400 active:scale-95">
                  <span className="text-lg">💬</span> {post.comments_count || 0}
                </button>
                <button className="flex items-center gap-1.5 text-sm font-bold text-gray-400 ml-auto active:scale-95">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
