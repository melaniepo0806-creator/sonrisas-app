'use client'
import { useState } from 'react'
import Link from 'next/link'

const etapas = [
  {
    id: 1,
    rango: '0–6 meses',
    titulo: 'Antes de los primeros dientes',
    emoji: '👶',
    color: '#EAF6FD',
    border: '#3B9DC8',
    guias: [
      { titulo: 'Cómo limpiar las encías de tu bebé', desc: 'Usa un paño húmedo limpio para limpiar suavemente las encías después de cada alimentación.' },
      { titulo: 'Qué esperar en los primeros 6 meses', desc: 'Los dientes de leche están formándose bajo las encías. No se ven pero ya están ahí.' },
      { titulo: 'Alimentación y salud dental', desc: 'La leche materna es ideal para el desarrollo de los dientes.' },
    ],
  },
  {
    id: 2,
    rango: '6–12 meses',
    titulo: 'Los primeros dientes aparecen',
    emoji: '🦷',
    color: '#E8FFF0',
    border: '#6DB878',
    guias: [
      { titulo: 'Señales de dentición', desc: 'Babeo excesivo, irritabilidad y querer morder objetos son señales normales.' },
      { titulo: 'Cuándo empezar a cepillar', desc: 'Tan pronto como aparezca el primer diente, empieza con un cepillo suave.' },
      { titulo: 'Aliviar el dolor de encías', desc: 'Un mordedor frío (no helado) puede aliviar las molestias.' },
    ],
  },
  {
    id: 3,
    rango: '1–2 años',
    titulo: 'Más dientes y más hábitos',
    emoji: '🪥',
    color: '#FFF5E8',
    border: '#F5A742',
    guias: [
      { titulo: 'Cepillado 2 veces al día', desc: 'Establece la rutina de mañana y noche con pasta dental tamaño grano de arroz.' },
      { titulo: 'Primera visita al dentista', desc: 'La primera cita dental debe ser antes o al cumplir el año.' },
      { titulo: 'Evitar biberón con leche al dormir', desc: 'Puede causar caries de biberón, una de las más comunes en bebés.' },
    ],
  },
  {
    id: 4,
    rango: '2–3 años',
    titulo: 'Aprendiendo a cepillar',
    emoji: '😁',
    color: '#F5E8FF',
    border: '#A855F7',
    guias: [
      { titulo: 'Enseña a escupir', desc: 'Enseña a tu hijo a escupir el exceso de pasta y no tragarla.' },
      { titulo: 'Pasta tamaño guisante', desc: 'A los 3 años puedes aumentar a una cantidad del tamaño de un guisante.' },
      { titulo: 'Haz del cepillado un juego', desc: 'Canciones, cuentos o aplicaciones ayudan a que el niño disfrute cepillarse.' },
    ],
  },
]

export default function GuiasPage() {
  const [etapaActiva, setEtapaActiva] = useState<number | null>(null)

  return (
    <div className="relative min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-black text-brand-800">Guías por etapa</h1>
        <p className="text-brand-500 text-sm mt-1">Consejos para cada etapa dental de tu bebé</p>
      </div>

      <div className="px-5 space-y-3">
        {etapas.map(etapa => (
          <div key={etapa.id}>
            <button
              onClick={() => setEtapaActiva(etapaActiva === etapa.id ? null : etapa.id)}
              className="w-full text-left"
            >
              <div className="card flex items-center gap-4 transition-all"
                style={{ borderLeft: `4px solid ${etapa.border}` }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: etapa.color }}>
                  {etapa.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-brand-400 text-xs font-semibold">{etapa.rango}</p>
                  <p className="text-brand-800 font-black text-sm leading-tight">{etapa.titulo}</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  className={`flex-shrink-0 transition-transform ${etapaActiva === etapa.id ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6" stroke="#3B9DC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>

            {/* Expanded guías */}
            {etapaActiva === etapa.id && (
              <div className="mt-2 space-y-2 pl-2">
                {etapa.guias.map((g, i) => (
                  <div key={i} className="card bg-white border border-brand-100">
                    <p className="text-brand-800 font-bold text-sm mb-1">{g.titulo}</p>
                    <p className="text-brand-500 text-xs leading-relaxed">{g.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA agendar cita */}
      <div className="px-5 mt-6">
        <Link href="/agendar-cita"
          className="card flex items-center gap-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white">
          <span className="text-3xl">📅</span>
          <div>
            <p className="font-black">¿Es hora de la revisión?</p>
            <p className="text-white/80 text-xs">Agenda una cita con el dentista</p>
          </div>
          <svg className="ml-auto" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </div>
  )
}
