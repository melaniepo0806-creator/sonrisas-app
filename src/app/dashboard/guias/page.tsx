'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/ui/BottomNav'
import Sparkles from '@/components/ui/Sparkles'

// ────────────────────────────────────────────────────────────
// Datos base (fallback si la BD está vacía)
// ────────────────────────────────────────────────────────────
const ETAPAS = [
  { val: '0-1',  label: 'de 0-1',  color: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: '👶', titulo: 'Primeros dientes', sub: '0 – 12 meses' },
  { val: '2-6',  label: 'de 2-6',  color: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  icon: '🧒', titulo: 'Dientes de leche', sub: '2 – 6 años' },
  { val: '6-12', label: 'de 7-12', color: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: '👦', titulo: 'Dientes definitivos', sub: '7 – 12 años' },
]

const CATEGORIAS = [
  { val: 'lavado',      label: 'Lavado de dientes', icono: '🪥', colorBg: 'bg-blue-100',   colorText: 'text-blue-700'   },
  { val: 'alimentacion', label: 'Alimentación',      icono: '🍎', colorBg: 'bg-red-100',    colorText: 'text-red-700'    },
  { val: 'dentista',    label: 'Visita al dentista', icono: '🏥', colorBg: 'bg-green-100',  colorText: 'text-green-700'  },
  { val: 'salud',       label: 'Salud',              icono: '💊', colorBg: 'bg-purple-100', colorText: 'text-purple-700' },
  { val: 'ortodoncia',  label: 'Ortodoncia',         icono: '😬', colorBg: 'bg-yellow-100', colorText: 'text-yellow-700' },
]

type Articulo = {
  id: string; titulo: string; resumen: string; contenido: string
  categoria: string; etapa: string; destacado: boolean; orden: number
}

