'use client'
import { useState } from 'react'
import Link from 'next/link'
import Sparkles from '@/components/ui/Sparkles'

const rutina = [
  { id: 1, tarea: 'Cepillado mañana', done: true },
  { id: 2, tarea: 'Cepillado noche', done: true },
  { id: 3, tarea: 'Sin dulces antes de dormir', done: false },
  { id: 4, tarea: 'Revisar encías', done: false },
]

const progreso = [
  { label: 'Lavado de dientes', icon: '🪥', value: 3, max: 4 },
  { label: 'Alimentación', icon: '🍎', value: 2, max: 4 },
  { label: 'Visita dentista', icon: '🦷', value: 1, max: 4 },
]

const recomendados = [
  { titulo: 'Tu primer cepillo de dientes', img: '👶', color: '#EAF6FD' },
  { titulo: 'Alimentos amigos de los dientes', img: '🥦', color: '#E8FFF0' },
  { titulo: 'Tu primer cepillo de dientes', img: '🪥', color: '#FFF5E8' },
]

const consejo = 'Usa una cantidad de pasta dental del tamaño de un grano de arroz. Ni más, ni menos. El flúor es necesario pero en la dosis correcta.'

export default function HomePage() {
  const [tareas, setTareas] = useState(rutina)
  const done = tareas.filter(t => t.done).length

  function toggle(id: number) {
    setTareas(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  return (
    <div className="relative min-h-screen pb-24">
      <Sparkles />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center text-xl">🦷</div>
          <h1 className="text-xl font-black text-brand-800">Home</h1>
        </div>
        <Link href="/notificaciones"
          className="w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center relative">
          <span className="text-lg">🔔</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full"/>
        </Link>
      </div>

      <div className="px-5 space-y-4">
        {/* Hero card */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-3xl p-4 text-white relative overflow-hidden">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-80">👶</div>
          <p className="text-white/80 text-xs font-semibold">¡Hola, Lucía!</p>
          <p className="font-black text-lg leading-tight mt-0.5">
            Hoy cuidamos a Mateo<br />
            <span className="text-white/80 text-sm font-semibold">· 14 meses</span>
          </p>
          <Link href="/dashboard/guias"
            className="mt-3 inline-block bg-white text-brand-600 text-xs font-bold px-4 py-2 rounded-xl">
            Etapa sus primeros dientes →
          </Link>
        </div>

        {/* Consejo del día */}
        <div className="card border-l-4 border-yellow-400">
          <div className="flex items-center gap-2 mb-1">
            <span>⭐</span>
            <span className="text-brand-700 font-bold text-sm">Consejo del día</span>
          </div>
          <p className="text-brand-600 text-xs leading-relaxed">{consejo}</p>
        </div>

        {/* Rutina de hoy */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-brand-800 font-black">Rutina de hoy</h2>
            <span className="text-brand-400 font-bold text-sm">{done} / {tareas.length}</span>
          </div>
          <div className="space-y-2">
            {tareas.map(t => (
              <button
                key={t.id}
                onClick={() => toggle(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left
                  ${t.done ? 'bg-green-50' : 'bg-brand-50'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                  ${t.done ? 'bg-green-500' : 'border-2 border-brand-300'}`}>
                  {t.done && <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>}
                </div>
                <span className={`text-sm font-semibold ${t.done ? 'text-green-700 line-through' : 'text-brand-700'}`}>
                  {t.tarea}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Progreso en la guía */}
        <div className="card">
          <h2 className="text-brand-800 font-black mb-3">Tu progreso en la guía</h2>
          <div className="space-y-3">
            {progreso.map(p => (
              <div key={p.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.icon}</span>
                    <span className="text-brand-700 text-sm font-semibold">{p.label}</span>
                  </div>
                  <span className="text-brand-400 text-xs font-bold">{p.value}/{p.max}</span>
                </div>
                <div className="h-2 bg-brand-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all"
                    style={{ width: `${(p.value / p.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendados */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-brand-800 font-black">Recomendado para ti</h2>
            <Link href="/dashboard/guias" className="text-brand-500 text-sm font-semibold">
              Ver todo →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {recomendados.map((r, i) => (
              <div key={i} className="flex-shrink-0 w-28 rounded-2xl overflow-hidden shadow-card"
                style={{ backgroundColor: r.color }}>
                <div className="h-20 flex items-center justify-center text-4xl">{r.img}</div>
                <div className="p-2">
                  <p className="text-brand-700 text-[11px] font-semibold leading-tight">{r.titulo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
