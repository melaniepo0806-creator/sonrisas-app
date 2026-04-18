'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAvatars, type AvatarItem } from '@/lib/avatars-hook'
import Sparkles from '@/components/ui/Sparkles'

export default function AvatarPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const ninos = useAvatars('ninos')
  const ninas = useAvatars('ninas')
  const bebes = useAvatars('bebes')

  const all: AvatarItem[] = [...ninos, ...ninas, ...bebes]
  const selectedAvatar = all.find(a => a.id === selected)
  const selectedValue = selectedAvatar?.value || '👶'

  async function handleGuardar() {
    if (!selected || !selectedAvatar) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ avatar_url: selectedAvatar.value }).eq('id', user.id)
    }
    setSaving(false)
    router.push('/agregar-hijo')
  }

  return (
    <div className="relative flex flex-col min-h-screen px-5 py-8" style={{ background: 'linear-gradient(160deg,#EAF6FD 0%,#C8E8F5 100%)' }}>
      <Sparkles />

      {/* Back */}
      <button onClick={() => router.back()} className="absolute top-8 left-5 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-card text-brand-500">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>

      {/* Title */}
      <div className="text-center mt-8 mb-6">
        <h1 className="text-2xl font-black text-brand-800">Elige tu avatar</h1>
        <p className="text-brand-500 text-sm mt-1">¿Quién representa a tu peque?</p>
      </div>

      {/* Preview */}
      <div className="flex justify-center mb-6">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-lg border-4 transition-all
          ${selected ? 'bg-brand-100 border-brand-400' : 'bg-white border-brand-100'}`}>
          {selectedAvatar?.value_type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedValue} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            selectedValue
          )}
        </div>
      </div>

      <AvatarGroup title="Niños" items={ninos} selected={selected} onSelect={setSelected} />
      <AvatarGroup title="Niñas" items={ninas} selected={selected} onSelect={setSelected} />
      <AvatarGroup title="Bebés" items={bebes} selected={selected} onSelect={setSelected} extraClass="mb-8" />

      <button onClick={handleGuardar} disabled={!selected || saving}
        className="btn-primary disabled:opacity-40 mt-auto">
        {saving ? 'Guardando...' : 'Guardar perfil'}
      </button>
    </div>
  )
}

function AvatarGroup({
  title, items, selected, onSelect, extraClass,
}: {
  title: string
  items: AvatarItem[]
  selected: string | null
  onSelect: (id: string) => void
  extraClass?: string
}) {
  if (items.length === 0) return null
  return (
    <div className={`mb-4 ${extraClass || ''}`}>
      <p className="font-black text-brand-700 text-sm mb-2 px-1">{title}</p>
      <div className="grid grid-cols-6 gap-2">
        {items.map(a => (
          <button key={a.id} onClick={() => onSelect(a.id)}
            className={`aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all active:scale-90
              ${selected === a.id ? 'bg-brand-200 ring-2 ring-brand-500 scale-110 shadow-md' : 'bg-white shadow-sm'}`}>
            {a.value_type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.value} alt={a.label} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              a.value
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