// Artículos predeterminados (ricos en contenido)
const ARTICULOS_DEFECTO: Articulo[] = [
  // ETAPA 0-1 LAVADO
  { id:'a1', titulo:'Antes del primer diente', resumen:'Aunque todavía no hay dientes, los cuidados empiezan desde el primer día. Limpia las encías con una gasa húmeda.', contenido:'Limpia las encías de tu bebé con una gasa o paño húmedo después de cada toma. Esto elimina las bacterias y habitúa al bebé a la rutina de higiene oral desde el principio. Usa movimientos suaves y circulares. No uses pasta dental hasta que aparezca el primer diente.', categoria:'lavado', etapa:'0-1', destacado:true, orden:1 },
  { id:'a2', titulo:'Tu primer cepillo de dientes', resumen:'Elige un cepillo de cabeza pequeña, cerdas ultra suaves, especial para bebés de 0 a 2 años.', contenido:'Cuando salga el primer diente, empieza a usar un cepillo específico para bebés. Debe tener cabeza muy pequeña para llegar a todos los rincones, cerdas ultra suaves para no dañar las encías y mango ergonómico para que sea fácil de usar.', categoria:'lavado', etapa:'0-1', destacado:false, orden:2 },
  { id:'a3', titulo:'Cuánta pasta dental usar', resumen:'Hasta los 3 años: una cantidad del tamaño de un grano de arroz. Con flúor desde el primer diente.', contenido:'Para bebés de 0 a 3 años usa pasta dental con flúor en cantidad equivalente a un grano de arroz. El flúor es esencial para fortalecer el esmalte. A partir de los 3 años puedes aumentar a una cantidad del tamaño de un guisante.', categoria:'lavado', etapa:'0-1', destacado:false, orden:3 },
  { id:'a4', titulo:'Técnica de cepillado para bebés', resumen:'Coloca al bebé en un lugar cómodo. Mueve el cepillo en círculos suaves sobre cada diente y las encías.', contenido:'Sienta al bebé en tu regazo con la cabeza apoyada en tu pecho. Cepilla cada diente individualmente con movimientos circulares suaves durante 2 minutos. Presta especial atención a la línea de la encía. Termina siempre limpiando la lengua.', categoria:'lavado', etapa:'0-1', destacado:false, orden:4 },
  // ETAPA 0-1 ALIMENTACIÓN
  { id:'a5', titulo:'Alimentos amigos de los dientes', resumen:'Verduras crujientes, queso, agua y frutas frescas son los mejores aliados para los primeros dientes.', contenido:'Los alimentos que más protegen los dientes del bebé son: verduras crujientes como zanahorias, queso (que neutraliza los ácidos), agua (especialmente después de comer) y frutas frescas ricas en agua. Evita los zumos y los snacks azucarados.', categoria:'alimentacion', etapa:'0-1', destacado:false, orden:5 },
  { id:'a6', titulo:'El biberón y la caries', resumen:'Evita que el bebé se duerma con el biberón. La leche en contacto prolongado con los dientes causa caries de biberón.', contenido:'La caries de biberón ocurre cuando el bebé se duerme con leche o zumo en la boca. Los azúcares de la leche alimentan las bacterias que producen ácidos que destruyen el esmalte. Solución: nunca dejes que se duerma con biberón y limpia sus dientes después de cada toma.', categoria:'alimentacion', etapa:'0-1', destacado:false, orden:6 },
  { id:'a7', titulo:'Azúcar oculto en alimentos', resumen:'Muchos alimentos para bebés contienen azúcar añadido. Aprende a leer las etiquetas.', contenido:'El azúcar oculto está en purés comerciales, galletas para bebés, zumos, yogures azucarados y cereales. Revisa siempre el etiquetado: busca palabras como sacarosa, fructosa, jarabe de maíz o glucosa. Elige opciones sin azúcar añadido siempre que puedas.', categoria:'alimentacion', etapa:'0-1', destacado:false, orden:7 },
  { id:'a8', titulo:'Lactancia y salud dental', resumen:'La lactancia materna no causa caries si se mantiene una buena higiene oral. Sí puede haber riesgo si no se limpian los dientes.', contenido:'La leche materna en sí no causa caries, pero si el bebé se queda dormido con el pecho y no se limpian los dientes después, el azúcar residual puede favorecer las bacterias cariogénicas. Lo importante es limpiar los dientes después de cada toma, especialmente la nocturna.', categoria:'alimentacion', etapa:'0-1', destacado:false, orden:8 },
  // ETAPA 0-1 DENTISTA
  { id:'a9', titulo:'Primera visita al dentista', resumen:'La primera visita debe ser cuando aparezca el primer diente o antes del primer cumpleaños. Cuanto antes, mejor.', contenido:'La primera visita al dentista pediátrico debe realizarse cuando aparece el primer diente o a más tardar al cumplir el año. Es una visita preventiva para revisar el desarrollo dental, dar consejos de higiene y que el bebé se acostumbre al entorno dental sin miedo.', categoria:'dentista', etapa:'0-1', destacado:false, orden:9 },
  { id:'a10', titulo:'Qué pasa en la primera visita', resumen:'El dentista revisa las encías, los primeros dientes y te da consejos personalizados de higiene y alimentación.', contenido:'En la primera visita el dentista: examina las encías y dientes, comprueba el frenillo lingual si es necesario, evalúa hábitos (biberón, lactancia, chupete), aplica flúor si es necesario y da consejos específicos para tu bebé. Suele durar 20-30 minutos y es muy tranquila.', categoria:'dentista', etapa:'0-1', destacado:false, orden:10 },
  { id:'a11', titulo:'Cómo preparar al bebé para el dentista', resumen:'Juega al dentista en casa, habla positivamente de la visita y nunca uses el dentista como amenaza.', contenido:'Para que la primera visita sea positiva: juega al dentista en casa antes de ir, habla de la visita de forma positiva y emocionante, nunca uses expresiones como "no te va a doler" (genera anticipación negativa), elige un dentista pediátrico especializado en niños pequeños y lleva su juguete favorito.', categoria:'dentista', etapa:'0-1', destacado:false, orden:11 },
  { id:'a12', titulo:'Con qué frecuencia ir al dentista', resumen:'Cada 6 meses para revisión preventiva. Si hay algún problema, antes.', contenido:'La frecuencia recomendada es cada 6 meses para revisiones de rutina. Sin embargo, si observas manchas, puntos oscuros en los dientes, el bebé se queja de dolor al masticar o ves encías inflamadas, ve al dentista antes de la revisión programada.', categoria:'dentista', etapa:'0-1', destacado:false, orden:12 },
  // ETAPA 0-1 SALUD
  { id:'a13', titulo:'Cómo calmar la molestia de la dentición', resumen:'Mordedor frío, masajes en las encías y paño frío. Consulta al pediatra si hay fiebre alta.', contenido:'Las mejores formas de aliviar el dolor de la dentición: mordedor refrigerado (no congelado) por 10-15 minutos, masajear suavemente las encías con un dedo limpio en movimientos circulares, paño frío y limpio para morder. Ante fiebre superior a 38.5°C consulta al pediatra.', categoria:'salud', etapa:'0-1', destacado:false, orden:13 },
  { id:'a14', titulo:'La dentición: señales normales', resumen:'Babeo, irritabilidad, morder y encías hinchadas son normales. La fiebre alta y la diarrea no son síntomas de dentición.', contenido:'Los síntomas normales de la dentición son: babeo excesivo, irritabilidad, necesidad de morder objetos, encías ligeramente inflamadas y temperatura corporal algo elevada (hasta 37.5°C). La fiebre alta (más de 38°C), la diarrea y el vómito NO son síntomas de dentición y deben consultarse con el pediatra.', categoria:'salud', etapa:'0-1', destacado:false, orden:14 },
  { id:'a15', titulo:'El flúor: qué es y para qué sirve', resumen:'El flúor fortalece el esmalte y previene las caries. En las cantidades correctas es completamente seguro.', contenido:'El flúor es un mineral que fortalece el esmalte dental y previene las caries actuando de tres maneras: remineraliza el esmalte dañado, inhibe las bacterias cariogénicas y hace el diente más resistente a los ácidos. Es completamente seguro en las dosis recomendadas: grano de arroz hasta los 3 años, guisante de 3 a 6 años.', categoria:'salud', etapa:'0-1', destacado:false, orden:15 },
  { id:'a16', titulo:'El chupete y los dientes', resumen:'El chupete a partir de los 2 años puede afectar la mordida. Lo ideal es retirarlo antes de los 3 años.', contenido:'El uso del chupete más allá de los 2-3 años puede causar: mordida abierta (espacio entre los dientes superiores e inferiores), paladar estrecho y problemas de pronunciación. Para retirarlo de forma progresiva: reduce los momentos de uso, solo para dormir, y luego elimínalo con una estrategia positiva.', categoria:'salud', etapa:'0-1', destacado:false, orden:16 },
  // ETAPA 0-1 ORTODONCIA
  { id:'a17', titulo:'Cuándo preocuparse por la mordida', resumen:'Si a los 3-4 años ves que los dientes no encajan bien o hay espacios inusuales, consulta a un ortodoncista.', contenido:'Es normal tener espacios entre los dientes de leche: hacen falta para que entren los dientes definitivos. Sí conviene consultar si: los dientes superiores e inferiores no se tocan al cerrar la boca, hay mordida cruzada (dientes de abajo por delante de los de arriba) o si el niño ronca habitualmente.', categoria:'ortodoncia', etapa:'0-1', destacado:false, orden:17 },
  { id:'a18', titulo:'Hábitos que afectan la mordida', resumen:'Chuparse el dedo, el chupete prolongado y la respiración bucal pueden cambiar la posición de los dientes.', contenido:'Los principales hábitos que afectan el desarrollo dental son: chuparse el dedo (más perjudicial que el chupete por la presión constante), chupete más allá de los 3 años, respiración bucal crónica y deglución atípica. La detección y corrección temprana evita tratamientos más complejos.', categoria:'ortodoncia', etapa:'0-1', destacado:false, orden:18 },
  // ETAPA 2-6 LAVADO
  { id:'b1', titulo:'Cepillado autónomo a partir de los 3 años', resumen:'A los 3 años puedes enseñarle a cepillarse solo, pero supervisa hasta los 8 años. La técnica importa.', contenido:'A los 3 años el niño puede empezar a cepillarse con tu supervisión. Enséñale la técnica: cepillo a 45° hacia las encías, movimientos circulares suaves, 2 minutos mínimo. Hasta los 8 años sigue supervisando o terminando tú el cepillado para garantizar la calidad.', categoria:'lavado', etapa:'2-6', destacado:true, orden:1 },
  { id:'b2', titulo:'El hilo dental en niños', resumen:'Usa hilo dental desde que dos dientes se toquen. Los palillos de hilo son más fáciles para los niños.', contenido:'El hilo dental debe usarse desde que dos dientes se tocan entre sí, incluso en la dentición de leche. Los porta-hilos o flossers son más fáciles para niños pequeños. Úsalo una vez al día, preferiblemente por la noche. El cepillo no llega a los espacios entre dientes.', categoria:'lavado', etapa:'2-6', destacado:false, orden:2 },
  { id:'b3', titulo:'Hacer el cepillado divertido', resumen:'Canciones de 2 minutos, aplicaciones de cepillado, recompensas y rituales hacen que el niño quiera cepillarse.', contenido:'Para motivar a tu hijo a cepillarse: pon una canción de 2 minutos (la duración exacta del cepillado), usa apps interactivas de cepillado, déjale elegir su propio cepillo y pasta (con tu supervisión), crea un ritual consistente y usa un calendario de registro con pegatinas.', categoria:'lavado', etapa:'2-6', destacado:false, orden:3 },
  // ETAPA 2-6 ALIMENTACIÓN
  { id:'b5', titulo:'Meriendas que protegen los dientes', resumen:'Elige meriendas sin azúcar añadido: fruta fresca, queso, palitos de zanahoria, frutos secos (de 4 años en adelante).', contenido:'Las mejores meriendas para los dientes son: fruta fresca (manzana, pera, zanahoria crudas que limpian mecánicamente), queso (neutraliza los ácidos), agua, palomitas sin sal ni azúcar. Evita: zumos aunque sean naturales, galletas, bollería y gominolas que se pegan a los dientes.', categoria:'alimentacion', etapa:'2-6', destacado:false, orden:5 },
  { id:'b6', titulo:'Reducir el azúcar paso a paso', resumen:'No se trata de eliminar el azúcar completamente, sino de reducirlo y concentrarlo en las comidas principales.', contenido:'Estrategias para reducir el impacto del azúcar: concentra los dulces en las comidas principales (no entre horas), acompaña siempre con agua, cepilla los dientes después de consumir azúcar, ofrece alternativas naturales y enseña al niño a leer etiquetas para identificar el azúcar oculto.', categoria:'alimentacion', etapa:'2-6', destacado:false, orden:6 },
  // ETAPA 2-6 DENTISTA
  { id:'b9', titulo:'La revisión de los 3 años', resumen:'A los 3 años el pediatra o dentista revisa que la dentición de leche esté completa y bien posicionada.', contenido:'A los 3 años el niño debería tener los 20 dientes de leche completos. En la revisión se comprueba: presencia y posición de todos los dientes, estado del esmalte, mordida y hábitos (chupete, dedo), necesidad de selladores preventivos y estado de la higiene oral.', categoria:'dentista', etapa:'2-6', destacado:false, orden:9 },
  // ETAPA 2-6 SALUD
  { id:'b13', titulo:'Detectar caries a tiempo', resumen:'Las manchas blancas son el primer signo de caries. Actuar en esa fase permite tratamientos sin taladro.', contenido:'Las fases de la caries: mancha blanca (reversible con flúor y dieta), mancha marrón (inicio de cavidad, necesita tratamiento), cavidad visible (requiere obturación), caries profunda (puede afectar al nervio). Cuanto antes se detecte, más sencillo es el tratamiento. Las revisiones semestrales son clave.', categoria:'salud', etapa:'2-6', destacado:false, orden:13 },
  // ETAPA 6-12 LAVADO
  { id:'c1', titulo:'La muda: cuidar los dientes definitivos', resumen:'Los dientes definitivos no se renuevan. A partir de los 6 años, el cepillado es aún más importante.', contenido:'Entre los 6 y los 12 años conviven dientes de leche y definitivos. Los definitivos que salen (primeros molares a los 6 años, incisivos centrales) son para toda la vida. Es el momento de reforzar la técnica de cepillado, introducir el hilo dental de forma autónoma y mantener las revisiones semestrales.', categoria:'lavado', etapa:'6-12', destacado:true, orden:1 },
  { id:'c2', titulo:'Selladores dentales', resumen:'Los selladores protegen las fisuras de los molares definitivos. Son la mejor inversión preventiva.', contenido:'Los selladores son resinas que se aplican en las fisuras (surcos) de los molares definitivos para protegerlos de las caries. Se aplican sin anestesia, en una sola visita, son indoloros y pueden durar 5-10 años. Son especialmente importantes en los primeros molares que salen a los 6 años.', categoria:'lavado', etapa:'6-12', destacado:false, orden:2 },
  { id:'c13', titulo:'Señales de alerta en la muda', resumen:'Si a los 8 años no han salido todos los incisivos o si hay dolor al masticar, visita al dentista.', contenido:'Señales de alerta durante la muda que requieren consulta: dientes definitivos que salen antes de caerse el de leche (quedando doble fila), diente definitivo que no sale cuando debería, dolor al masticar, encías muy inflamadas al cambiar los dientes, o asimetría notable en la muda.', categoria:'salud', etapa:'6-12', destacado:false, orden:13 },
]

