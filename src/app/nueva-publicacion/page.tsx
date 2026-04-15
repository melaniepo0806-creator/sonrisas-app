'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NuevaPublicacionPage() {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)

  async function handlePublicar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('posts').insert({
        author_id: user.id,
        content: texto,
      })
    }
    setLoading(false)
    router.push('/dashboard/nido')
  }

  return (
    <div className="relative min-h-screen px-5 pt-12 pb-10">
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/nido" className="text-brand-500 font-semibold flex items-center gap-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Cancelar
        </Link>
        <h1 className="text-lg font-black text-brand-800">Nueva publicación</h1>
        <div className="w-16"/>
      </div>

      <form onSubmit={handlePublicar}>
        <div className="card mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-xl">👩</div>
            <div>
              <p className="text-brand-800 font-bold text-sm">Lucía García</p>
              <div className="flex items-center gap-1 bg-brand-50 rounded-lg px-2 py-0.5">
                <span className="text-xs">🌍</span>
                <span className="text-brand-500 text-xs font-semibold">Público</span>
              </div>
            </div>
          </div>
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="¿Qué quieres compartir con la comunidad?"
            className="w-full outline-none text-brand-700 text-sm leading-relaxed resize-none min-h-[140px] placeholder-brand-300"
            autoFocus
          />
        </div>

        {/* Opciones adicionales */}
        <div className="flex gap-3 mb-6">
          <button type="button" className="flex-1 card flex items-center justify-center gap-2 py-3 text-brand-500 font-semibold text-sm hover:bg-brand-50">
            <span>📷</span> Foto
          </button>
          <button type="button" className="flex-1 card flex items-center justify-center gap-2 py-3 text-brand-500 font-semibold text-sm hover:bg-brand-50">
            <span>🏷️</span> Etiqueta
          </button>
        </div>

        <button type="submit" className="btn-primary" disabled={!texto.trim() || loading}>
          {loading ? 'Publicando...' : 'Publicar'}
        </button>
      </form>
    </div>
  )
}
