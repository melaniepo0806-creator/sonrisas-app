'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/ui/BottomNav'
import Sparkles from '@/components/ui/Sparkles'

const ETAPAS = [{ val: '0-1', label: 'de 0-1' }, { val: '2-6', label: 'de 2-6' }, { val: '6-12', label: 'de 7-12' }]
const CATEGORIAS = [
  { val: 'lavado', label: 'Lavado', icono: '🪥', color: 'bg-blue-100' },
  { val: 'alimentacion', label: 'Alimentación', icono: '🍎', color: 'bg-red-100' },
  { val: 'dentista', label: 'Dentista', icono: '🏥', color: 'bg-green-100' },
  { val: 'salud', label: 'Salud', icono: '🦠', color: 'bg-purple-100' },
  { val: 'ortodoncia', label: 'Ortodoncia', icono: '😬', color: 'bg-yellow-100' },
]

type Articulo = { id: string; titulo: string; resumen: string; categoria: string; destacado: boolean }

export default function GuiasPage() {
  const router = useRouter()
  const [etapa, setEtapa] = useState('0-1')
  const [catFiltro, setCatFiltro] = useState<string | null>(null)
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [loading, setLoading] = useState(true)
  const [articuloAbierto, setArticuloAbierto] = useState<Articulo | null>(null)

  useEffect(() => {
    async function cargarHijo() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: hijos } = await supabase.from('hijos').select('etapa_dental').eq('parent_id', user.id).limit(1)
      if (hijos?.[0]?.etapa_dental) {
        const e = hijos[0].etapa_dental
        if (e === '0-6m' || e === '6-12m' || e === '1-2a') setEtapa('0-1')
        else if (e === '2-6a') setEtapa('2-6')
        else setEtapa('6-12')
      }
    }
    cargarHijo()
  }, [])

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      let q = supabase.from('articulos').select('*').eq('etapa', etapa).order('orden')
      if (catFiltro) q = q.eq('categoria', catFiltro)
      const { data } = await q
      setArticulos(data || [])
      setLoading(false)
    }
    cargar()
  }, [etapa, catFiltro])

  if (articuloAbierto) return <ArticuloDetalle articulo={articuloAbierto} onBack={() => setArticuloAbierto(null)} />

  const destacado = articulos.find(a => a.destacado)
  const recientes = articulos.filter(a => !a.destacado)

  return (
    <div className="app-container">
      <Sparkles />
      <div className="page-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-xl">🦷</div>
            <h1 className="text-xl font-black text-brand-800">Guía</h1>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">🔖</button>
            <button className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">🔔</button>
          </div>
        </div>

        {/* Tabs etapa */}
        <div className="flex gap-2 mb-5">
          {ETAPAS.map(e => (
            <button key={e.val} onClick={() => { setEtapa(e.val); setCatFiltro(null) }}
              className={`flex-1 py-2.5 rounded-2xl font-bold text-sm transition-all ${etapa === e.val ? 'bg-brand-500 text-white shadow-card' : 'bg-white text-brand-600 border-2 border-brand-100'}`}>
              {e.label}
            </button>
          ))}
        </div>

        {/* Categorías */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-brand-800">Categorías</h3>
          <button onClick={() => setCatFiltro(null)} className="text-brand-500 text-xs font-bold">Ver todo →</button>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 mb-5">
          {CATEGORIAS.map(c => (
            <button key={c.val} onClick={() => setCatFiltro(catFiltro === c.val ? null : c.val)}
              className={`flex flex-col items-center gap-1 min-w-[64px] transition-all ${catFiltro === c.val ? 'opacity-100 scale-105' : 'opacity-80'}`}>
              <div className={`w-14 h-14 ${c.color} rounded-2xl flex items-center justify-center text-2xl shadow-sm border-2 ${catFiltro === c.val ? 'border-brand-500' : 'border-transparent'}`}>{c.icono}</div>
              <span className="text-xs text-brand-700 font-semibold text-center leading-tight">{c.label}</span>
            </button>
          ))}
        </div>

        {loading ? <div className="text-center text-brand-400 py-8">Cargando...</div> : (
          <>
            {/* Destacado */}
            {destacado && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-brand-800">Destacado para esta etapa</h3>
                  <button className="text-brand-500 text-xs font-bold">Ver todo →</button>
                </div>
                <button onClick={() => setArticuloAbierto(destacado)}
                  className="card bg-green-50 border border-green-200 mb-5 w-full text-left active:scale-95 transition-all">
                  <h4 className="font-black text-green-800 mb-1">{destacado.titulo}</h4>
                  <p className="text-green-600 text-sm mb-3">{destacado.resumen}</p>
                  <span className="bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-xl">Ver guía →</span>
                </button>
              </>
            )}

            {/* Artículos */}
            {recientes.length > 0 && (
              <>
                <h3 className="font-black text-brand-800 mb-3">Artículos recientes</h3>
                <div className="grid grid-cols-2 gap-3">
                  {recientes.map((a, i) => {
                    const cat = CATEGORIAS.find(c => c.val === a.categoria)
                    return (
                      <button key={a.id} onClick={() => setArticuloAbierto(a)}
                        className={`${i === 0 ? 'bg-brand-500 text-white' : 'bg-white text-brand-800'} rounded-2xl p-4 text-left shadow-card active:scale-95 transition-all`}>
                        <p className={`font-black text-sm leading-snug mb-2`}>{a.titulo}</p>
                        <p className={`text-xs ${i === 0 ? 'text-white/70' : 'text-gray-400'}`}>{cat?.icono} {cat?.label}</p>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {articulos.length === 0 && (
              <div className="text-center text-brand-400 py-8">
                <p className="text-4xl mb-2">📚</p>
                <p className="font-semibold">Próximamente más contenido para esta etapa</p>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

function ArticuloDetalle({ articulo, onBack }: { articulo: Articulo; onBack: () => void }) {
  const cat = CATEGORIAS.find(c => c.val === articulo.categoria)
  return (
    <div className="app-container">
      <Sparkles />
      <div className="page-content">
        <button onClick={onBack} className="text-brand-500 font-bold text-sm mb-4 flex items-center gap-1">← Guías</button>
        {/* Header card */}
        <div className="card bg-purple-50 border border-purple-100 mb-5">
          <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center text-2xl mb-3">👶</div>
          <h2 className="text-xl font-black text-purple-800 mb-1">{articulo.titulo}</h2>
          <p className="text-purple-500 text-xs font-bold mb-2">Etapa del bebé</p>
          <p className="text-purple-600 text-sm">{articulo.resumen}</p>
        </div>

        {/* Categorías filtro */}
        <div className="flex gap-2 mb-5 overflow-x-auto hide-scrollbar">
          {cat && <div className={`${cat.color} flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold`}>{cat.icono} {cat.label}</div>}
        </div>

        {/* ¿Qué hacer? */}
        <h3 className="font-black text-brand-800 text-lg mb-3">¿Qué hacer?</h3>
        <div className="flex flex-col gap-2 mb-5">
          {['Limpia las encías con una gasa húmeda después de cada toma.',
            'Evita dormir al bebé con biberón para prevenir caries tempranas.',
            'Visita al dentista en cuanto salga el primer diente.',
            'Masajea suavemente las encías para aliviar molestias.'].map((paso, i) => (
            <div key={i} className="card flex items-start gap-3 py-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 ${['bg-purple-500','bg-brand-500','bg-green-500','bg-yellow-400'][i]}`}>{i+1}</div>
              <p className="text-brand-700 text-sm">{paso}</p>
            </div>
          ))}
        </div>

        {/* Sabías que */}
        <div className="card bg-purple-50 border border-purple-100 mb-5">
          <p className="text-purple-600 font-black text-sm mb-1">💡 Sabías que...</p>
          <p className="text-purple-500 text-sm">Los dientes de leche empiezan a formarse desde la semana 6 de embarazo.</p>
        </div>

        {/* Video placeholder */}
        <h3 className="font-black text-brand-800 mb-3">Video tutorial</h3>
        <div className="bg-brand-200 rounded-2xl h-40 flex items-center justify-center mb-5">
          <div className="w-14 h-14 bg-white/50 rounded-full flex items-center justify-center">
            <span className="text-brand-600 text-2xl">▶</span>
          </div>
        </div>

        {/* Lo que viene */}
        <h3 className="font-black text-brand-800 mb-3">Lo que viene</h3>
        <div className="grid grid-cols-2 gap-3 pb-4">
          <div className="card bg-purple-50 border border-purple-100">
            <p className="text-purple-600 font-black text-xs">📅 Primera visita</p>
            <p className="text-purple-500 text-xs mt-1">Al dentista antes del primer cumpleaños</p>
          </div>
          <div className="card bg-brand-50 border border-brand-100">
            <p className="text-brand-600 font-black text-xs">🦷 Primer diente</p>
            <p className="text-brand-500 text-xs mt-1">Entre los 4 y 7 meses suele aparecer</p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