// ────────────────────────────────────────────────────────────
// Contenido detallado por artículo (para la vista detalle)
// ────────────────────────────────────────────────────────────
const DETALLE_EXTRA: Record<string, { pasos?: string[]; sabiasQue?: string; colorHdr: string; colorBg: string }> = {
  'lavado':      { colorHdr: 'from-blue-400 to-blue-600',   colorBg: 'bg-blue-50',   sabiasQue: 'Los dientes de leche empiezan a formarse en la semana 6 del embarazo.', pasos: ['Coloca el cepillo a 45° hacia la encía','Mueve en círculos suaves sobre cada diente','Cepilla 2 minutos: 30 seg por cuadrante','No olvides la lengua al final'] },
  'alimentacion':{ colorHdr: 'from-red-400 to-orange-500',  colorBg: 'bg-red-50',    sabiasQue: 'El zumo de fruta natural tiene la misma cantidad de azúcar que los refrescos.', pasos: ['Evita zumos y bebidas azucaradas','Elige agua como bebida principal','Ofrece fruta entera en vez de zumo','Revisa el etiquetado de los alimentos'] },
  'dentista':    { colorHdr: 'from-green-400 to-teal-500',  colorBg: 'bg-green-50',  sabiasQue: 'El 80% de las caries infantiles son prevenibles con buena higiene y visitas regulares.', pasos: ['Revisión cada 6 meses aunque no haya dolor','Lleva el carnet dental actualizado','Cuéntale al dentista sobre dieta y hábitos','Pregunta por selladores preventivos'] },
  'salud':       { colorHdr: 'from-purple-400 to-violet-600',colorBg:'bg-purple-50', sabiasQue: 'La salud oral está directamente relacionada con la salud general del organismo.', pasos: ['Observa los dientes regularmente en casa','Busca manchas blancas o marrones','Atiende el dolor: nunca es normal','Consulta ante cualquier duda'] },
  'ortodoncia':  { colorHdr: 'from-yellow-400 to-amber-500', colorBg: 'bg-yellow-50', sabiasQue: 'Es mejor consultar al ortodoncista a los 7 años aunque no haya problemas visibles.', pasos: ['Consulta temprana a los 6-7 años','Corrige hábitos: chupete, dedo','Trata la respiración bucal','Sigue las revisiones de la ortodoncia'] },
}

