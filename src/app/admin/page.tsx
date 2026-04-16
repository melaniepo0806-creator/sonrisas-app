'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Stats = {
  totalUsers: number
  totalHijos: number
  totalArticulos: number
  totalPosts: number
  subsActivas: number
  nuevosHoy: number
}

export default function AdminHome() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [ultimos, setUltimos] = useState<{id: string; nombre_completo: string | null; username: string | null; created_at: string}[]>([])

  useEffect(() => {
    async function load() {
      const hoy = new Date(); hoy.setHours(0,0,0,0)
      const hoyIso = hoy.toISOString()
      const [users, hijos, arts, posts, subs, hoyUsers, ult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('hijos').select('id', { count: 'exact', head: true }),
        supabase.from('articulos').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('suscripciones').select('id', { count: 'exact', head: true }).eq('estado','activa'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', hoyIso),
        supabase.from('profiles').select('id, nombre_completo, username, created_at').order('created_at', { ascending: false }).limit(6),
      ])
      setStats({
        totalUsers: users.count || 0,
        totalHijos: hijos.count || 0,
        totalArticulos: arts.count || 0,
        totalPosts: posts.count || 0,
        subsActivas: subs.count || 0,
        nuevosHoy: hoyUsers.count || 0,
      })
      setUltimos(ult.data || [])
    }
    load()
  }, [])

  const cards = [
    { label: 'Usuarios',      value: stats?.totalUsers,      sub: `+${stats?.nuevosHoy ?? 0} hoy`, href: '/admin/usuarios',      color: 'from-blue-500 to-blue-600' },
    { label: 'Bebés',         value: stats?.totalHijos,      sub: 'perfiles registrados',          href: '/admin/usuarios',      color: 'from-pink-500 to-pink-600' },
    { label: 'Artículos',     value: stats?.totalArticulos,  sub: 'en la guía',                    href: '/admin/articulos',     color: 'from-green-500 to-green-600' },
    { label: 'Posts Nido',    value: stats?.totalPosts,      sub: 'publicaciones',                 href: '/admin/comunidad',     color: 'from-purple-500 to-purple-600' },
    { label: 'Suscripciones', value: stats?.subsActivas,     sub: 'planes activos',                href: '/admin/suscripciones', color: 'from-yellow-500 to-yellow-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-1">Resumen</h1>
      <p className="text-gray-500 text-sm mb-6">Vista general de Sonrisas.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {cards.map(c => (
          <Link key={c.label} href={c.href}
            className={`rounded-2xl p-4 text-white shadow-sm bg-gradient-to-br ${c.color} hover:scale-[1.02] transition-transform`}>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">{c.label}</p>
            <p className="text-3xl font-black mt-1">{c.value ?? '—'}</p>
            <p className="text-white/70 text-xs mt-1">{c.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-800">Últimos registros</h2>
            <Link href="/admin/usuarios" className="text-brand-500 text-xs font-bold">Ver todos →</Link>
          </div>
          {ultimos.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Aún no hay usuarios registrados.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {ultimos.map(u => (
                <li key={u.id} className="py-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{u.nombre_completo || 'Sin nombre'}</p>
                    <p className="text-xs text-gray-400 truncate">{u.username ? `@${u.username}` : u.id.slice(0,8)}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('es-ES', { day:'2-digit', month:'short' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="font-black text-gray-800 mb-3">Accesos rápidos</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '+ Nuevo artículo', href: '/admin/articulos?new=1', icon: '✍️' },
              { label: 'Gestionar planes', href: '/admin/suscripciones', icon: '💎' },
              { label: 'Editar colores',  href: '/admin/visual',         icon: '🎨' },
              { label: 'Moderar Nido',    href: '/admin/comunidad',      icon: '🛡️' },
            ].map(x => (
              <Link key={x.label} href={x.href}
                className="rounded-xl p-3 bg-gray-50 hover:bg-brand-50 transition-colors text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>{x.icon}</span>{x.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
