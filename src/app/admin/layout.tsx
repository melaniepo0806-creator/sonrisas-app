'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const NAV = [
  { href: '/admin',               label: 'Resumen',       icon: '📊' },
  { href: '/admin/articulos',     label: 'Contenido',     icon: '📚' },
  { href: '/admin/usuarios',      label: 'Usuarios',      icon: '👥' },
  { href: '/admin/suscripciones', label: 'Suscripciones', icon: '💎' },
  { href: '/admin/comunidad',     label: 'Comunidad',     icon: '💬' },
  { href: '/admin/visual',        label: 'Visual',        icon: '🎨' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<'checking' | 'denied' | 'ok'>('checking')
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login?redirect=/admin'); return }
      const { data } = await supabase
        .from('profiles')
        .select('role, nombre_completo')
        .eq('id', user.id)
        .single()
      if (!data || !['admin','super_admin'].includes(data.role || '')) {
        setState('denied')
        return
      }
      setNombre(data.nombre_completo || user.email || 'Admin')
      setState('ok')
    }
    check()
  }, [router])

  if (state === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Comprobando permisos…</p>
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-sm text-center bg-white rounded-3xl shadow-lg p-8">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-xl font-black text-gray-800 mb-2">Sin acceso</h1>
          <p className="text-gray-500 text-sm mb-5">
            Esta sección es sólo para administradores. Si deberías tener acceso, pide que te promuevan en Supabase.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-brand-500 text-white font-bold py-3 rounded-2xl"
          >
            Volver a la app
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          <Link href="/admin" className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0">🦷</span>
            <span className="font-black text-gray-800 text-sm sm:text-base truncate">Sonrisas Admin</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/dashboard" className="text-xs text-gray-500 hover:text-brand-600 font-semibold">
              ↗ <span className="hidden sm:inline">Ver app</span>
            </Link>
            <span className="text-xs text-gray-300 hidden sm:inline">|</span>
            <span className="text-sm text-gray-700 font-semibold hidden md:inline max-w-[180px] truncate">{nombre}</span>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
              className="text-xs text-gray-400 hover:text-red-500 font-semibold"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Mobile/tablet nav tabs — visible solo < lg */}
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <ul className="max-w-7xl mx-auto flex gap-1 overflow-x-auto px-3 sm:px-6 py-2 scrollbar-hide">
            {NAV.map(item => {
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition
                      ${active ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
        {/* Sidebar — solo lg+ */}
        <nav className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
          <ul className="flex flex-col gap-1">
            {NAV.map(item => {
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition
                      ${active ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-600 hover:bg-white hover:text-brand-700'}`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}
