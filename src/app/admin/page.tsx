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
  consultasPendientes: number
}

type StatCard = {
  label: string
  value: number | undefined
  sub: string
  href: string
  icon: string
  gradient: string
  iconBg: string
}

export default function AdminHome() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [ultimos, setUltimos] = useState<{id: string; nombre_completo: string | null; username: string | null; created_at: string}[]>([])
  const [nombre, setNombre] = useState('Admin')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('nombre_completo')
          .eq('id', user.id)
          .single()
        if (prof?.nombre_completo) {
          const first = prof.nombre_completo.split(' ')[0]
          setNombre(first)
        }
      }

      const hoy = new Date(); hoy.setHours(0,0,0,0)
      const hoyIso = hoy.toISOString()
      const [users, hijos, arts, posts, subs, hoyUsers, consPend, ult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('hijos').select('id', { count: 'exact', head: true }),
        supabase.from('articulos').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('suscripciones').select('id', { count: 'exact', head: true }).eq('estado','activa'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', hoyIso),
        supabase.from('consultas').select('id', { count: 'exact', head: true }).eq('estado','pendiente'),
        supabase.from('profiles').select('id, nombre_completo, username, created_at').order('created_at', { ascending: false }).limit(6),
      ])
      setStats({
        totalUsers: users.count || 0,
        totalHijos: hijos.count || 0,
        totalArticulos: arts.count || 0,
        totalPosts: posts.count || 0,
        subsActivas: subs.count || 0,
        nuevosHoy: hoyUsers.count || 0,
        consultasPendientes: consPend.count || 0,
      })
      setUltimos(ult.data || [])
    }
    load()
  }, [])

  const cards: StatCard[] = [
    { label: 'Usuarios',      value: stats?.totalUsers,     sub: `+${stats?.nuevosHoy ?? 0} hoy`,  href: '/admin/usuarios',      icon: '👥', gradient: 'from-sky-400 via-sky-500 to-blue-600',           iconBg: 'bg-sky-300/30' },
    { label: 'Bebés',         value: stats?.totalHijos,     sub: 'perfiles registrados',           href: '/admin/usuarios',      icon: '🍼', gradient: 'from-pink-400 via-pink-500 to-rose-500',         iconBg: 'bg-pink-300/30' },
    { label: 'Artículos',     value: stats?.totalArticulos, sub: 'en la guía',                     href: '/admin/articulos',     icon: '📚', gradient: 'from-emerald-400 via-emerald-500 to-green-600',  iconBg: 'bg-emerald-300/30' },
    { label: 'Posts Nido',    value: stats?.totalPosts,     sub: 'publicaciones',                  href: '/admin/comunidad',     icon: '💬', gradient: 'from-violet-400 via-purple-500 to-fuchsia-500',  iconBg: 'bg-violet-300/30' },
    { label: 'Suscripciones', value: stats?.subsActivas,    sub: 'planes activos',                 href: '/admin/suscripciones', icon: '💎', gradient: 'from-amber-400 via-orange-500 to-orange-600',    iconBg: 'bg-amber-300/30' },
  ]

  const quickActions: { label: string; href: string; icon: string; badge?: number }[] = [
    { label: 'Responder consultas', href: '/admin/consultas',        icon: '💬', badge: stats?.consultasPendientes || 0 },
    { label: 'Nuevo artículo',      href: '/admin/articulos?new=1',  icon: '✍️' },
    { label: 'Editar consejos',     href: '/admin/articulos',        icon: '💡' },
    { label: 'Gestionar planes',    href: '/admin/suscripciones',    icon: '💎' },
    { label: 'Personalizar visual', href: '/admin/visual',           icon: '🎨' },
    { label: 'Moderar Nido',        href: '/admin/comunidad',        icon: '🛡️' },
  ]

  return (
    <div>
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-blue-600 p-5 sm:p-7 mb-5 sm:mb-7 shadow-lg">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-8 w-44 h-44 bg-white/5 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-white/80 text-xs sm:text-sm font-semibold tracking-wide uppercase">Panel de control</p>
          <h1 className="text-white text-2xl sm:text-3xl font-black mt-1">¡Hola, {nombre}! 👋</h1>
          <p className="text-white/85 text-sm sm:text-base mt-1.5 max-w-xl">
            Aquí tienes la vista general de Sonrisas. {stats?.consultasPendientes ? (
              <span className="font-bold">Hay {stats.consultasPendientes} consulta{stats.consultasPendientes === 1 ? '' : 's'} esperando respuesta.</span>
            ) : 'Todo está al día. ✨'}
          </p>
          {!!stats?.consultasPendientes && (
            <Link
              href="/admin/consultas"
              className="inline-flex items-center gap-2 mt-4 bg-white text-brand-700 font-bold text-sm px-4 py-2 rounded-xl shadow-sm hover:scale-[1.02] transition-transform"
            >
              💬 Ver consultas pendientes →
            </Link>
          )}
        </div>
      </div>

      {/* 5 gradient stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 mb-6 sm:mb-8">
        {cards.map(c => (
          <Link
            key={c.label}
            href={c.href}
            className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white shadow-md bg-gradient-to-br ${c.gradient} hover:shadow-xl hover:-translate-y-0.5 transition-all min-w-0`}
          >
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-colors" />
            <div className="relative">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${c.iconBg} text-lg mb-2`}>
                {c.icon}
              </div>
              <p className="text-white/85 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">{c.label}</p>
              <p className="text-3xl sm:text-4xl font-black mt-1 leading-none">{c.value ?? '—'}</p>
              <p className="text-white/75 text-[10px] sm:text-xs mt-1.5 truncate">{c.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Two-panel grid: Últimos registros + Accesos rápidos */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-5">
        {/* Últimos registros — 3 cols */}
        <div className="xl:col-span-3 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="min-w-0">
              <h2 className="font-black text-gray-800 text-base">Últimos registros</h2>
              <p className="text-xs text-gray-400 mt-0.5">Padres recién unidos a Sonrisas</p>
            </div>
            <Link href="/admin/usuarios" className="text-brand-500 text-xs font-bold whitespace-nowrap hover:underline">Ver todos →</Link>
          </div>
          {ultimos.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aún no hay usuarios registrados.</p>
          ) : (
            <ul className="space-y-1">
              {ultimos.map(u => {
                const ini = (u.nombre_completo || u.username || '?').slice(0,1).toUpperCase()
                return (
                  <li key={u.id} className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white font-black flex items-center justify-center text-sm shrink-0">
                      {ini}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 truncate">{u.nombre_completo || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-400 truncate">{u.username ? `@${u.username}` : u.id.slice(0,8)}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 font-semibold">
                      {new Date(u.created_at).toLocaleDateString('es-ES', { day:'2-digit', month:'short' })}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Accesos rápidos — 2 cols */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-black text-gray-800 text-base mb-1">Accesos rápidos</h2>
          <p className="text-xs text-gray-400 mb-4">Las acciones más frecuentes</p>
          <div className="grid grid-cols-1 gap-2">
            {quickActions.map(x => (
              <Link
                key={x.label}
                href={x.href}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-brand-50 transition-colors min-w-0"
              >
                <span className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-base shrink-0 group-hover:scale-110 transition-transform">{x.icon}</span>
                <span className="text-sm font-semibold text-gray-700 truncate flex-1">{x.label}</span>
                {!!x.badge && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                    {x.badge}
                  </span>
                )}
                <span className="text-gray-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
