'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sparkles from '@/components/ui/Sparkles'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Hijo = { id: string; nombre: string; fecha_nacimiento: string; avatar_url?: string | null; etapa_dental?: string | null; avatar_set_key?: string | null }
type RutinaHoy = { cepillado_manana: boolean; cepillado_noche: boolean; revision_encias: boolean }
type Memoria = { id: string; titulo?: string | null; foto_url?: string | null; fecha?: string | null }
type AvatarSet = {
  id: string
  key: string
  nombre: string
  descripcion: string | null
  genero: 'nino' | 'nina' | 'neutro' | null
  imagenes: Record<string, string>
  activo: boolean
  orden: number
}

// Fallback images si el set no tiene una pose (o no hay sets en DB)
const DEFAULT_IMGS: Record<string, string> = {
  worried:  '/avatares/worried_nobg.png',
  thinking: '/avatares/thinking_nobg.png',
  neutral:  '/avatares/neutral_nobg.png',
  dentist:  '/avatares/dentist_nobg.png',
  profile:  '/avatares/profile_nobg.png',
}

// Fallback set list (si aún no hay avatar_sets en DB o mientras carga)
const FALLBACK_SETS: AvatarSet[] = [
  { id: 'd', key: 'default', nombre: 'Clásico', descripcion: null, genero: 'neutro', imagenes: DEFAULT_IMGS, activo: true, orden: 0 },
  { id: 'u', key: 'nina_unicornio', nombre: 'Niña unicornio', descripcion: null, genero: 'nina', imagenes: {
    worried: '/avatares/nina_unicornio_worried_nobg.png',
    thinking: '/avatares/nina_unicornio_thinking_nobg.png',
    neutral: '/avatares/nina_unicornio_neutral_nobg.png',
    dentist: '/avatares/nina_unicornio_dentist_nobg.png',
  }, activo: true, orden: 10 },
  { id: 'm', key: 'nina_morena', nombre: 'Niña morena', descripcion: null, genero: 'nina', imagenes: {
    worried: '/avatares/nina_morena_worried_nobg.png',
    thinking: '/avatares/nina_morena_thinking_nobg.png',
    neutral: '/avatares/nina_morena_neutral_nobg.png',
    dentist: '/avatares/nina_morena_dentist_nobg.png',
  }, activo: true, orden: 11 },
  { id: 'r', key: 'nino_rubio', nombre: 'Niño rubio', descripcion: null, genero: 'nino', imagenes: {
    worried: '/avatares/nino_rubio_worried_nobg.png',
    thinking: '/avatares/nino_rubio_thinking_nobg.png',
    neutral: '/avatares/nino_rubio_neutral_nobg.png',
    dentist: '/avatares/nino_rubio_dentist_nobg.png',
  }, activo: true, orden: 20 },
  { id: 'a', key: 'nino_asiatico', nombre: 'Niño asiático', descripcion: null, genero: 'nino', imagenes: {
    worried: '/avatares/nino_asiatico_worried_nobg.png',
    thinking: '/avatares/nino_asiatico_thinking_nobg.png',
    neutral: '/avatares/nino_asiatico_neutral_nobg.png',
    dentist: '/avatares/nino_asiatico_dentist_nobg.png',
  }, activo: true, orden: 21 },
]

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
// - rutina completa (4/4) o racha >= 7: ¡campeona dentista!
// - 2-3/4: niña feliz/contenta (neutral)
// - 1/4: pensando (aún con cepillo en mano)
// - 0/4: preocupada (necesita cepillarse)
type Pose = 'neutral' | 'worried' | 'dentist' | 'profile' | 'thinking'
function elegirPose(completadasHoy: number, racha: number): Pose {
  if (completadasHoy >= 4 || racha >= 7) return 'dentist'
  if (completadasHoy >= 2) return 'neutral'
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
  const [parentId, setParentId] = useState<string | null>(null)
  const [parentAvatarKey, setParentAvatarKey] = useState<string>('default')
  const [hijo, setHijo] = useState<Hijo | null>(null)
  const [rutinaHoy, setRutinaHoy] = useState<RutinaHoy>({ cepillado_manana: false, cepillado_noche: false, revision_encias: false })
  const [rutinasCompletadas, setRutinasCompletadas] = useState(0)
  const [racha, setRacha] = useState(0)
  const [logrosTotal, setLogrosTotal] = useState(0)
  const [memorias, setMemorias] = useState<Memoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [avatarSets, setAvatarSets] = useState<AvatarSet[]>(FALLBACK_SETS)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [guardandoSet, setGuardandoSet] = useState(false)
  const [errorAvatar, setErrorAvatar] = useState<string | null>(null)
  const [mejorPacman, setMejorPacman] = useState<number>(0)

  // Mejor puntaje de Pac-Denti (localStorage)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const v = localStorage.getItem('pacman_denti_best')
    if (v) setMejorPacman(parseInt(v, 10) || 0)
  }, [])

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setParentId(user.id)

    // Profile del padre (fuente de verdad del avatar si no hay hijo)
    const { data: prof } = await supabase.from('profiles')
      .select('avatar_set_key')
      .eq('id', user.id)
      .single()
    if (prof?.avatar_set_key) setParentAvatarKey(prof.avatar_set_key)

    // Hijo principal (opcional)
    const { data: hijos } = await supabase.from('hijos')
      .select('id, nombre, fecha_nacimiento, avatar_url, etapa_dental, avatar_set_key')
      .eq('parent_id', user.id).limit(1)
    if (hijos?.length) {
      setHijo(hijos[0] as Hijo)
      // Si el hijo ya tenía una preferencia antes y el padre no, la heredamos
      if (hijos[0].avatar_set_key && (!prof?.avatar_set_key || prof.avatar_set_key === 'default')) {
        setParentAvatarKey(hijos[0].avatar_set_key)
      }
    }

    // Avatar sets disponibles
    const { data: sets } = await supabase.from('avatar_sets')
      .select('*').eq('activo', true).order('orden', { ascending: true })
    if (sets && sets.length > 0) setAvatarSets(sets as AvatarSet[])

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
    } else {
      setRutinaHoy({ cepillado_manana: false, cepillado_noche: false, revision_encias: false })
    }

    // Total rutinas completadas (para XP)
    const { count: comp } = await supabase.from('rutinas')
      .select('fecha', { count: 'exact', head: true })
      .eq('parent_id', user.id).eq('completada', true)
    setRutinasCompletadas(comp || 0)

    // Racha (días consecutivos desde hoy hacia atrás) — dedup por fecha
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
  }, [router])

  useEffect(() => { load() }, [load])

  // Refrescar cuando se vuelve a la pestaña / página (desde /dashboard al marcar rutina)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', handler)
    window.addEventListener('focus', handler)
    window.addEventListener('pageshow', handler)
    return () => {
      document.removeEventListener('visibilitychange', handler)
      window.removeEventListener('focus', handler)
      window.removeEventListener('pageshow', handler)
    }
  }, [load])

  // Derivados
  const completadasHoy = useMemo(() => {
    return [rutinaHoy.cepillado_manana, rutinaHoy.cepillado_noche, rutinaHoy.revision_encias].filter(Boolean).length
  }, [rutinaHoy])

  const pose: Pose = useMemo(() => elegirPose(completadasHoy, racha), [completadasHoy, racha])
  const nombre = hijo?.nombre || ''
  const frase = frasePorPose(pose, nombre || 'Tu peque')
  const stats = useMemo(() => calcularStats(rutinasCompletadas, racha, logrosTotal), [rutinasCompletadas, racha, logrosTotal])
  const edad = edadHijo(hijo?.fecha_nacimiento)

  // Avatar set activo: prioriza el del padre (profile), cae al del hijo si existe
  const setActivo = useMemo<AvatarSet | null>(() => {
    const key = parentAvatarKey || hijo?.avatar_set_key || 'default'
    return avatarSets.find(s => s.key === key) || avatarSets.find(s => s.key === 'default') || avatarSets[0] || null
  }, [parentAvatarKey, hijo, avatarSets])

  const avatarImgSrc = useMemo(() => {
    const img = setActivo?.imagenes?.[pose]
    return img || DEFAULT_IMGS[pose] || DEFAULT_IMGS.neutral
  }, [pose, setActivo])

  async function seleccionarAvatarSet(key: string) {
    if (!parentId || guardandoSet) return
    setGuardandoSet(true)
    setErrorAvatar(null)
    const prevKey = parentAvatarKey
    // Optimistic (se guarda en el profile del padre — no depende de hijo)
    setParentAvatarKey(key)

    // Actualiza el profile (fuente de verdad)
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_set_key: key })
      .eq('id', parentId)
      .select('id, avatar_set_key')

    if (error || !data || data.length === 0) {
      setParentAvatarKey(prevKey) // revert
      const msg = error?.message || 'No se pudo guardar el cambio. Inténtalo de nuevo.'
      console.error('[avatar-picker] error:', error, 'data:', data)
      setErrorAvatar(msg)
    } else {
      // Si hay hijo, también sincroniza su avatar (no bloquea)
      if (hijo?.id) {
        supabase.from('hijos').update({ avatar_set_key: key }).eq('id', hijo.id).then(() => {})
        setHijo(h => h ? { ...h, avatar_set_key: key } : h)
      }
      // Cierre suave: pequeño delay para evitar flicker entre guardado y close
      setTimeout(() => setShowAvatarPicker(false), 150)
    }
    setGuardandoSet(false)
  }

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

        {/* Hero: avatar + stats en columna lateral */}
        <section className="relative mb-5">
          {/* Orb decorativo de fondo */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-200/40 rounded-full blur-3xl -z-0" />

          <div className="relative h-80">
            {/* Botón cambiar avatar */}
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="absolute top-2 left-2 z-20 bg-white/90 backdrop-blur-sm text-brand-700 text-xs font-black px-3 py-1.5 rounded-full shadow-md active:scale-95 transition-all flex items-center gap-1"
            >
              🎨 <span>Cambiar</span>
            </button>

            {/* Avatar cuerpo completo - centrado */}
            <div className="absolute inset-0 flex justify-center items-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarImgSrc}
                alt={nombre || 'avatar'}
                className="h-full w-auto object-contain transition-all duration-500 drop-shadow-xl"
              />
            </div>

            {/* Stats laterales en columna - pegados al avatar */}
            <div className="absolute right-2 bottom-2 flex flex-col gap-2 z-10">
              <div className="bg-white rounded-2xl shadow-md px-3 py-2 flex flex-col items-center min-w-[56px]">
                <span className="text-lg leading-none">🏆</span>
                <span className="text-[9px] font-bold text-brand-400 uppercase tracking-wide mt-0.5">Nivel</span>
                <span className="text-base font-black text-brand-800 leading-tight">{stats.nivel}</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md px-3 py-2 flex flex-col items-center min-w-[56px]">
                <span className="text-lg leading-none">🔥</span>
                <span className="text-[9px] font-bold text-brand-400 uppercase tracking-wide mt-0.5">Racha</span>
                <span className="text-base font-black text-orange-500 leading-tight">{racha}d</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md px-3 py-2 flex flex-col items-center min-w-[56px]">
                <span className="text-lg leading-none">🎖️</span>
                <span className="text-[9px] font-bold text-brand-400 uppercase tracking-wide mt-0.5">Logros</span>
                <span className="text-base font-black text-brand-800 leading-tight">{logrosTotal}</span>
              </div>
            </div>
          </div>

          {/* Nombre + edad + frase */}
          <div className="mt-3 text-center">
            {nombre && (
              <h2 className="text-2xl font-black text-brand-800 tracking-tight">{nombre}</h2>
            )}
            {edad && (
              <div className="mt-1 inline-flex items-center gap-1 bg-brand-100 px-3 py-0.5 rounded-full text-brand-700 font-bold text-xs">
                🎂 {edad}
              </div>
            )}
            <p className="mt-2 font-black text-brand-700 text-sm">{frase.titulo}</p>
            <p className="text-brand-500 text-xs">{frase.sub}</p>
          </div>

          {/* Barra de XP estilo videojuego - compacta */}
          <div className="mt-4 bg-white rounded-xl px-3 py-2.5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-black text-brand-800 text-xs">XP nivel {stats.nivel}</span>
              <span className="text-brand-500 text-[10px] font-bold">{stats.xpEnNivel}/{stats.xpParaSubir}</span>
            </div>
            <div className="h-2 bg-brand-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (stats.xpEnNivel / stats.xpParaSubir) * 100)}%` }}
              />
            </div>
          </div>
        </section>

        {/* ═══ Zona de juegos ═══ */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-base font-black text-brand-800 flex items-center gap-1.5">
              <span className="text-lg">🎮</span> Zona de juegos
            </h3>
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Beta</span>
          </div>

          <button
            onClick={() => router.push('/dashboard/perfil/juego/pacman')}
            className="group w-full relative overflow-hidden rounded-3xl text-left active:scale-[0.98] transition-transform
                       bg-gradient-to-br from-indigo-600 via-sky-600 to-blue-800 shadow-xl hover:shadow-2xl"
          >
            {/* Glow & decorations */}
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-yellow-300/20 rounded-full blur-3xl group-hover:bg-yellow-300/30 transition-colors" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-400/20 rounded-full blur-2xl" />
            {/* Pixel pattern (decorative) */}
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
                backgroundSize: '12px 12px',
              }}
            />

            <div className="relative p-4 flex items-center gap-4">
              {/* Mascot/arcade frame */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center text-4xl shadow-lg ring-4 ring-white/20">
                  🦷
                </div>
                <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-200 animate-pulse" style={{ animationDelay: '0s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-200 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-200 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>

              <div className="flex-1 min-w-0 text-white">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="bg-yellow-300 text-yellow-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Arcade</span>
                  {mejorPacman > 0 && (
                    <span className="bg-white/20 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="text-yellow-300">★</span> {mejorPacman}
                    </span>
                  )}
                </div>
                <p className="font-black text-xl leading-tight">Pac-Denti</p>
                <p className="text-white/80 text-xs leading-snug mt-0.5">
                  {mejorPacman > 0
                    ? '¿Superas tu mejor puntaje?'
                    : 'Come caries, gana logros y XP'}
                </p>
              </div>

              <div className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white text-blue-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-xl ml-0.5">▶</span>
                </div>
                <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">Jugar</span>
              </div>
            </div>

            <div className="relative bg-black/30 backdrop-blur-sm px-4 py-1.5 flex items-center justify-between border-t border-white/10">
              <span className="text-[10px] font-black text-yellow-300 uppercase tracking-widest animate-pulse">
                ▸ Insert smile to start
              </span>
              <span className="text-[10px] font-bold text-white/50">+50 XP por victoria</span>
            </div>
          </button>
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

        {/* Álbum de recuerdos - compacto */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-black text-brand-800">Álbum de recuerdos</h3>
            <button onClick={() => router.push('/dashboard/album')} className="text-brand-500 font-bold text-xs">
              Ver todo →
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {memorias.map((m) => (
              <button key={m.id} onClick={() => router.push('/dashboard/album')}
                className="group relative overflow-hidden rounded-xl shadow-sm active:scale-95 transition-all aspect-square">
                {m.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.foto_url} alt={m.titulo || 'recuerdo'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-2xl">📸</div>
                )}
                <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white text-[9px] font-bold truncate">{m.titulo || 'Recuerdo'}</p>
                </div>
              </button>
            ))}
            {/* Placeholder "añadir" */}
            <button onClick={() => router.push('/dashboard/album')}
              className="flex flex-col items-center justify-center border-2 border-dashed border-brand-200 rounded-xl aspect-square active:scale-95 transition-all hover:border-brand-400">
              <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-base">➕</div>
              <span className="mt-1 text-[8px] font-black text-brand-500 uppercase tracking-wider">Añadir</span>
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

      {/* Modal: selector de avatar */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => { setShowAvatarPicker(false); setErrorAvatar(null) }}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-brand-800 text-lg">Elige tu personaje</h3>
              <button onClick={() => { setShowAvatarPicker(false); setErrorAvatar(null) }} className="text-brand-400 text-2xl leading-none">×</button>
            </div>
            <p className="text-brand-500 text-xs mb-4">Cambia el avatar del peque. Las 4 poses (preocupada, pensando, feliz y dentista) se desbloquean con la rutina.</p>
            {errorAvatar && (
              <div className="mb-3 bg-red-50 border border-red-200 rounded-2xl px-3 py-2 text-red-600 text-xs">
                {errorAvatar}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {avatarSets.map(s => {
                const activo = (parentAvatarKey || 'default') === s.key
                const preview = s.imagenes?.neutral || s.imagenes?.dentist || s.imagenes?.thinking || s.imagenes?.worried
                return (
                  <button
                    key={s.id}
                    onClick={() => seleccionarAvatarSet(s.key)}
                    disabled={guardandoSet}
                    className={`relative rounded-2xl overflow-hidden border-2 p-2 flex flex-col items-center text-center transition-all active:scale-95
                      ${activo ? 'border-brand-500 bg-brand-50 shadow-md' : 'border-gray-200 bg-white hover:border-brand-300'}`}
                  >
                    {activo && (
                      <span className="absolute top-1.5 right-1.5 bg-brand-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full z-10">Activo</span>
                    )}
                    <div className="w-full aspect-square bg-gradient-to-b from-brand-50 to-white rounded-xl flex items-center justify-center overflow-hidden">
                      {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview} alt={s.nombre} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-5xl">🧒</span>
                      )}
                    </div>
                    <p className="font-black text-brand-800 text-xs mt-1.5 leading-tight line-clamp-1">{s.nombre}</p>
                    {s.genero && (
                      <span className="text-[9px] text-brand-400 font-semibold uppercase tracking-wide">
                        {s.genero === 'nina' ? '♀ Niña' : s.genero === 'nino' ? '♂ Niño' : '•'}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {guardandoSet && <p className="text-center text-brand-400 text-xs mt-3">Guardando...</p>}
          </div>
        </div>
      )}
    </div>
  )
}
