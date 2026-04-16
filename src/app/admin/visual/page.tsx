'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type Colors = { primary: string; secondary: string; background: string }
type Hero = { title: string; cta: string }

export default function AdminVisual() {
  const [colors, setColors] = useState<Colors>({ primary: '#3B9DC8', secondary: '#22C55E', background: '#EAF6FD' })
  const [hero, setHero] = useState<Hero>({ title: '', cta: '' })
  const [consejos, setConsejos] = useState<string[]>([])
  const [nuevo, setNuevo] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('app_settings').select('*')
    if (data) {
      for (const row of data) {
        if (row.key === 'brand_colors')  setColors(row.value as Colors)
        if (row.key === 'landing_hero')  setHero(row.value as Hero)
        if (row.key === 'home_consejos') setConsejos(row.value as string[])
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function guardar(key: string, value: unknown) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('app_settings').upsert({ key, value, updated_by: user?.id, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    setSavedMsg('Guardado ✓')
    setTimeout(() => setSavedMsg(''), 2000)
  }

  if (loading) return <p className="text-gray-400 text-sm text-center py-8">Cargando…</p>

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-1">Visual</h1>
      <p className="text-gray-500 text-sm mb-5">Personaliza los colores, textos de la landing y consejos del día.</p>

      {savedMsg && <p className="mb-3 bg-green-50 text-green-700 text-sm text-center py-2 rounded-xl">{savedMsg}</p>}

      {/* Colores */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
        <h2 className="font-black text-gray-800 mb-3">🎨 Colores de la marca</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {(['primary','secondary','background'] as const).map(k => (
            <div key={k}>
              <label className="text-xs font-bold text-gray-600 mb-1 block capitalize">{k}</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={colors[k]} onChange={e => setColors({ ...colors, [k]: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer" />
                <input value={colors[k]} onChange={e => setColors({ ...colors, [k]: e.target.value })}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2 items-center">
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-lg border border-gray-200" style={{ background: colors.primary }} />
            <div className="w-8 h-8 rounded-lg border border-gray-200" style={{ background: colors.secondary }} />
            <div className="w-8 h-8 rounded-lg border border-gray-200" style={{ background: colors.background }} />
          </div>
          <button onClick={() => guardar('brand_colors', colors)}
            className="ml-auto bg-brand-500 text-white font-bold text-sm px-4 py-2 rounded-xl">Guardar colores</button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Estos valores se guardan en <code>app_settings.brand_colors</code>. Para aplicarlos al diseño puedes leerlos en el <code>layout.tsx</code> y exponerlos como variables CSS.</p>
      </div>

      {/* Landing */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
        <h2 className="font-black text-gray-800 mb-3">🏷️ Landing (página pública)</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">Título del hero</label>
            <input value={hero.title} onChange={e => setHero({ ...hero, title: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">Texto del CTA</label>
            <input value={hero.cta} onChange={e => setHero({ ...hero, cta: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <button onClick={() => guardar('landing_hero', hero)}
            className="bg-brand-500 text-white font-bold text-sm px-4 py-2 rounded-xl">Guardar landing</button>
        </div>
      </div>

      {/* Consejos */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h2 className="font-black text-gray-800 mb-3">💡 Consejos del día</h2>
        <ul className="space-y-2 mb-3">
          {consejos.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              <input value={c} onChange={e => {
                const copy = [...consejos]; copy[i] = e.target.value; setConsejos(copy)
              }} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              <button onClick={() => setConsejos(consejos.filter((_, j) => j !== i))}
                className="text-red-500 text-sm font-bold px-2 py-1 rounded-lg hover:bg-red-50">Quitar</button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mb-3">
          <input value={nuevo} onChange={e => setNuevo(e.target.value)} placeholder="Añadir consejo…"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <button onClick={() => { if (nuevo) { setConsejos([...consejos, nuevo]); setNuevo('') } }}
            className="bg-gray-100 text-gray-700 font-bold text-sm px-4 py-2 rounded-xl">Añadir</button>
        </div>
        <button onClick={() => guardar('home_consejos', consejos)}
          className="bg-brand-500 text-white font-bold text-sm px-4 py-2 rounded-xl">Guardar consejos</button>
      </div>
    </div>
  )
}
