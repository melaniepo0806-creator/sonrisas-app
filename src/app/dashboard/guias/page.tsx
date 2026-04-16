'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/ui/BottomNav'
import Sparkles from '@/components/ui/Sparkles'
import SonrisasLogo from '@/components/ui/SonrisasLogo'

const ETAPAS = [
  { val: '0-1',  label: 'de 0-1',  colorCard: 'bg-green-50', borderCard: 'border-green-200', textCard: 'text-green-800', btnColor: 'bg-green-500', icon: '👶', titulo: 'Primeros dientes', sub: '0 – 12 meses' },
  { val: '2-6',  label: 'de 2-6',  colorCard: 'bg-blue-50',  borderCard: 'border-blue-200',  textCard: 'text-blue-800',  btnColor: 'bg-blue-500',  icon: '🧒', titulo: 'Dientes de leche', sub: '2 – 6 años' },
  { val: '6-12', label: 'de 7-12', colorCard: 'bg-orange-50',borderCard: 'border-orange-200',textCard: 'text-orange-800',btnColor: 'bg-orange-500',icon: '👦', titulo: 'Dientes definitivos', sub: '7 – 12 años' },
]

const CATEGORIAS = [
  { val: 'lavado',       label: 'Lavado de dientes', icono: '🪥', bg: 'bg-blue-100',   ring: 'ring-blue-400'   },
  { val: 'alimentacion', label: 'Alimentación',      icono: '🍎', bg: 'bg-red-100',    ring: 'ring-red-400'    },
  { val: 'dentista',     label: 'Visita al dentista',icono: '🏥', bg: 'bg-teal-100',   ring: 'ring-teal-400'   },
  { val: 'salud',        label: 'Salud',             icono: '🦠', bg: 'bg-green-100',  ring: 'ring-green-400'  },
  { val: 'ortodoncia',   label: 'Ortodoncia',        icono: '😬', bg: 'bg-yellow-100', ring: 'ring-yellow-400' },
]

type Articulo = {
  id: string; titulo: string; resumen: string; contenido: string
  categoria: string; etapa: string; destacado: boolean; orden: number
}

