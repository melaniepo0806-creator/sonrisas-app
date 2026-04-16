'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sparkles from '@/components/ui/Sparkles'

type Notif = {
  id: number; icon: string; iconBg: string
  titulo: string; desc: string; time: string
  leida: boolean; ruta: string
}

const NOTIFS_INIT: Notif[] = [
  { id:1, icon:'🪥', iconBg:'bg-brand-100', titulo:'Hora del cepillado', desc:'Es momento del cepillado de la noche de Mateo', time:'Hace 2 min', leida:false, ruta:'/dashboard' },
  { id:2, icon:'📅', iconBg:'bg-blue-100',  titulo:'Cita mañana', desc:'Recuerda que tienes cita dental con Mateo mañana a las 10:30', time:'Hace 1 hora', leida:false, ruta:'/dashboard/perfil' },
  { id:3, icon:'⭐', iconBg:'bg-yellow-100', titulo:'Nuevo consejo disponible', desc:'¿Sabías que el flúor fortalece el esmalte desde los primeros dientes?', time:'Hace 3 horas', leida:true, ruta:'/dashboard/guias' },
  { id:4, icon:'💬', iconBg:'bg-green-100',  titulo:'Nueva respuesta en el Nido', desc:'@mama_garcia respondió a tu publicación', time:'Hace 5 horas', leida:true, ruta:'/dashboard/nido' },
  { id:5, icon:'🦷', iconBg:'bg-purple-100', titulo:'Nuevo contenido en Guías', desc:'Etapa 2-3 años: nuevas recomendaciones disponibles', time:'Ayer', leida:true, ruta:'/dashboard/guias' },
]

export default function NotificacionesPage() {
  const router = useRouter()
  const [notifs, setNotifs] = useState<Notif[]>(NOTIFS_INIT)

  function marcarLeida(id: number, ruta: string) {
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, leida: true } : n))
    router.push(ruta)
  }

  function marcarTodasLeidas() {
    setNotifs(ns => ns.map(n => ({ ...n, leida: true })))
  }

  const noLeidas = notifs.filter(n => !n.leida).length

  return (
    <div className="app-container">
      <Sparkles />
      <div className="page-content">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-card text-brand-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="text-2xl font-black text-brand-800 flex-1">Notificaciones</h1>
          {noLeidas > 0 && (
            <span className="bg-brand-500 text-white text-xs font-black px-2.5 py-1 rounded-full">{noLeidas}</span>
          )}
        </div>

        {noLeidas > 0 && (
          <button onClick={marcarTodasLeidas}
            className="w-full text-brand-500 text-xs font-bold mb-4 text-right">
            Marcar todas como leídas
          </button>
        )}

        <div className="flex flex-col gap-3">
          {notifs.map(n => (
            <button key={n.id} onClick={() => marcarLeida(n.id, n.ruta)}
              className={`card w-full text-left flex gap-3 active:scale-95 transition-all
                ${!n.leida ? 'border-l-4 border-brand-500 bg-brand-50/50' : ''}`}>
              <div className={`w-12 h-12 ${n.iconBg} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}>
                {n.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-brand-800 text-sm">{n.titulo}</p>
                  {!n.leida && <div className="w-2.5 h-2.5 bg-brand-500 rounded-full flex-shrink-0 mt-1" />}
                </div>
                <p className="text-brand-600 text-xs leading-relaxed mt-0.5">{n.desc}</p>
                <p className="text-brand-300 text-xs mt-1 font-semibold">{n.time}</p>
              </div>
            </button>
          ))}
        </div>

        {notifs.every(n => n.leida) && (
          <div className="text-center py-10 text-brand-300">
            <p className="text-4xl mb-2">🔔</p>
            <p className="font-semibold">Todo al día</p>
            <p className="text-sm">No tienes notificaciones nuevas</p>
          </div>
        )}
      </div>
    </div>
  )
}
