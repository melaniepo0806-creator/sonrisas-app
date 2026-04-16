'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sparkles from '@/components/ui/Sparkles'

const NINOS = [
  { id:'n1', emoji:'👦🏻', label:'Rubio' },
  { id:'n2', emoji:'👦', label:'Castaño' },
  { id:'n3', emoji:'👦🏽', label:'Moreno' },
  { id:'n4', emoji:'👦🏾', label:'Oscuro' },
  { id:'n5', emoji:'🧒🏻', label:'Pelirrojo' },
  { id:'n6', emoji:'🧒🏽', label:'Rizado' },
]
const NINAS = [
  { id:'g1', emoji:'👧🏻', label:'Rubia' },
  { id:'g2', emoji:'👧', label:'Castaña' },
  { id:'g3', emoji:'👧🏽', label:'Morena' },
  { id:'g4', emoji:'👧🏾', label:'Oscura' },
  { id:'g5', emoji:'🧒🏻', label:'Bebé' },
  { id:'g6', emoji:'👶🏽', label:'Pequeña' },
]
const BEBES = [
  { id:'b1', emoji:'👶🏻', label:'Bebé 1' },
  { id:'b2', emoji:'👶', label:'Bebé 2' },
  { id:'b3', emoji:'👶🏽', label:'Bebé 3' },
  { id:'b4', emoji:'👶🏾', label:'Bebé 4' },
]

export default function AvatarPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const allAvatars = [...NINOS, ...NINAS, ...BEBES]
  const selectedEmoji = allAvatars.find(a => a.id === selected)?.emoji || '👶'

  async function handleGuardar() {
    if (!selected) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ avatar_url: selectedEmoji }).eq('id', user.id)
    }
    setSaving(false)
    router.push('/agregar-hijo')
  }

  return (
    <div className="relative flex flex-col min-h-screen px-5 py-8" style={{background:'linear-gradient(160deg,#EAF6FD 0%,#C8E8F5 100%)'}}>
      <Sparkles />

      {/* Back */}
      <button onClick={() => router.back()} className="absolute top-8 left-5 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-card text-brand-500">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
          {selectedEmoji}
        </div>
      </div>

      {/* Niños */}
      <div className="mb-4">
        <p className="font-black text-brand-700 text-sm mb-2 px-1">Niños</p>
        <div className="grid grid-cols-6 gap-2">
          {NINOS.map(a => (
            <button key={a.id} onClick={() => setSelected(a.id)}
              className={`aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all active:scale-90
                ${selected === a.id ? 'bg-brand-200 ring-2 ring-brand-500 scale-110 shadow-md' : 'bg-white shadow-sm'}`}>
              {a.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Niñas */}
      <div className="mb-4">
        <p className="font-black text-brand-700 text-sm mb-2 px-1">Niñas</p>
        <div className="grid grid-cols-6 gap-2">
          {NINAS.map(a => (
            <button key={a.id} onClick={() => setSelected(a.id)}
              className={`aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all active:scale-90
                ${selected === a.id ? 'bg-brand-200 ring-2 ring-brand-500 scale-110 shadow-md' : 'bg-white shadow-sm'}`}>
              {a.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Bebés */}
      <div className="mb-8">
        <p className="font-black text-brand-700 text-sm mb-2 px-1">Bebés</p>
        <div className="grid grid-cols-6 gap-2">
          {BEBES.map(a => (
            <button key={a.id} onClick={() => setSelected(a.id)}
              className={`aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all active:scale-90
                ${selected === a.id ? 'bg-brand-200 ring-2 ring-brand-500 scale-110 shadow-md' : 'bg-white shadow-sm'}`}>
              {a.emoji}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleGuardar} disabled={!selected || saving}
        className="btn-primary disabled:opacity-40 mt-auto">
        {saving ? 'Guardando...' : 'Guardar perfil'}
      </button>
    </div>
  )
}
