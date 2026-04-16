'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/ui/BottomNav'
import Sparkles from '@/components/ui/Sparkles'
import { ARTICULOS_DEFECTO, CATEGORIAS_GUIA, type Articulo } from '@/lib/guias-data'

const ETAPAS_INFO: Record<string, { colorCard: string; borderCard: string; textCard: string; icon: string; sub: string }> = {
  '0-1':  { colorCard: 'bg-green-50',  borderCard: 'border-green-200',  textCard: 'text-green-800',  icon: '👶', sub: '0 – 12 meses'  },
  '2-6':  { colorCard: 'bg-blue-50',   borderCard: 'border-blue-200',   textCard: 'text-blue-800',   icon: '🧒', sub: '2 – 6 años'    },
  '6-12': { colorCard: 'bg-orange-50', borderCard: 'border-orange-200', textCard: 'text-orange-800', icon: '👦', sub: '7 – 12 años'   },
}

const DETALLE_EXTRA: Record<string, { pasos?: string[]; sabiasQue?: string }> = {
  'lavado':       { sabiasQue: 'Los dientes de leche empiezan a formarse en la semana 6 del embarazo.', pasos: ['Coloca el cepillo a 45° hacia la encía','Mueve en círculos suaves sobre cada diente','Cepilla 2 minutos: 30 seg por cuadrante','No olvides limpiar la lengua al final'] },
  'alimentacion': { sabiasQue: 'El zumo de fruta natural tiene la misma cantidad de azúcar que los refrescos.', pasos: ['Evita zumos y bebidas azucaradas','Elige agua como bebida principal','Ofrece fruta entera en vez de zumo','Revisa el etiquetado de los alimentos'] },
  'dentista':     { sabiasQue: 'El 80% de las caries infantiles son prevenibles con buena higiene y visitas regulares.', pasos: ['Revisión cada 6 meses aunque no haya dolor','Lleva el carnet dental actualizado','Cuéntale al dentista sobre dieta y hábitos','Pregunta por selladores preventivos'] },
  'salud':        { sabiasQue: 'La salud oral está directamente relacionada con la salud general del organismo.', pasos: ['Observa los dientes regularmente en casa','Busca manchas blancas o marrones','Atiende el dolor: nunca es normal','Consulta ante cualquier duda'] },
  'ortodoncia':   { sabiasQue: 'Es mejor consultar al ortodoncista a los 7 años aunque no haya problemas visibles.', pasos: ['Consulta temprana a los 6-7 años','Corrige hábitos: chupete, dedo','Trata la respiración bucal','Sigue las revisiones de la ortodoncia'] },
}

function getGuardados(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('sonrisas_guardados') || '[]') } catch { return [] }
}

function removeGuardado(id: string) {
  try {
    const saved: string[] = JSON.parse(localStorage.getItem('sonrisas_guardados') || '[]')
    localStorage.setItem('sonrisas_guardados', JSON.stringify(saved.filter(s => s !== id)))
  } catch {}
}