// ────────────────────────────────────────────────────────────
// Componente Principal
// ────────────────────────────────────────────────────────────
export default function GuiasPage() {
  const [etapa, setEtapa] = useState('0-1')
  const [catFiltro, setCatFiltro] = useState<string | null>(null)
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [articuloAbierto, setArticuloAbierto] = useState<Articulo | null>(null)

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
      if (data && data.length > 0) {
        setArticulos(data)
      } else {
        setArticulos(ARTICULOS_DEFECTO.filter(a => a.etapa === etapa))
      }
    }
    cargar()
  }, [etapa])

  if (articuloAbierto) return <ArticuloDetalle articulo={articuloAbierto} onBack={() => setArticuloAbierto(null)} />

  const artsFiltrados = catFiltro ? articulos.filter(a => a.categoria === catFiltro) : articulos
  const destacado = artsFiltrados.find(a => a.destacado)
  const recientes = artsFiltrados.filter(a => !a.destacado)
  const etapaInfo = ETAPAS.find(e => e.val === etapa)!

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
            <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-brand-500 shadow-sm">🔖</button>
            <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-brand-500 shadow-sm">🔔</button>
          </div>
        </div>

        {/* Tabs etapa */}
        <div className="flex gap-2 mb-5">
          {ETAPAS.map(e => (
            <button key={e.val} onClick={() => { setEtapa(e.val); setCatFiltro(null) }}
              className={`flex-1 py-2.5 rounded-2xl font-bold text-sm transition-all ${etapa === e.val ? 'bg-brand-500 text-white shadow-card' : 'bg-white text-brand-500 border-2 border-brand-100'}`}>
              {e.label}
            </button>
          ))}
        </div>

        {/* Categorías */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-brand-800 text-base">Categorías</h3>
          {catFiltro && (
            <button onClick={() => setCatFiltro(null)} className="text-brand-500 text-xs font-bold">Ver todo →</button>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 mb-5">
          {CATEGORIAS.map(c => (
            <button key={c.val} onClick={() => setCatFiltro(catFiltro === c.val ? null : c.val)}
              className="flex flex-col items-center gap-1.5 min-w-[68px] flex-shrink-0 transition-all active:scale-95">
              <div className={`w-14 h-14 ${c.colorBg} rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-all ${catFiltro === c.val ? 'ring-2 ring-brand-500 scale-110' : ''}`}>
                {c.icono}
              </div>
              <span className="text-[10px] text-brand-700 font-semibold text-center leading-tight w-16">{c.label}</span>
            </button>
          ))}
        </div>

        {/* Destacado */}
        {destacado && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-brand-800 text-base">Destacado para esta etapa</h3>
              <span className="text-brand-500 text-xs font-bold">Ver todo →</span>
            </div>
            <button onClick={() => setArticuloAbierto(destacado)}
              className={`w-full text-left rounded-3xl p-4 mb-5 shadow-card active:scale-95 transition-all border ${etapaInfo.color} ${etapaInfo.border}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className={`text-xs font-bold mb-1 ${etapaInfo.text}`}>{etapaInfo.titulo} — {etapaInfo.sub}</p>
                  <h4 className={`font-black text-lg leading-snug mb-2 ${etapaInfo.text}`}>{destacado.titulo}</h4>
                  <p className={`text-sm leading-relaxed mb-3 opacity-80 ${etapaInfo.text}`}>{destacado.resumen}</p>
                  <span className="bg-brand-500 text-white text-xs font-black px-4 py-2 rounded-xl inline-block">Ver guía →</span>
                </div>
                <div className="text-5xl flex-shrink-0">{etapaInfo.icon}</div>
              </div>
            </button>
          </>
        )}

        {/* Artículos recientes */}
        {recientes.length > 0 && (
          <>
            <h3 className="font-black text-brand-800 text-base mb-3">Artículos recientes</h3>
            <div className="grid grid-cols-2 gap-3 pb-4">
              {recientes.map((a, i) => {
                const cat = CATEGORIAS.find(c => c.val === a.categoria)
                return (
                  <button key={a.id} onClick={() => setArticuloAbierto(a)}
                    className={`rounded-3xl p-4 text-left shadow-card active:scale-95 transition-all min-h-[110px] flex flex-col justify-between
                      ${i === 0 ? 'bg-brand-500 text-white' : 'bg-white text-brand-800'}`}>
                    <p className="font-black text-sm leading-snug">{a.titulo}</p>
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
      </div>
      <BottomNav />
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Artículo Detalle
// ────────────────────────────────────────────────────────────
function ArticuloDetalle({ articulo, onBack }: { articulo: Articulo; onBack: () => void }) {
  const cat = CATEGORIAS.find(c => c.val === articulo.categoria)
  const extra = DETALLE_EXTRA[articulo.categoria] || DETALLE_EXTRA['salud']
  const etapaInfo = ETAPAS.find(e => e.val === articulo.etapa)!

  return (
    <div className="app-container">
      <Sparkles />
      <div className="page-content">
        {/* Back */}
        <button onClick={onBack} className="flex items-center gap-1 text-brand-500 font-bold text-sm mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Guías
        </button>

        {/* Header card */}
        <div className={`rounded-3xl p-5 mb-4 ${etapaInfo.color} border ${etapaInfo.border}`}>
          <p className={`text-xs font-bold mb-1 ${etapaInfo.text} opacity-70`}>{etapaInfo.titulo} · {etapaInfo.sub}</p>
          <h2 className={`text-xl font-black ${etapaInfo.text} mb-2`}>{articulo.titulo}</h2>
          <p className={`text-sm ${etapaInfo.text} opacity-80 leading-relaxed`}>{articulo.resumen}</p>
        </div>

        {/* Category pill */}
        <div className="flex gap-2 mb-5 overflow-x-auto hide-scrollbar">
          {cat && (
            <div className={`${cat.colorBg} ${cat.colorText} flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold flex-shrink-0`}>
              {cat.icono} {cat.label}
            </div>
          )}
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
                    ${['bg-brand-500','bg-purple-500','bg-green-500','bg-orange-400'][i % 4]}`}>{i+1}</div>
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

        {/* Video placeholder */}
        <h3 className="font-black text-brand-800 text-base mb-3">Video tutorial</h3>
        <div className="bg-brand-200 rounded-3xl h-44 flex flex-col items-center justify-center mb-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-300 to-brand-400 opacity-50" />
          <div className="w-16 h-16 bg-white/60 rounded-full flex items-center justify-center z-10 shadow-lg">
            <span className="text-brand-600 text-3xl ml-1">▶</span>
          </div>
          <p className="text-white font-bold text-sm mt-3 z-10">Ver tutorial</p>
        </div>

        {/* Artículos relacionados */}
        <h3 className="font-black text-brand-800 text-base mb-3">Relacionado</h3>
        <div className="grid grid-cols-2 gap-3 pb-4">
          <div className={`${extra.colorBg} rounded-2xl p-4 border border-white/50`}>
            <p className="text-brand-600 font-black text-xs">📅 Próximo paso</p>
            <p className="text-brand-500 text-xs mt-1">Primera visita al dentista antes del año</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
            <p className="text-green-700 font-black text-xs">✅ Consejo rápido</p>
            <p className="text-green-600 text-xs mt-1">Cepillado 2 veces al día mínimo</p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