const ARTICULOS_DEFECTO: Articulo[] = [
  { id:'a1', titulo:'Antes del primer diente', resumen:'Aunque todavía no hay dientes, los cuidados empiezan desde el primer día. Limpia las encías con una gasa húmeda.', contenido:'Limpia las encías de tu bebé con una gasa o paño húmedo después de cada toma. Esto elimina las bacterias y habitúa al bebé a la rutina de higiene oral desde el principio. Usa movimientos suaves y circulares. No uses pasta dental hasta que aparezca el primer diente.', categoria:'lavado', etapa:'0-1', destacado:true, orden:1 },
  { id:'a2', titulo:'Tu primer cepillo de dientes', resumen:'Elige un cepillo de cabeza pequeña, cerdas ultra suaves, especial para bebés de 0 a 2 años.', contenido:'Cuando salga el primer diente, empieza a usar un cepillo específico para bebés con cerdas ultra suaves.', categoria:'lavado', etapa:'0-1', destacado:false, orden:2 },
  { id:'a3', titulo:'Cuánta pasta dental usar', resumen:'Hasta los 3 años: una cantidad del tamaño de un grano de arroz. Con flúor desde el primer diente.', contenido:'Para bebés de 0 a 3 años usa pasta dental con flúor en cantidad equivalente a un grano de arroz.', categoria:'lavado', etapa:'0-1', destacado:false, orden:3 },
  { id:'a4', titulo:'Técnica de cepillado para bebés', resumen:'Coloca al bebé en un lugar cómodo. Mueve el cepillo en círculos suaves sobre cada diente y las encías.', contenido:'Sienta al bebé en tu regazo con la cabeza apoyada en tu pecho. Cepilla cada diente individualmente con movimientos circulares suaves durante 2 minutos.', categoria:'lavado', etapa:'0-1', destacado:false, orden:4 },
  { id:'a5', titulo:'Alimentos amigos de los dientes', resumen:'Verduras crujientes, queso, agua y frutas frescas son los mejores aliados para los primeros dientes.', contenido:'Los alimentos que más protegen los dientes del bebé son: verduras crujientes, queso, agua y frutas frescas.', categoria:'alimentacion', etapa:'0-1', destacado:false, orden:5 },
  { id:'a6', titulo:'El biberón y la caries', resumen:'Evita que el bebé se duerma con el biberón. La leche en contacto prolongado con los dientes causa caries de biberón.', contenido:'La caries de biberón ocurre cuando el bebé se duerme con leche o zumo en la boca.', categoria:'alimentacion', etapa:'0-1', destacado:false, orden:6 },
  { id:'a7', titulo:'Azúcar oculto en alimentos', resumen:'Muchos alimentos para bebés contienen azúcar añadido. Aprende a leer las etiquetas.', contenido:'El azúcar oculto está en purés comerciales, galletas para bebés, zumos y yogures azucarados.', categoria:'alimentacion', etapa:'0-1', destacado:false, orden:7 },
  { id:'a8', titulo:'Lactancia y salud dental', resumen:'La lactancia materna no causa caries si se mantiene una buena higiene oral.', contenido:'La leche materna en sí no causa caries, pero si no se limpian los dientes después puede favorecer bacterias.', categoria:'alimentacion', etapa:'0-1', destacado:false, orden:8 },
  { id:'a9', titulo:'Primera visita al dentista', resumen:'La primera visita debe ser cuando aparezca el primer diente o antes del primer cumpleaños.', contenido:'La primera visita al dentista pediátrico debe realizarse cuando aparece el primer diente o al cumplir el año.', categoria:'dentista', etapa:'0-1', destacado:false, orden:9 },
  { id:'a10', titulo:'Qué pasa en la primera visita', resumen:'El dentista revisa las encías, los primeros dientes y te da consejos personalizados.', contenido:'En la primera visita el dentista examina las encías y dientes, evalúa hábitos y aplica flúor si es necesario.', categoria:'dentista', etapa:'0-1', destacado:false, orden:10 },
  { id:'a11', titulo:'Cómo preparar al bebé', resumen:'Juega al dentista en casa, habla positivamente de la visita.', contenido:'Para que la primera visita sea positiva: juega al dentista en casa y habla de la visita de forma positiva.', categoria:'dentista', etapa:'0-1', destacado:false, orden:11 },
  { id:'a12', titulo:'Con qué frecuencia ir al dentista', resumen:'Cada 6 meses para revisión preventiva.', contenido:'La frecuencia recomendada es cada 6 meses para revisiones de rutina.', categoria:'dentista', etapa:'0-1', destacado:false, orden:12 },
  { id:'a13', titulo:'Cómo calmar la molestia', resumen:'Mordedor frío, masajes en las encías y paño frío. Consulta al pediatra si hay fiebre alta.', contenido:'Las mejores formas de aliviar el dolor de la dentición: mordedor refrigerado, masajes suaves en encías.', categoria:'salud', etapa:'0-1', destacado:false, orden:13 },
  { id:'a14', titulo:'La dentición: señales normales', resumen:'Babeo, irritabilidad, morder y encías hinchadas son normales. La fiebre alta no es síntoma de dentición.', contenido:'Los síntomas normales son: babeo excesivo, irritabilidad, necesidad de morder y encías ligeramente inflamadas.', categoria:'salud', etapa:'0-1', destacado:false, orden:14 },
  { id:'a15', titulo:'El flúor: qué es y para qué sirve', resumen:'El flúor fortalece el esmalte y previene las caries. En las cantidades correctas es completamente seguro.', contenido:'El flúor fortalece el esmalte dental y previene las caries. Es seguro en las dosis recomendadas.', categoria:'salud', etapa:'0-1', destacado:false, orden:15 },
  { id:'a16', titulo:'El chupete y los dientes', resumen:'El chupete a partir de los 2 años puede afectar la mordida. Lo ideal es retirarlo antes de los 3 años.', contenido:'El uso del chupete más allá de los 2-3 años puede causar mordida abierta y paladar estrecho.', categoria:'salud', etapa:'0-1', destacado:false, orden:16 },
  { id:'a17', titulo:'Cuándo preocuparse por la mordida', resumen:'Si a los 3-4 años ves que los dientes no encajan bien, consulta a un ortodoncista.', contenido:'Es normal tener espacios entre dientes de leche. Sí conviene consultar si los dientes no se tocan al cerrar.', categoria:'ortodoncia', etapa:'0-1', destacado:false, orden:17 },
  { id:'a18', titulo:'Hábitos que afectan la mordida', resumen:'Chuparse el dedo, el chupete prolongado y la respiración bucal pueden cambiar la posición de los dientes.', contenido:'Los principales hábitos que afectan el desarrollo dental son: chuparse el dedo, chupete prolongado.', categoria:'ortodoncia', etapa:'0-1', destacado:false, orden:18 },
  { id:'b1', titulo:'Cepillado autónomo a partir de los 3 años', resumen:'A los 3 años puedes enseñarle a cepillarse solo, pero supervisa hasta los 8 años.', contenido:'A los 3 años el niño puede empezar a cepillarse con tu supervisión. Enséñale la técnica correcta.', categoria:'lavado', etapa:'2-6', destacado:true, orden:1 },
  { id:'b2', titulo:'El hilo dental en niños', resumen:'Usa hilo dental desde que dos dientes se toquen.', contenido:'El hilo dental debe usarse desde que dos dientes se tocan entre sí, incluso en la dentición de leche.', categoria:'lavado', etapa:'2-6', destacado:false, orden:2 },
  { id:'b3', titulo:'Hacer el cepillado divertido', resumen:'Canciones de 2 minutos, apps de cepillado y rituales hacen que el niño quiera cepillarse.', contenido:'Para motivar a tu hijo: pon una canción de 2 minutos, usa apps interactivas y crea un ritual consistente.', categoria:'lavado', etapa:'2-6', destacado:false, orden:3 },
  { id:'b5', titulo:'Meriendas que protegen los dientes', resumen:'Elige meriendas sin azúcar añadido: fruta fresca, queso, palitos de zanahoria.', contenido:'Las mejores meriendas son: fruta fresca, queso, agua. Evita zumos aunque sean naturales.', categoria:'alimentacion', etapa:'2-6', destacado:false, orden:5 },
  { id:'b6', titulo:'Reducir el azúcar paso a paso', resumen:'No se trata de eliminar el azúcar sino de reducirlo y concentrarlo en las comidas.', contenido:'Estrategias para reducir el impacto: concentra los dulces en comidas, acompaña siempre con agua.', categoria:'alimentacion', etapa:'2-6', destacado:false, orden:6 },
  { id:'b9', titulo:'La revisión de los 3 años', resumen:'A los 3 años el dentista revisa que la dentición de leche esté completa y bien posicionada.', contenido:'A los 3 años el niño debería tener los 20 dientes de leche completos.', categoria:'dentista', etapa:'2-6', destacado:false, orden:9 },
  { id:'b13', titulo:'Detectar caries a tiempo', resumen:'Las manchas blancas son el primer signo de caries. Actuar en esa fase permite tratamientos sin taladro.', contenido:'Las fases de la caries: mancha blanca (reversible), mancha marrón, cavidad visible. Cuanto antes se detecte mejor.', categoria:'salud', etapa:'2-6', destacado:false, orden:13 },
  { id:'c1', titulo:'La muda: cuidar los dientes definitivos', resumen:'Los dientes definitivos no se renuevan. A partir de los 6 años el cepillado es aún más importante.', contenido:'Entre los 6 y 12 años conviven dientes de leche y definitivos. Los definitivos son para toda la vida.', categoria:'lavado', etapa:'6-12', destacado:true, orden:1 },
  { id:'c2', titulo:'Selladores dentales', resumen:'Los selladores protegen las fisuras de los molares definitivos. Son la mejor inversión preventiva.', contenido:'Los selladores son resinas que protegen las fisuras de los molares definitivos. Se aplican sin anestesia.', categoria:'lavado', etapa:'6-12', destacado:false, orden:2 },
  { id:'c13', titulo:'Señales de alerta en la muda', resumen:'Si a los 8 años no han salido todos los incisivos o hay dolor al masticar, visita al dentista.', contenido:'Señales de alerta: dientes definitivos que salen antes de caerse el de leche, dolor al masticar.', categoria:'salud', etapa:'6-12', destacado:false, orden:13 },
]

