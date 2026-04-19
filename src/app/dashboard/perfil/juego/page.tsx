'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/ui/BottomNav'
import Sparkles from '@/components/ui/Sparkles'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Hijo = { id: string; nombre: string; fecha_nacimiento: string; avatar_url?: string | null; etapa_dental?: string | null }
type RutinaHoy = { cepillado_manana: boolean; cepillado_noche: boolean; revision_encias: boolean }
type Memoria = { id: string; titulo?: string | null; foto_url?: string | null; fecha?: string | null }

// ── Helpers ───────────────────────────────────────────────────────────────────
function fechaLocalHoy(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function edadHijo(fechaNacimiento?: string | null): string | null {
  if (!fechaNacimiento) return null
  const n = new Date(fechaNacimiento), h = new Date()
  const meses = (h.getFullYear() - n.getFullYear()) * 12 + (h.getMonth() - n.getMonth())
  if (meses < 0) return null
  if (meses < 24) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`
  const a = Math.floor(meses / 12)
  return `${a} ${a === 1 ? 'año' : 'años'}`
}

// Pose según estado de la rutina + racha
// - 4/4 o racha >= 7: ¡campeona dentista!
// - 3/4 o racha >= 3: neutral contenta
// - 1-2/4: pensando con cepillo
// - 0/4: preocupada
type Pose = 'neutral' | 'worried' | 'dentist' | 'profile' | 'thinking'
function elegirPose(completadasHoy: number, racha: number): Pose {
  if (completadasHoy >= 4 || racha >= 7) return 'dentist'
  if (completadasHoy >= 3 || racha >= 3) return 'neutral'
  if (completadasHoy >= 1) return 'thinking'
  return 'worried'
}

function frasePorPose(pose: Pose, nombre: string): { titulo: string; sub: string } {
  switch (pose) {
    case 'dentist':  return { titulo: `¡${nombre} es una campeona!`, sub: 'Cuida sus dientes como una profesional.' }
    case 'neutral':  return { titulo: `¡${nombre} va super bien!`,   sub: 'Sigue así, tu sonrisa brilla cada día.' }
    case 'thinking': return { titulo: `${nombre} está pensando...`,   sub: '¿Qué tal un cepillado extra hoy?' }
    case 'worried':  return { titulo: `${nombre} te necesita`,        sub: 'Una rutina a tiempo evita muchas caries.' }
    case 'profile':  return { titulo: `${nombre}`,                     sub: '' }
  }
}

// XP y nivel (simple y gratificante)
function calcularStats(rutinasCompletas: number, racha: number, logros: number) {
  const xp = rutinasCompletas * 10 + racha * 15 + logros * 50
  const nivel = Math.floor(xp / 100) + 1
  const xpEnNivel = xp % 100
  const xpParaSubir = 100
  return { xp, nivel, xpEnNivel, xpParaSubir }
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function PerfilJuegoPage() {
  const router = useRouter()
  const [hijo, setHijo] = useState<Hijo | null>(null)
  const [rutinaHoy, setRutinaHoy] = useState<RutinaHoy>({ cepillado_manana: false, cepillado_noche: false, revision_encias: false })
  const [rutinasCompletadas, setRutinasCompletadas] = useState(0)
  const [racha, setRacha] = useState(0)
  const [logrosTotal, setLogrosTotal] = useState(0)
  const [memorias, setMemorias] = useState<Memoria[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Hijo principal
      const { data: hijos } = await supabase.from('hijos')
        .select('id, nombre, fecha_nacimiento, avatar_url, etapa_dental')
        .eq('parent_id', user.id).limit(1)
      if (hijos?.length) setHijo(hijos[0] as Hijo)

      // Rutina de hoy (merge si hay filas dup)
      const hoy = fechaLocalHoy()
      const { data: ruts } = await supabase.from('rutinas')
        .select('cepillado_manana, cepillado_noche, revision_encias')
        .eq('parent_id', user.id).eq('fecha', hoy)
      if (ruts && ruts.length > 0) {
        const m = ruts.reduce((a, r) => ({
          cepillado_manana: a.cepillado_manana || !!r.cepillado_manana,
          cepillado_noche:  a.cepillado_noche  || !!r.cepillado_noche,
          revision_encias:  a.revision_encias  || !!r.revision_encias,
        }), { cepillado_manana: false, cepillado_noche: false, revision_encias: false })
        setRutinaHoy(m)
      }

      // Total rutinas completadas (para XP)
      const { count: comp } = await supabase.from('rutinas')
        .select('fecha', { count: 'exact', head: true })
        .eq('parent_id', user.id).eq('completada', true)
      setRutinasCompletadas(comp || 0)

      // Racha (días consecutivos desde hoy hacia atrás)
      const { data: completas } = await supabase.from('rutinas')
        .select('fecha').eq('parent_id', user.id).eq('completada', true)
        .order('fecha', { ascending: false }).limit(400)
      if (completas) {
        const hechos = new Set(completas.map(r => r.fecha))
        const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        let n = 0
        const cursor = new Date()
        if (!hechos.has(toISO(cursor))) cursor.setDate(cursor.getDate() - 1)
        while (hechos.has(toISO(cursor))) { n++; cursor.setDate(cursor.getDate() - 1) }
        setRacha(n)
      }

      // Logros
      const { count: logrosCount } = await supabase.from('logros')
        .select('tipo', { count: 'exact', head: true }).eq('parent_id', user.id)
      setLogrosTotal(logrosCount || 0)

      // Últimas 3 memorias del álbum
      const { data: mems } = await supabase.from('memorias')
        .select('id, titulo, foto_url, fecha')
        .eq('parent_id', user.id)
        .order('fecha', { ascending: false, nullsFirst: false })
        .limit(3)
      setMemorias((mems as Memoria[]) || [])

      setCargando(false)
    }
    load()
  }, [router])

  // Derivados
  const completadasHoy = useMemo(() => {
    return [rutinaHoy.cepillado_manana, rutinaHoy.cepillado_noche, rutinaHoy.revision_encias].filter(Boolean).length
  }, [rutinaHoy])

  const pose: Pose = useMemo(() => elegirPose(completadasHoy, racha), [completadasHoy, racha])
  const nombre = hijo?.nombre || 'Tu peque'
  const frase = frasePorPose(pose, nombre)
  const stats = useMemo(() => calcularStats(rutinasCompletadas, racha, logrosTotal), [rutinasCompletadas, racha, logrosTotal])
  const edad = edadHijo(hijo?.fecha_nacimiento)

  // Tareas del día (con tiempos estimados tipo videojuego)
  const tareas = [
    { key: 'cepillado_manana' as const, label: 'Cepillado mañana', icono: '🌅', tiempo: '2 min', hecha: rutinaHoy.cepillado_manana },
    { key: 'cepillado_noche'  as const, label: 'Cepillado noche',  icono: '🌙', tiempo: '2 min', hecha: rutinaHoy.cepillado_noche  },
    { key: 'revision_encias'  as const, label: 'Revisar encías',   icono: '👀', tiempo: '1 min', hecha: rutinaHoy.revision_encias  },
    { key: 'foto_sonrisa'     as const, label: 'Foto sonrisa',      icono: '📸', tiempo: 'Opc.',  hecha: false },
  ]

  return (
    <div className="app-container bg-gradient-to-b from-brand-50 to-white min-h-screen">
      <Sparkles />
      <div className="page-content pb-32">

        {/* Header simple */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-brand-600 active:scale-95 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 className="font-black text-brand-800 text-lg">Avatar Digital</h1>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-black">BETA</div>
        </div>

        {/* Hero: avatar grande + nivel lateral */}
        <section className="relative mb-6">
          {/* Orb decorativo de fondo */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-200/40 rounded-full blur-3xl -z-0" />

          <div className="relative flex items-center gap-3">
            {/* Avatar grande con gradient ring */}
            <div className="relative flex-shrink-0">
              <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-brand-500 via-brand-400 to-brand-200 p-1 shadow-xl">
                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/avatares/${pose}.png`} alt={nombre} className="w-full h-full object-cover transition-all duration-500" />
                </div>
              </div>
              {/* Estrella flotante si va bien */}
              {(pose === 'dentist' || pose === 'neutral') && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-2.5 rounded-full shadow-lg text-lg">⭐</div>
              )}
            </div>

            {/* Panel lateral de stats */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="bg-white rounded-2xl shadow-sm px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Nivel</p>
                  <p className="text-xl font-black text-brand-800">{stats.nivel}</p>
                </div>
                <span className="text-2xl">🏆</span>
              </div>
              <div className="bg-white rounded-2xl shadow-sm px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Racha</p>
                  <p className="text-xl font-black text-orange-500">{racha}d</p>
                </div>
                <span className="text-2xl">🔥</span>
              </div>
              <div className="bg-white rounded-2xl shadow-sm px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Logros</p>
                  <p className="text-xl font-black text-brand-800">{logrosTotal}</p>
                </div>
                <span className="text-2xl">🎖️</span>
              </div>
            </div>
          </div>

          {/* Nombre + edad + frase */}
          <div className="mt-4 text-center">
            <h2 className="text-3xl font-black text-brand-800 tracking-tight">{nombre}</h2>
            {edad && (
              <div className="mt-2 inline-flex items-center gap-1 bg-brand-100 px-3 py-1 rounded-full text-brand-700 font-bold text-xs">
                🎂 {edad}
              </div>
            )}
            <p className="mt-3 font-black text-brand-700">{frase.titulo}</p>
            <p className="text-brand-500 text-sm">{frase.sub}</p>
          </div>

          {/* Barra de XP estilo videojuego */}
          <div className="mt-5 bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-black text-brand-800 text-sm">XP del nivel {stats.nivel}</span>
              <span className="text-brand-500 text-xs font-bold">{stats.xpEnNivel}/{stats.xpParaSubir} XP</span>
            </div>
            <div className="h-3 bg-brand-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (stats.xpEnNivel / stats.xpParaSubir) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-brand-400 mt-1.5">Faltan {stats.xpParaSubir - stats.xpEnNivel} XP para subir de nivel</p>
          </div>
        </section>

        {/* Misiones / tareas del día */}
        <section className="mb-6">
          <h3 className="text-xl font-black text-brand-800 mb-3">Misiones de hoy</h3>
          <div className="grid grid-cols-4 gap-2">
            {tareas.map(t => (
              <button key={t.key} onClick={() => router.push('/dashboard')}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-all">
                <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-sm border-2
                  ${t.hecha ? 'bg-gradient-to-br from-green-100 to-green-200 border-green-300' : 'bg-gradient-to-br from-brand-50 to-brand-100 border-brand-200'}`}>
                  {t.icono}
                  {/* Badge de tiempo o checkmark */}
                  <div className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black shadow-sm
                    ${t.hecha ? 'bg-green-500 text-white' : 'bg-white text-brand-600'}`}>
                    {t.hecha ? '✓' : t.tiempo}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-brand-700 text-center leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Daily reward / racha */}
        <section className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">🔁 DIARIO</span>
          </div>
          <p className="font-black text-brand-800 leading-tight mb-3">
            Mantén la racha <span className="text-orange-500">7 días seguidos</span> y desbloquea el traje de dentista para tu avatar
          </p>
          <div className="flex items-center gap-1 justify-between">
            {[1,2,3,4,5,6,7].map(dia => {
              const completado = dia <= racha
              const esActual = dia === racha + 1
              return (
                <div key={dia} className="flex items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all
                    ${completado ? 'bg-green-500 text-white shadow-sm'
                      : esActual ? 'bg-yellow-400 text-white animate-pulse'
                      : 'bg-brand-100 text-brand-400'}`}>
                    {completado ? '✓' : dia}
                  </div>
                  {dia < 7 && <div className={`flex-1 h-0.5 mx-0.5 ${dia < racha ? 'bg-green-400' : 'bg-brand-100'}`} />}
                </div>
              )
            })}
            <div className="ml-1 text-xl">🎁</div>
          </div>
        </section>

        {/* Álbum de recuerdos - estilo zip 2 */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-black text-brand-800">Álbum de recuerdos</h3>
            <button onClick={() => router.push('/dashboard/album')} className="text-brand-500 font-bold text-sm">
              Ver todo →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {memorias.map((m, i) => (
              <button key={m.id} onClick={() => router.push('/dashboard/album')}
                className={`group relative overflow-hidden rounded-2xl shadow-sm active:scale-95 transition-all
                  ${i === 2 ? 'col-span-2 aspect-video' : 'aspect-[4/5]'}`}>
                {m.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.foto_url} alt={m.titulo || 'recuerdo'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-5xl">📸</div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white text-sm font-bold truncate">{m.titulo || 'Recuerdo'}</p>
                </div>
              </button>
            ))}
            {/* Placeholder "añadir" */}
            <button onClick={() => router.push('/dashboard/album')}
              className="flex flex-col items-center justify-center border-4 border-dashed border-brand-200 rounded-2xl min-h-[140px] aspect-[4/5] active:scale-95 transition-all hover:border-brand-400">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-2xl">➕</div>
              <span className="mt-2 text-[10px] font-black text-brand-500 uppercase tracking-widest">Añadir</span>
            </button>
          </div>
        </section>

        {/* Mensaje motivador (tip card) */}
        <section className="bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-2xl p-5 shadow-sm relative overflow-hidden mb-6">
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-700 mb-1 block">💡 Próxima meta</span>
            <h4 className="text-lg font-black text-yellow-800 leading-tight mb-1">
              {racha >= 7 ? '¡Nivel dentista desbloqueado!'
                : `${7 - racha} día${7-racha===1?'':'s'} más para el traje dentista`}
            </h4>
            <p className="text-yellow-700/80 text-sm leading-relaxed">
              {racha >= 7
                ? 'Has cuidado la sonrisa de tu peque una semana seguida. ¡Eres increíble!'
                : 'Cada día contigo construye un hábito que durará toda la vida.'}
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-10">🦷</div>
        </section>

        {cargando && (
          <p className="text-center text-brand-400 text-sm">Cargando perfil...</p>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
