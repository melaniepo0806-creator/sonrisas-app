'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const menuItems = [
  { icon: '👶', label: 'Mis hijos', href: '/agregar-hijo', desc: 'Gestiona los perfiles de tus hijos' },
  { icon: '📅', label: 'Mis citas', href: '/agendar-cita', desc: 'Ver y agendar citas dentales' },
  { icon: '🔔', label: 'Notificaciones', href: '/notificaciones', desc: 'Gestiona tus alertas' },
  { icon: '⚙️', label: 'Configuración', href: '/configuracion', desc: 'Cuenta y preferencias' },
  { icon: '❓', label: 'Ayuda', href: '/dashboard/faq', desc: 'Centro de ayuda y FAQ' },
]

export default function PerfilPage() {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="relative min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black text-brand-800">Perfil</h1>
        <Link href="/configuracion">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5zm7.43-2.47c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81a.47.47 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41L9.25 5.35c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.04.34-.07.67-.07 1s.03.65.07.97l-2.03 1.6a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.6z"
              fill="#9CA3AF"/>
          </svg>
        </Link>
      </div>

      {/* Avatar + info */}
      <div className="flex flex-col items-center px-5 mb-6">
        <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center text-5xl shadow-card mb-3">
          👩
        </div>
        <h2 className="text-xl font-black text-brand-800">Lucía García</h2>
        <p className="text-brand-400 text-sm">lucia@email.com</p>
        <button className="mt-3 px-6 py-2 rounded-2xl border-2 border-brand-300 text-brand-600
                           font-semibold text-sm hover:bg-brand-50 transition-all">
          Editar perfil
        </button>
      </div>

      {/* Hijos card */}
      <div className="mx-5 card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-brand-800 font-black">Mis hijos</h3>
          <Link href="/agregar-hijo" className="text-brand-500 text-sm font-semibold">+ Agregar</Link>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-brand-50 rounded-2xl px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-200 flex items-center justify-center text-lg">👶</div>
            <div>
              <p className="text-brand-800 font-bold text-xs">Mateo</p>
              <p className="text-brand-400 text-[10px]">14 meses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-5 grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Rutinas', value: '48', icon: '🪥' },
          { label: 'Posts', value: '7', icon: '💬' },
          { label: 'Citas', value: '3', icon: '📅' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-brand-800 font-black text-lg">{s.value}</p>
            <p className="text-brand-400 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="mx-5 space-y-2">
        {menuItems.map(item => (
          <Link key={item.href} href={item.href}
            className="card flex items-center gap-3 hover:bg-brand-50 transition-all active:scale-[0.98]">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
              {item.icon}
            </div>
            <div className="flex-1">
              <p className="text-brand-800 font-bold text-sm">{item.label}</p>
              <p className="text-brand-400 text-xs">{item.desc}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="mx-5 mt-4">
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
                     text-red-500 font-bold bg-red-50 hover:bg-red-100 transition-all">
          <span>🚪</span> Cerrar sesión
        </button>
      </div>
    </div>
  )
}