const DETALLE_EXTRA: Record<string, { pasos?: string[]; sabiasQue?: string }> = {
  'lavado':       { sabiasQue: 'Los dientes de leche empiezan a formarse en la semana 6 del embarazo.', pasos: ['Coloca el cepillo a 45° hacia la encía','Mueve en círculos suaves sobre cada diente','Cepilla 2 minutos: 30 seg por cuadrante','No olvides limpiar la lengua al final'] },
  'alimentacion': { sabiasQue: 'El zumo de fruta natural tiene la misma cantidad de azúcar que los refrescos.', pasos: ['Evita zumos y bebidas azucaradas','Elige agua como bebida principal','Ofrece fruta entera en vez de zumo','Revisa el etiquetado de los alimentos'] },
  'dentista':     { sabiasQue: 'El 80% de las caries infantiles son prevenibles con buena higiene y visitas regulares.', pasos: ['Revisión cada 6 meses aunque no haya dolor','Lleva el carnet dental actualizado','Cuéntale al dentista sobre dieta y hábitos','Pregunta por selladores preventivos'] },
  'salud':        { sabiasQue: 'La salud oral está directamente relacionada con la salud general del organismo.', pasos: ['Observa los dientes regularmente en casa','Busca manchas blancas o marrones','Atiende el dolor: nunca es normal','Consulta ante cualquier duda'] },
  'ortodoncia':   { sabiasQue: 'Es mejor consultar al ortodoncista a los 7 años aunque no haya problemas visibles.', pasos: ['Consulta temprana a los 6-7 años','Corrige hábitos: chupete, dedo','Trata la respiración bucal','Sigue las revisiones de la ortodoncia'] },
}

