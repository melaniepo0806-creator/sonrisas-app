'use client'
import { useState } from 'react'
import Link from 'next/link'

const posts = [
  {
    id: 1,
    user: '@maria_mama',
    avatar: '👩',
    time: 'Hace 1 hora',
    text: 'Primera visita al dentista, ¡todo un éxito! María no lloró nada 💪',
    image: null,
    likes: 24,
    comments: 3,
    liked: false,
  },
  {
    id: 2,
    user: '@papa_lucas',
    avatar: '👨',
    time: 'Hace 3 horas',
    text: '¿Qué dentista ver? ¡A qué dentista ir?\n\n¡Lucas va a llegar en el cuento del dentista!',
    image: null,
    likes: 8,
    comments: 5,
    liked: false,
  },
  {
    id: 3,
    user: '@papa_lucas',
    avatar: '👨',
    time: 'Hace 5 horas',
    text: 'Mi hijo odió el cepillo 😅 ¿Algún consejo para motivarlo?',
    image: null,
    likes: 31,
    comments: 12,
    liked: false,
  },
]

type Post = typeof posts[0]

export default function NidoPage() {
  const [feed, setFeed] = useState<Post[]>(posts)
  const [tab, setTab] = useState<'recientes' | 'popular' | 'mis'>('recientes')

  function toggleLike(id: number) {
    setFeed(prev => prev.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ))
  }

  return (
    <div className="relative min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <h1 className="text-2xl font-black text-brand-800">Nido</h1>
        <Link href="/nueva-publicacion"
          className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center shadow-card">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </Link>
      </div>

      {/* Banner */}
      <div className="mx-5 card bg-gradient-to-r from-brand-500 to-brand-600 text-white mb-4">
        <p className="font-black text-base">Comunidad</p>
        <p className="text-white/80 text-xs">Comparte y aprende con otros padres</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 mb-4">
        {(['recientes', 'popular', 'mis'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-2xl text-sm font-bold capitalize transition-all
              ${tab === t ? 'bg-brand-500 text-white' : 'bg-white text-brand-500 border-2 border-brand-200'}`}
          >
            {t === 'mis' ? 'Mis posts' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="px-5 space-y-3">
        {feed.map(post => (
          <div key={post.id} className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-xl">
                {post.avatar}
              </div>
              <div>
                <p className="text-brand-700 font-bold text-sm">{post.user}</p>
                <p className="text-brand-400 text-xs">{post.time}</p>
              </div>
              <button className="ml-auto">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="5" cy="12" r="1.5" fill="#9CA3AF"/>
                  <circle cx="12" cy="12" r="1.5" fill="#9CA3AF"/>
                  <circle cx="19" cy="12" r="1.5" fill="#9CA3AF"/>
                </svg>
              </button>
            </div>
            <p className="text-brand-700 text-sm leading-relaxed mb-3 whitespace-pre-line">
              {post.text}
            </p>
            <div className="flex items-center gap-4 pt-2 border-t border-brand-50">
              <button
                onClick={() => toggleLike(post.id)}
                className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
              >
                <span className={`text-base transition-transform ${post.liked ? 'scale-125' : ''}`}>
                  {post.liked ? '❤️' : '🤍'}
                </span>
                <span className={post.liked ? 'text-red-500' : 'text-brand-400'}>
                  {post.likes}
                </span>
              </button>
              <button className="flex items-center gap-1.5 text-brand-400 text-sm font-semibold">
                <span>💬</span>
                <span>{post.comments}</span>
              </button>
              <button className="flex items-center gap-1.5 text-brand-400 text-sm font-semibold ml-auto">
                <span>↗️</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <Link href="/nueva-publicacion"
        className="fixed bottom-24 right-6 w-14 h-14 bg-brand-500 rounded-full shadow-lg
                   flex items-center justify-center z-40 hover:bg-brand-600 active:scale-95 transition-all">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </Link>
    </div>
  )
}
