'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ConfiguracionPage() {
  const [notifCepillado, setNotifCepillado] = useState(true)
  const [notifCitas, setNotifCitas] = useState(true)
  const [notifNido, setNotifNido] = useState(false)
  const [idioma, setIdioma] = useState('es')

  return (
    <div className="relative min-h-screen pb-24">
      <div className="flex items-center gap-3 px-5 pt-12 pb-6">
        <Link href="/dashboard/perfil" className="text-brand-500">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <h1 className="text-2xl font-black text-brand-800">Configuración</h1>
      </div>

      <div className="px-5 space-y-4">
        {/* Cuenta */}
        <div>
          <p className="text-brand-400 text-xs font-bold uppercase tracking-wider mb-2 px-1">Cuenta</p>
          <div className="card space-y-3">
            {[
              { label: 'Nombre', value: 'Lucía García' },
              { label: 'Email', value: 'lucia@email.com' },
              { label: 'Contraseña', value: '••••••••' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-brand-600 text-sm font-semibold">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-brand-400 text-sm">{item.value}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notificaciones */}
        <div>
          <p className="text-brand-400 text-xs font-bold uppercase tracking-wider mb-2 px-1">Notificaciones</p>
          <div className="card space-y-4">
            {[
              { label: 'Recordatorio de cepillado', value: notifCepillado, set: setNotifCepillado },
              { label: 'Recordatorio de citas', value: notifCitas, set: setNotifCitas },
              { label: 'Actividad en Nido', value: notifNido, set: setNotifNido },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-brand-700 text-sm font-semibold">{item.label}</span>
                <button
                  onClick={() => item.set(v => !v)}
                  className={`w-12 h-6 rounded-full transition-all relative ${item.value ? 'bg-brand-500' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all
                    ${item.value ? 'left-6' : 'left-0.5'}`}/>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Idioma */}
        <div>
          <p className="text-brand-400 text-xs font-bold uppercase tracking-wider mb-2 px-1">Idioma</p>
          <div className="card">
            <div className="flex gap-3">
              {[{ code: 'es', label: '🇪🇸 Español' }, { code: 'en', label: '🇺🇸 English' }].map(l => (
                <button key={l.code} onClick={() => setIdioma(l.code)}
                  className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all
                    ${idioma === l.code ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-600'}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Privacidad */}
        <div>
          <p className="text-brand-400 text-xs font-bold uppercase tracking-wider mb-2 px-1">Legal</p>
          <div className="card space-y-3">
            {['Política de privacidad', 'Términos de uso', 'Licencias'].map(item => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-brand-700 text-sm font-semibold">{item}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-brand-300 text-xs">Sonrisas v1.0.0</p>
      </div>
    </div>
  )
}