// ─── Artículo Detalle ───────────────────────────────────────────────────────
function ArticuloDetalle({ articulo, onBack, onUnsave }: { articulo: Articulo; onBack: () => void; onUnsave: () => void }) {
  const [guardado, setGuardado] = useState(true)
  const cat = CATEGORIAS_GUIA.find(c => c.val === articulo.categoria)
  const etapaInfo = ETAPAS_INFO[articulo.etapa] || ETAPAS_INFO['0-1']
  const extra = DETALLE_EXTRA[articulo.categoria] || DETALLE_EXTRA['salud']

  function toggleGuardar() {
    removeGuardado(articulo.id)
    setGuardado(false)
    setTimeout(onUnsave, 400)
  }

  return (
    <div className="app-container">
      <Sparkles />
      <div className="page-content">
        <div className={`rounded-3xl p-5 mb-4 border ${etapaInfo.colorCard} ${etapaInfo.borderCard} relative`}>
          <button onClick={onBack} className={`flex items-center gap-1 ${etapaInfo.textCard} font-bold text-sm mb-4 opacity-70`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Guardados
          </button>
          <button onClick={toggleGuardar}
            className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all
              ${guardado ? 'bg-brand-500 text-white' : 'bg-white/60 text-gray-500'}`}>
            {guardado ? '🔖' : '🗂'}
          </button>
          <div className="text-4xl mb-3">{cat?.icono}</div>
          <h2 className={`text-xl font-black ${etapaInfo.textCard} mb-1`}>{articulo.titulo}</h2>
          <p className={`text-xs font-bold ${etapaInfo.textCard} opacity-60 mb-3`}>{etapaInfo.sub}</p>
          <p className={`text-sm ${etapaInfo.textCard} opacity-80 leading-relaxed`}>{articulo.resumen}</p>
        </div>

        {extra.sabiasQue && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4 flex gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <div>
              <p className="font-black text-yellow-800 text-sm mb-1">¿Sabías que...?</p>
              <p className="text-yellow-700 text-sm leading-relaxed">{extra.sabiasQue}</p>
            </div>
          </div>
        )}

        <div className="card mb-4">
          <h3 className="font-black text-brand-800 mb-3">Contenido</h3>
          <p className="text-brand-700 text-sm leading-relaxed">{articulo.contenido}</p>
        </div>

        {extra.pasos && (
          <div className="card mb-4">
            <h3 className="font-black text-brand-800 mb-3">✅ Pasos a seguir</h3>
            <div className="flex flex-col gap-2">
              {extra.pasos.map((paso, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</div>
                  <p className="text-brand-700 text-sm leading-relaxed">{paso}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Guardados Page ────────────────────────────────────────────────────
export default function GuardadosPage() {
  const router = useRouter()
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [catFiltro, setCatFiltro] = useState<string | null>(null)
  const [articuloAbierto, setArticuloAbierto] = useState<Articulo | null>(null)

  function cargarGuardados() {
    const ids = getGuardados()
    const arts = ARTICULOS_DEFECTO.filter(a => ids.includes(a.id))
    setArticulos(arts)
  }

  useEffect(() => { cargarGuardados() }, [])

  function quitarGuardado(id: string) {
    setArticulos(prev => prev.filter(a => a.id !== id))
    setArticuloAbierto(null)
  }

  if (articuloAbierto) {
    return (
      <ArticuloDetalle
        articulo={articuloAbierto}
        onBack={() => setArticuloAbierto(null)}
        onUnsave={() => quitarGuardado(articuloAbierto.id)}
      />
    )
  }

  const artsFiltrados = catFiltro ? articulos.filter(a => a.categoria === catFiltro) : articulos

  // Get unique categories from saved articles
  const catsDisponibles = CATEGORIAS_GUIA.filter(c => articulos.some(a => a.categoria === c.val))

  return (
    <div className="app-container">
      <Sparkles />
      <div className="page-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-brand-800">SON</span>
            <span className="text-2xl font-black text-green-500">RISAS</span>
          </div>
          <button onClick={() => router.push('/notificaciones')} className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">🔔</button>
        </div>

        <h1 className="text-2xl font-black text-brand-800 mb-1">Guardados</h1>
        <p className="text-brand-400 text-sm mb-5">Artículos que has guardado para leer</p>

        {articulos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-7xl mb-5">🔖</div>
            <h2 className="font-black text-brand-700 text-xl mb-2">Sin artículos guardados</h2>
            <p className="text-brand-400 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
              Guarda artículos desde las Guías tocando el botón 🗂 para acceder después
            </p>
            <button onClick={() => router.push('/dashboard/guias')}
              className="btn-primary">
              Explorar guías
            </button>
          </div>
        ) : (
          <>
            {/* Category filter */}
            {catsDisponibles.length > 1 && (
              <div className="flex gap-2 mb-5 pb-1" style={{overflowX:'auto', flexWrap:'nowrap', scrollbarWidth:'none'}}>
                <button
                  onClick={() => setCatFiltro(null)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold flex-shrink-0 transition-all
                    ${!catFiltro ? 'bg-brand-500 text-white shadow-sm' : 'bg-white text-brand-600 border border-brand-200'}`}>
                  Todos ({articulos.length})
                </button>
                {catsDisponibles.map(c => {
                  const count = articulos.filter(a => a.categoria === c.val).length
                  return (
                    <button key={c.val}
                      onClick={() => setCatFiltro(catFiltro === c.val ? null : c.val)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold flex-shrink-0 transition-all
                        ${catFiltro === c.val ? 'bg-brand-500 text-white shadow-sm' : `${c.bg} text-brand-700`}`}>
                      {c.icono} {c.label} ({count})
                    </button>
                  )
                })}
              </div>
            )}

            {/* Article list */}
            <div className="flex flex-col gap-3">
              {artsFiltrados.map(a => {
                const cat = CATEGORIAS_GUIA.find(c => c.val === a.categoria)
                const etapa = ETAPAS_INFO[a.etapa] || ETAPAS_INFO['0-1']
                return (
                  <button key={a.id} onClick={() => setArticuloAbierto(a)}
                    className="card w-full text-left flex gap-3 active:scale-95 transition-all">
                    <div className={`w-12 h-12 ${cat?.bg || 'bg-brand-100'} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}>
                      {cat?.icono}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-brand-800 text-sm leading-tight mb-1">{a.titulo}</p>
                      <p className="text-brand-500 text-xs leading-relaxed line-clamp-2">{a.resumen}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${etapa.colorCard} ${etapa.textCard}`}>
                          {etapa.icon} {etapa.sub}
                        </span>
                        <span className="text-brand-300 text-[10px] font-semibold">🔖 Guardado</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <p className="text-center text-brand-300 text-xs mt-6 font-semibold">
              {articulos.length} artículo{articulos.length !== 1 ? 's' : ''} guardado{articulos.length !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
