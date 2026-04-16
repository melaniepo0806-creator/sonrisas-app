'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sparkles from '@/components/ui/Sparkles'
import { supabase } from '@/lib/supabase'

function calcularEtapaDental(fechaNacimiento: string): string {
  const nacimiento = new Date(fechaNacimiento)
  const hoy = new Date()
  const meses = (hoy.getFullYear() - nacimiento.getFullYear()) * 12 + (hoy.getMonth() - nacimiento.getMonth())
  if (meses < 6)   return '0-6m'
  if (meses < 12)  return '6-12m'
  if (meses < 24)  return '1-2a'
  if (meses < 72)  return '2-6a'
  return '6-12a'
}

function calcularEdad(fechaNacimiento: string): string {
  const meses = (() => {
    const n = new Date(fechaNacimiento); const h = new Date()
    return (h.getFullYear() - n.getFullYear()) * 12 + (h.getMonth() - n.getMonth())
  })()
  if (meses < 24) return `${meses} meses`
  return `${Math.floor(meses/12)} años`
}

export default function AgregarHijoPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nombre: '', nacimiento: '', genero: 'niña' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre del bebé es obligatorio'); return }
    if (!form.nacimiento) { setError('La fecha de nacimiento es obligatoria'); return }
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const etapa_dental = calcularEtapaDental(form.nacimiento)

      const { error: insertError } = await supabase.from('hijos').insert({
        parent_id: user.id,
        nombre: form.nombre.trim(),
        fecha_nacimiento: form.nacimiento,
        genero: form.genero,
        etapa_dental,
      })

      if (insertError) throw insertError
      router.push('/bienvenida')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const edadPreview = form.nacimiento ? calcularEdad(form.nacimiento) : null
  const etapaPreview = form.nacimiento ? calcularEtapaDental(form.nacimiento) : null

  return (
    <div className="relative flex flex-col min-h-screen px-6 py-10">
      <Sparkles />
      <button onClick={() => router.back()} className="absolute top-10 left-5 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-card text-brand-500">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      <div className="text-center mb-8 mt-6">
        <div className="text-5xl mb-3">👶</div>
        <h1 className="text-2xl font-black text-brand-800 mb-2">Agrega a tu hijo/a</h1>
        <p className="text-brand-500 text-sm">Para personalizar los consejos y guías</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label className="text-brand-700 font-semibold text-sm mb-1 block">Nombre del bebé *</label>
          <input
            type="text" placeholder="Ej: Mateo"
            value={form.nombre}
            onChange={e => setForm({...form, nombre: e.target.value})}
            className="input-field" required
          />
        </div>

        <div>
          <label className="text-brand-700 font-semibold text-sm mb-1 block">Fecha de nacimiento *</label>
          <input
            type="date"
            value={form.nacimiento}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setForm({...form, nacimiento: e.target.value})}
            className="input-field" required
          />
          {edadPreview && (
            <div className="mt-2 flex items-center gap-2">
              <span className="bg-brand-50 text-brand-600 text-xs font-bold px-3 py-1 rounded-full">
                {edadPreview}
              </span>
              <span className="bg-green-50 text-green-600 text-xs font-bold px-3 py-1 rounded-full">
                Etapa {etapaPreview}
              </span>
            </div>
          )}
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}

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
