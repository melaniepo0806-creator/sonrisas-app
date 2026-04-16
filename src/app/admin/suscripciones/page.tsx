'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type Sub = {
  id: string
  user_id: string
  plan: string
  estado: string
  inicio_periodo: string
  fin_periodo: string | null
  proveedor: string | null
  precio_cents: number | null
  perfil?: { nombre_completo: string | null; username: string | null }
}

export default function AdminSuscripciones() {
  const [subs, setSubs] = useState<Sub[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ username: '', plan: 'pro', dias: 30, precio: 500 })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('suscripciones')
      .select('*, perfil:profiles!suscripciones_user_id_fkey(nombre_completo, username)')
      .order('created_at', { ascending: false })
    setSubs((data as Sub[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function crear() {
    if (!form.username) return
    const { data: u } = await supabase.from('profiles').select('id').eq('username', form.username.replace('@','')).maybeSingle()
    if (!u) { alert('Usuario no encontrado'); return }
    const fin = new Date(); fin.setDate(fin.getDate() + Number(form.dias))
    const { error } = await supabase.from('suscripciones').insert({
      user_id: u.id, plan: form.plan, estado: 'activa',
      fin_periodo: fin.toISOString(), proveedor: 'manual', precio_cents: form.precio * 100,
    })
    if (error) { alert(error.message); return }
    await supabase.from('profiles').update({ plan: form.plan }).eq('id', u.id)
    setShowNew(false); setForm({ username: '', plan: 'pro', dias: 30, precio: 500 })
    load()
  }

  async function cambiarEstado(s: Sub, estado: string) {
    await supabase.from('suscripciones').update({ estado }).eq('id', s.id)
    if (estado === 'cancelada' || estado === 'vencida') {
      await supabase.from('profiles').update({ plan: 'free' }).eq('id', s.user_id)
    }
    load()
  }

  const colorEstado: Record<string,string> = {
    activa: 'bg-green-100 text-green-700',
    cancelada: 'bg-red-100 text-red-700',
    pausada: 'bg-yellow-100 text-yellow-700',
    vencida: 'bg-gray-200 text-gray-500',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-black text-gray-800">Suscripciones</h1>
        <button onClick={() => setShowNew(true)}
          className="bg-brand-500 text-white font-bold text-sm px-4 py-2 rounded-xl">+ Nueva</button>
      </div>
      <p className="text-gray-500 text-sm mb-5">{subs.length} registros. Puedes dar de alta manualmente (ej. usuarios beta).</p>

      {loading ? <p className="text-gray-400 text-sm text-center py-8">Cargando…</p> :
       subs.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">Sin suscripciones todavía.</p> :
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
        {subs.map(s => (
          <div key={s.id} className="p-4 flex items-start gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800">{s.perfil?.nombre_completo || '—'}</p>
              <p className="text-xs text-gray-400">
                {s.perfil?.username ? `@${s.perfil.username} · ` : ''}
                {s.proveedor || 'manual'}
                {s.precio_cents !== null ? ` · €${(s.precio_cents/100).toFixed(2)}` : ''}
              </p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${colorEstado[s.estado] || 'bg-gray-100'}`}>{s.estado}</span>
            <span className="text-xs font-bold bg-brand-50 text-brand-700 px-2 py-1 rounded-full uppercase">{s.plan}</span>
            <span className="text-xs text-gray-400 w-full sm:w-auto">
              {s.fin_periodo ? `Hasta ${new Date(s.fin_periodo).toLocaleDateString('es-ES')}` : 'Sin vencimiento'}
            </span>
            <select value={s.estado} onChange={e => cambiarEstado(s, e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white">
              <option value="activa">activa</option>
              <option value="pausada">pausada</option>
              <option value="cancelada">cancelada</option>
              <option value="vencida">vencida</option>
            </select>
          </div>
        ))}
      </div>}

      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-gray-800">Nueva suscripción</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Username del usuario</label>
                <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="tu_usuario" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Plan</label>
                  <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
                    <option>pro</option><option>family</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Días</label>
                  <input type="number" value={form.dias} onChange={e => setForm({ ...form, dias: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Precio (€)</label>
                <input type="number" value={form.precio} onChange={e => setForm({ ...form, precio: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <button onClick={crear} disabled={!form.username}
                className="w-full bg-brand-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-50">
                Crear suscripción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