export default function GuiasPage() {
  const [etapa, setEtapa] = useState('0-1')
  const [catFiltro, setCatFiltro] = useState<string | null>(null)
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [articuloAbierto, setArticuloAbierto] = useState<Articulo | null>(null)
  const [vistaEtapas, setVistaEtapas] = useState(false)

  useEffect(() => {
    async function cargarHijo() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: hijos } = await supabase.from('hijos').select('etapa_dental').eq('parent_id', user.id).limit(1)
      if (hijos?.[0]?.etapa_dental) {
        const e = hijos[0].etapa_dental as string
        if (e === '0-6m' || e === '6-12m' || e === '1-2a') setEtapa('0-1')
        else if (e === '2-6a') setEtapa('2-6')
        else setEtapa('6-12')
      }
    }
    cargarHijo()
  }, [])

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('articulos').select('*').eq('etapa', etapa).order('orden')
      setArticulos(data && data.length > 0 ? data : ARTICULOS_DEFECTO.filter(a => a.etapa === etapa))
    }
    cargar()
  }, [etapa])

  if (articuloAbierto) return <ArticuloDetalle articulo={articuloAbierto} onBack={() => setArticuloAbierto(null)} />
  if (vistaEtapas) return <VistaEtapas onBack={() => setVistaEtapas(false)} onSelectArticulo={setArticuloAbierto} articulos={ARTICULOS_DEFECTO} />

  const artsFiltrados = catFiltro ? articulos.filter(a => a.categoria === catFiltro) : articulos
  const destacado = artsFiltrados.find(a => a.destacado) || artsFiltrados[0]
  const recientes = artsFiltrados.filter(a => a.id !== destacado?.id)
  const etapaInfo = ETAPAS.find(e => e.val === etapa)!
  const catInfo = catFiltro ? CATEGORIAS.find(c => c.val === catFiltro) : null

  return (
    <div className="app-container">
      <Sparkles />
      <div className="page-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <SonrisasLogo size={36} />
            <h1 className="text-2xl font-black text-brand-800">Guía</h1>
          </div>
          <div className="flex gap-2">
            <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm text-brand-500 text-lg">🔖</button>
            <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm text-brand-500 text-lg">🔔</button>
          </div>
        </div>

        {/* Etapa tabs */}
        <div className="flex gap-2 mb-5">
          {ETAPAS.map(e => (
            <button key={e.val} onClick={() => { setEtapa(e.val); setCatFiltro(null) }}
              className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all
                ${etapa === e.val ? 'bg-brand-500 text-white shadow-md' : 'bg-white text-brand-500 border-2 border-brand-100'}`}>
              {e.label}
            </button>
          ))}
        </div>

        {/* === Vista por categoría (cuando hay filtro activo) === */}
        {catFiltro ? (
          <>
            {/* Category header */}
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setCatFiltro(null)} className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm text-brand-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div className={`w-10 h-10 rounded-full ${catInfo?.bg} flex items-center justify-center text-xl`}>{catInfo?.icono}</div>
              <div>
                <h2 className="font-black text-brand-800 text-lg">{catInfo?.label}</h2>
                <p className="text-brand-400 text-xs">{artsFiltrados.length} artículos</p>
              </div>
            </div>

            {/* Artículos destacados */}
            {destacado && (
              <>
                <h3 className="font-black text-brand-800 text-base mb-3">Artículos destacados</h3>
                <button onClick={() => setArticuloAbierto(destacado)}
                  className={`w-full text-left rounded-3xl p-4 mb-4 border active:scale-95 transition-all ${etapaInfo.colorCard} ${etapaInfo.borderCard}`}>
                  <p className={`text-xs font-bold mb-1 ${etapaInfo.textCard} opacity-60`}>{catInfo?.icono} {catInfo?.label}</p>
                  <h4 className={`font-black text-lg leading-snug mb-2 ${etapaInfo.textCard}`}>{destacado.titulo}</h4>
                  <p className={`text-sm leading-relaxed mb-3 opacity-75 ${etapaInfo.textCard}`}>{destacado.resumen}</p>
                  <span className={`${etapaInfo.btnColor} text-white text-xs font-black px-4 py-2 rounded-xl inline-block`}>Ver guía →</span>
                </button>
              </>
            )}

            {/* Artículos de la categoría en grid */}
            {recientes.length > 0 && (
              <>
                <h3 className="font-black text-brand-800 text-base mb-3">Todos los artículos</h3>
                <div className="grid grid-cols-2 gap-3 pb-4">
                  {recientes.map((a, i) => {
                    const cat = CATEGORIAS.find(c => c.val === a.categoria)
                    return (
                      <button key={a.id} onClick={() => setArticuloAbierto(a)}
                        className={`rounded-3xl p-4 text-left shadow-sm active:scale-95 transition-all min-h-[110px] flex flex-col justify-between border
                          ${i === 0 ? 'bg-brand-500 text-white border-brand-400' : 'bg-white text-brand-800 border-gray-100'}`}>
                        <p className={`font-black text-sm leading-snug ${i === 0 ? 'text-white' : 'text-brand-800'}`}>{a.titulo}</p>
                        <p className={`text-xs mt-2 ${i === 0 ? 'text-white/70' : 'text-gray-400'}`}>{cat?.icono} {cat?.label}</p>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* === Vista principal (sin filtro) === */}

            {/* Categorías */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-brand-800 text-base">Categorías</h3>
              <button onClick={() => setVistaEtapas(true)} className="text-brand-500 text-xs font-bold">Ver todo →</button>
            </div>
            <div className="flex gap-4 pb-3 mb-5 -mx-5 px-5" style={{overflowX:'auto', flexWrap:'nowrap', scrollbarWidth:'none', msOverflowStyle:'none'}}>
              {CATEGORIAS.map(c => (
                <button key={c.val} onClick={() => setCatFiltro(c.val)}
                  className="flex flex-col items-center gap-2 flex-shrink-0 active:scale-95 transition-all">
                  <div className={`w-16 h-16 ${c.bg} rounded-full flex items-center justify-center text-2xl shadow-sm
                    ${catFiltro === c.val ? `ring-2 ${c.ring} scale-110` : ''}`}>
                    {c.icono}
                  </div>
                  <span className="text-[10px] text-brand-700 font-semibold text-center w-16 leading-tight">{c.label}</span>
                </button>
              ))}
            </div>

            {/* Destacado */}
            {destacado && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-brand-800 text-base">Destacado para esta etapa</h3>
                  <span className="text-brand-500 text-xs font-bold">Ver todo →</span>
                </div>
                <button onClick={() => setArticuloAbierto(destacado)}
                  className={`w-full text-left rounded-3xl p-5 mb-5 border active:scale-95 transition-all ${etapaInfo.colorCard} ${etapaInfo.borderCard}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className={`text-xs font-bold mb-1 ${etapaInfo.textCard} opacity-60`}>{etapaInfo.titulo} — {etapaInfo.sub}</p>
                      <h4 className={`font-black text-xl leading-snug mb-2 ${etapaInfo.textCard}`}>{destacado.titulo}</h4>
                      <p className={`text-sm leading-relaxed mb-4 opacity-75 ${etapaInfo.textCard}`}>{destacado.resumen}</p>
                      <span className={`${etapaInfo.btnColor} text-white text-xs font-black px-5 py-2.5 rounded-2xl inline-block`}>Ver guía →</span>
                    </div>
                    <div className="text-5xl flex-shrink-0 mt-1">{etapaInfo.icon}</div>
                  </div>
                </button>
              </>
            )}

            {/* Artículos recientes */}
            {recientes.length > 0 && (
              <>
                <h3 className="font-black text-brand-800 text-base mb-3">Artículos recientes</h3>
                <div className="grid grid-cols-2 gap-3 pb-4">
                  {recientes.slice(0, 6).map((a, i) => {
                    const cat = CATEGORIAS.find(c => c.val === a.categoria)
                    return (
                      <button key={a.id} onClick={() => setArticuloAbierto(a)}
                        className={`rounded-3xl p-4 text-left shadow-sm active:scale-95 transition-all min-h-[110px] flex flex-col justify-between border
                          ${i === 0 ? 'bg-brand-500 text-white border-brand-400' : 'bg-white text-brand-800 border-gray-100'}`}>
                        <p className={`font-black text-sm leading-snug ${i === 0 ? 'text-white' : 'text-brand-800'}`}>{a.titulo}</p>
                        <p className={`text-xs mt-2 ${i === 0 ? 'text-white/70' : 'text-gray-400'}`}>{cat?.icono} {cat?.label}</p>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {articulos.length === 0 && (
              <div className="text-center text-brand-400 py-12">
                <p className="text-5xl mb-3">📚</p>
                <p className="font-black text-brand-600">Contenido en camino</p>
                <p className="text-sm mt-1">Pronto tendrás guías para esta etapa</p>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

// ─── Vista Etapas (Guías por etapa) ───────────────────────────────────────────
function VistaEtapas({ onBack, onSelectArticulo, articulos }: {
  onBack: () => void
  onSelectArticulo: (a: Articulo) => void
  articulos: Articulo[]
}) {
  const etapasGuia = [
    { rango: '0 a 6 meses', titulo: 'Antes del primer diente', desc: 'Aunque todavía no hay dientes, los cuidados empiezan...', color: 'bg-purple-50 border-purple-200', btnColor: 'bg-purple-500', artIds: ['a1'] },
    { rango: '6 a 12 meses', titulo: 'Los primeros dientes', desc: '¡Ya asoman los primeros dientes! Es un momento emocionante...', color: 'bg-green-50 border-green-200', btnColor: 'bg-green-500', artIds: ['a1','a2','a3'] },
    { rango: '1 a 3 años', titulo: 'Dentición de leche', desc: 'La boca se llena de dientes de leche. Los hábitos comienzan...', color: 'bg-blue-50 border-blue-200', btnColor: 'bg-blue-500', artIds: ['b1','b2'] },
    { rango: '3 a 6 años', titulo: 'Preparando los definitivos', desc: 'Los dientes definitivos ya están formándose dentro...', color: 'bg-orange-50 border-orange-200', btnColor: 'bg-orange-500', artIds: ['b1','b9'] },
    { rango: '6 a 12 años', titulo: 'Preparando los definitivos fase 2', desc: 'Los primeros definitivos ya están saliendo...', color: 'bg-pink-50 border-pink-200', btnColor: 'bg-pink-500', artIds: ['c1','c2'] },
  ]

  return (
    <div className="app-container">
      <Sparkles />
      <div className="page-content">
        {/* Header card */}
        <div className="card bg-purple-50 border border-purple-200 mb-5">
          <button onClick={onBack} className="flex items-center gap-1 text-purple-500 font-bold text-sm mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Volver
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-brand-800 text-xl mb-1">Guías por etapas</h2>
              <p className="text-brand-500 text-xs">0 - 12 años</p>
              <p className="text-brand-400 text-xs">Contenido adaptado a cada momento</p>
            </div>
            <div className="text-5xl">👶</div>
          </div>
        </div>

        {/* Etapa cards */}
        <div className="flex flex-col gap-4 pb-4">
          {etapasGuia.map((eg, i) => {
            const art = articulos.find(a => eg.artIds.includes(a.id))
            return (
              <div key={i} className={`card border ${eg.color} active:scale-95 transition-all`}>
                <p className={`text-xs font-bold mb-1 opacity-60 text-brand-600`}>{eg.rango}</p>
                <h4 className="font-black text-brand-800 text-lg mb-2">{eg.titulo}</h4>
                <p className="text-brand-600 text-sm mb-4 leading-relaxed">{eg.desc}</p>
                <button onClick={() => art && onSelectArticulo(art)}
                  className={`${eg.btnColor} text-white text-xs font-black px-5 py-2.5 rounded-2xl`}>
                  Ver guía →
                </button>
              </div>
            )
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

// ─── Artículo Detalle ─────────────────────────────────────────────────────────
function ArticuloDetalle({ articulo, onBack }: { articulo: Articulo; onBack: () => void }) {
  const [guardado, setGuardado] = useState(false)
  const cat = CATEGORIAS.find(c => c.val === articulo.categoria)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sonrisas_guardados') || '[]')
      setGuardado(saved.includes(articulo.id))
    } catch {}
  }, [articulo.id])

  function toggleGuardar() {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('sonrisas_guardados') || '[]')
      const newSaved = saved.includes(articulo.id) ? saved.filter((id: string) => id !== articulo.id) : [...saved, articulo.id]
      localStorage.setItem('sonrisas_guardados', JSON.stringify(newSaved))
      setGuardado(!guardado)
    } catch {}
  }
  const extra = DETALLE_EXTRA[articulo.categoria] || DETALLE_EXTRA['salud']
  const etapaInfo = ETAPAS.find(e => e.val === articulo.etapa)!

  return (
    <div className="app-container">
      <Sparkles />
      <div className="page-content">
        {/* Header card */}
        <div className={`rounded-3xl p-5 mb-4 border ${etapaInfo.colorCard} ${etapaInfo.borderCard} relative`}>
          <button onClick={onBack} className={`flex items-center gap-1 ${etapaInfo.textCard} font-bold text-sm mb-4 opacity-70`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Guías
          </button>
          <button onClick={toggleGuardar} className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all ${guardado ? 'bg-brand-500 text-white' : 'bg-white/60 text-gray-500'}`}>{guardado ? '🔖' : '🗂'}</button>
          <div className="text-4xl mb-3">{cat?.icono}</div>
          <h2 className={`text-xl font-black ${etapaInfo.textCard} mb-1`}>{articulo.titulo}</h2>
          <p className={`text-xs font-bold ${etapaInfo.textCard} opacity-60 mb-3`}>{etapaInfo.sub}</p>
          <p className={`text-sm ${etapaInfo.textCard} opacity-80 leading-relaxed`}>{articulo.resumen}</p>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mb-5 pb-1" style={{overflowX:'auto', flexWrap:'nowrap', scrollbarWidth:'none'}}>
          {CATEGORIAS.slice(0,3).map(c => (
            <div key={c.val} className={`${c.bg} flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0
              ${c.val === articulo.categoria ? 'ring-2 ring-brand-500' : 'opacity-50'}`}>
              {c.icono} {c.label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <h3 className="font-black text-brand-800 text-base mb-3">Información clave</h3>
        <p className="text-brand-600 text-sm leading-relaxed mb-5 bg-white rounded-2xl p-4 shadow-sm">
          {articulo.contenido}
        </p>

        {/* Pasos */}
        {extra.pasos && (
          <>
            <h3 className="font-black text-brand-800 text-base mb-3">¿Qué hacer?</h3>
            <div className="flex flex-col gap-2 mb-5">
              {extra.pasos.map((paso, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0
                    ${['bg-purple-500','bg-blue-500','bg-green-500','bg-orange-400'][i % 4]}`}>{i+1}</div>
                  <p className="text-brand-700 text-sm leading-relaxed">{paso}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Sabías que */}
        {extra.sabiasQue && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-5">
            <p className="text-yellow-700 font-black text-sm mb-1">💡 Sabías que...</p>
            <p className="text-yellow-600 text-sm leading-relaxed">{extra.sabiasQue}</p>
          </div>
        )}

        {/* Video */}
        <h3 className="font-black text-brand-800 text-base mb-3">Video tutorial</h3>
        <div className="bg-brand-200 rounded-3xl h-48 flex flex-col items-center justify-center mb-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-300 to-brand-500 opacity-60" />
          <div className="w-16 h-16 bg-white/70 rounded-full flex items-center justify-center z-10 shadow-lg">
            <span className="text-brand-600 text-3xl ml-1">▶</span>
          </div>
          <p className="text-white font-bold text-sm mt-3 z-10">Ver tutorial</p>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
