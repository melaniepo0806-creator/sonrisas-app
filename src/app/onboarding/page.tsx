'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sparkles from '@/components/ui/Sparkles'

const steps = [
  {
    emoji: '👶',
    title: '¡Bienvenid@ a Sonrisas!',
    desc: 'La app que te ayuda a cuidar los dientes de tu bebé desde el primer día.',
  },
  {
    emoji: '🦷',
    title: 'Guías por etapa',
    desc: 'Recibe consejos personalizados según la edad de tu hijo y el desarrollo dental.',
  },
  {
    emoji: '🪥',
    title: 'Rutinas diarias',
    desc: 'Registra el cepillado y los hábitos de higiene para mantener una sonrisa sana.',
  },
  {
    emoji: '🌱',
    title: 'Comunidad de padres',
    desc: 'Comparte experiencias y aprende de otros padres en el Nido.',
  },
  {
    emoji: '📅',
    title: 'Agenda citas',
    desc: 'Programa visitas al dentista y activa recordatorios automáticos.',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  function next() {
    if (step < steps.length - 1) setStep(s => s + 1)
    else router.push('/avatar')
  }

  function skip() { router.push('/avatar') }

  const s = steps[step]

  return (
    <div className="relative flex flex-col min-h-screen px-6 py-10">
      <Sparkles />
      <button onClick={skip} className="self-end text-brand-400 font-semibold text-sm mb-8">
        Saltar
      </button>

      {/* Progress dots */}
      <div className="flex gap-2 justify-center mb-12">
        {steps.map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all duration-300
            ${i === step ? 'w-6 bg-brand-500' : 'w-2 bg-brand-200'}`}/>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-8xl mb-8 animate-bounce">{s.emoji}</div>
        <h2 className="text-2xl font-black text-brand-800 mb-4 leading-tight">{s.title}</h2>
        <p className="text-brand-500 text-base leading-relaxed max-w-xs">{s.desc}</p>
      </div>

      <button onClick={next} className="btn-primary mt-8">
        {step < steps.length - 1 ? 'Siguiente' : '¡Empezar!'}
      </button>
    </div>
  )
}
