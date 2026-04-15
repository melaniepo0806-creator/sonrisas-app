'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sparkles from '@/components/ui/Sparkles'

const avatars = [
  { id: 1, emoji: '👧', name: 'Sofía', color: '#FFB3C1' },
  { id: 2, emoji: '👦', name: 'Mateo', color: '#A8DAFF' },
  { id: 3, emoji: '👩', name: 'Lucía', color: '#C8F5C8' },
  { id: 4, emoji: '👨', name: 'Carlos', color: '#FFD9A8' },
  { id: 5, emoji: '🧒', name: 'Valentina', color: '#E8C8FF' },
  { id: 6, emoji: '🧑', name: 'Diego', color: '#C8F0FF' },
  { id: 7, emoji: '👩‍🦱', name: 'Camila', color: '#FFE8C8' },
  { id: 8, emoji: '👨‍🦰', name: 'Sebastián', color: '#C8FFE8' },
]

export default function AvatarPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<number | null>(null)

  function handleContinue() {
    if (selected) router.push('/agregar-hijo')
  }

  return (
    <div className="relative flex flex-col min-h-screen px-6 py-10">
      <Sparkles />
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-brand-800">Elige tu avatar</h1>
        <p className="text-brand-500 text-sm mt-2">¿Quién eres tú?</p>
      </div>

      {/* Selected preview */}
      {selected && (
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-card"
            style={{ backgroundColor: avatars.find(a => a.id === selected)?.color }}>
            {avatars.find(a => a.id === selected)?.emoji}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-8">
        {avatars.map(avatar => (
          <button
            key={avatar.id}
            onClick={() => setSelected(avatar.id)}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all
              ${selected === avatar.id
                ? 'ring-3 ring-brand-500 scale-105 shadow-card'
                : 'hover:scale-105'}`}
            style={{ backgroundColor: avatar.color + '60' }}
          >
            <span className="text-3xl">{avatar.emoji}</span>
            <span className="text-[10px] font-semibold text-brand-700">{avatar.name}</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={!selected}
        className="btn-primary"
      >
        Continuar
      </button>
    </div>
  )
}
