'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sparkles from '@/components/ui/Sparkles'
import { supabase } from '@/lib/supabase'

export default function AgregarHijoPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nombre: '', nacimiento: '', genero: 'niña' })
  const [loading, setLoading] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('hijos').insert({
        parent_id: user.id,
        nombre: form.nombre,
        fecha_nacimiento: form.nacimiento,
        genero: form.genero,
      })
    }
    setLoading(false)
    router.push('/bienvenida')
  }

  return (
    <div className="relative flex flex-col min-h-screen px-6 py-10">
      <Sparkles />
      <h1 className="text-2xl font-black text-brand-800 mb-2 text-center">
        Agrega a tu hijo/a
      </h1>
      <p className="text-brand-500 text-sm text-center mb-8">
        Para personalizar los consejos y guías
      </p>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label className="text-brand-700 font-semibold text-sm mb-1 block">
            Nombre del bebé
          </label>
          <input
            type="text" placeholder="Ej: Mateo"
            value={form.nombre}
            onChange={e => setForm({...form, nombre: e.target.value})}
            className="input-field" required
          />
        </div>

        <div>
          <label className="text-brand-700 font-semibold text-sm mb-1 block">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            value={form.nacimiento}
            onChange={e => setForm({...form, nacimiento: e.target.value})}
            className="input-field" required
          />
        </div>

        <div>
          <label className="text-brand-700 font-semibold text-sm mb-2 block">Género</label>
          <div className="flex gap-3">
            {['niña', 'niño'].map(g => (
              <button
                key={g} type="button"
                onClick={() => setForm({...form, genero: g})}
                className={`flex-1 py-3 rounded-2xl font-semibold capitalize transition-all
                  ${form.genero === g
                    ? 'bg-brand-500 text-white shadow-card'
                    : 'bg-white text-brand-500 border-2 border-brand-200'}`}
              >
                {g === 'niña' ? '👧 Niña' : '👦 Niño'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar y continuar'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/bienvenida')}
            className="btn-secondary mt-3"
          >
            Saltar por ahora
          </button>
        </div>
      </form>
    </div>
  )
}
