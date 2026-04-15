'use client'
import Link from 'next/link'

const notifs = [
  { id: 1, icon: '🪥', titulo: 'Hora del cepillado', desc: 'Es momento del cepillado de la noche de Mateo', time: 'Hace 2 min', leida: false },
  { id: 2, icon: '📅', titulo: 'Cita mañana', desc: 'Recuerda que tienes cita dental con Mateo mañana a las 10:30', time: 'Hace 1 hora', leida: false },
  { id: 3, icon: '⭐', titulo: 'Nuevo consejo disponible', desc: '¿Sabías que el flúor fortalece el esmalte desde los primeros dientes?', time: 'Hace 3 horas', leida: true },
  { id: 4, icon: '💬', titulo: 'Nueva respuesta en el Nido', desc: '@mama_garcia respondió a tu publicación', time: 'Hace 5 horas', leida: true },
  { id: 5, icon: '🦷', titulo: 'Nuevo contenido en Guías', desc: 'Etapa 2-3 años: nuevas recomendaciones disponibles', time: 'Ayer', leida: true },
]

export default function NotificacionesPage() {
  return (
    <div className="relative min-h-screen pb-24">
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <Link href="/dashboard" className="text-brand-500">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <h1 className="text-2xl font-black text-brand-800">Notificaciones</h1>
        <span className="ml-auto bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {notifs.filter(n => !n.leida).length}
        </span>
      </div>

      <div className="px-5 space-y-2">
        {notifs.map(n => (
          <div key={n.id} className={`card flex gap-3 transition-all ${!n.leida ? 'border-l-4 border-brand-500' : ''}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0
              ${!n.leida ? 'bg-brand-100' : 'bg-gray-100'}`}>
              {n.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-bold ${!n.leida ? 'text-brand-800' : 'text-gray-600'}`}>
                  {n.titulo}
                </p>
                {!n.leida && <span className="w-2 h-2 bg-brand-500 rounded-full mt-1 flex-shrink-0"/>}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{n.desc}</p>
              <p className="text-xs text-brand-400 mt-1">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
