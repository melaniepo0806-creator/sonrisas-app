'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/ui/BottomNav'
import Sparkles from '@/components/ui/Sparkles'
import SonrisasLogo from '@/components/ui/SonrisasLogo'
import { getProgresoPorCategoria } from '@/lib/guias-data'

const DIAS = ['L','M','X','J','V','S','D']
const CONSEJOS = [
  '🦷 Cepilla los dientes durante 2 minutos, dos veces al día.',
  '💧 Beber agua después de comer ayuda a limpiar los dientes.',
  '🍎 Las frutas y verduras crujientes ayudan a limpiar los dientes.',
  '🧴 Cambia el cepillo cada 3 meses o cuando las cerdas se doblen.',
  '😴 El cepillado de noche es el más importante del día.',
  '🥛 La leche y el queso aportan calcio que fortalece los dientes.',
  '🚫 Evita dar biberones con leche o jugo a la hora de dormir.',
  '🪥 Usa un cepillo de cerdas suaves acorde a la edad de tu peque.',
  '👨‍⚕️ Visita al dentista cada 6 meses para prevenir caries.',
  '🍬 Limita los dulces y enjuaga la boca con agua después de comerlos.',
  '🧠 Enseña con el ejemplo: cepíllate junto a tu hijo.',
  '🎵 Una canción de 2 minutos es ideal para cepillarse.',
  '🪶 Cepilla con movimientos suaves y circulares, no a lo bruto.',
  '😁 La hora del cepillado puede ser divertida, usa pegatinas de premio.',
  '🌙 Tras el cepillado nocturno, solo agua hasta dormir.',
]

// Consejo estable por usuario + día (mismo tip todo el día para el mismo padre)
function hashDia(userId: string, fecha: string): number {
  let h = 0
  const s = userId + '|' + fecha
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0 }
  return Math.abs(h)
}

function calcularEdad(fechaNacimiento: string): string {
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  const meses = (hoy.getFullYear() - nacimiento.getFullYear()) * 12 + (hoy.getMonth() - nacimiento.getMonth())
  if (meses < 24) return `${meses} meses`
  const anos = Math.floor(meses / 12)
  return `${anos} años`
}

export default function HomePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{nombre_completo?: string} | null>(null)
  const [hijo, setHijo] = useState<{id?: string; nombre?: string; etapa_dental?: string; avatar_url?: string; fecha_nacimiento?: string} | null>(null)
  const [rutina, setRutina] = useState({ cepillado_manana: false, cepillado_noche: false, revision_encias: false })
  const [sinDulces, setSinDulces] = useState(false)
  const [progreso, setProgreso] = useState<boolean[]>([false,false,false,false,false,false,false])
  const [racha, setRacha] = useState(0)
  const [consejo, setConsejo] = useState(CONSEJOS[0])
  const [showTimer, setShowTimer] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [etapaHijo, setEtapaHijo] = useState('0-1')
  const [progresoGuia, setProgresoGuia] = useState<{categoria: string; leidos: number; total: number}[]>([])
  const [hayNotifNueva, setHayNotifNueva] = useState(false)
  const [avatarPadre, setAvatarPadre] = useState<string>('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      if (prof?.avatar_url) setAvatarPadre(prof.avatar_url)

      // Consejo del día: estable por usuario y fecha
      const hoyStr = new Date().toISOString().split('T')[0]
      setConsejo(CONSEJOS[hashDia(user.id, hoyStr) % CONSEJOS.length])

      // Hay notificaciones sin leer?
      const { count: unread } = await supabase.from('notificaciones')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('leida', false)
      setHayNotifNueva((unread || 0) > 0)
      const { data: hijos } = await supabase.from('hijos').select('*').eq('parent_id', user.id).limit(1)
      if (hijos?.length) {
        setHijo(hijos[0])
        // Determine etapa for Guías progress
        const e = hijos[0].etapa_dental as string | undefined
        let etapa = '0-1'
        if (e === '2-6a') etapa = '2-6'
        else if (e && !['0-6m','6-12m','1-2a'].includes(e)) etapa = '6-12'
        setEtapaHijo(etapa)
        // Progreso: usa artículos de la tabla si existen, si no caen los defaults
        const { data: artsDb } = await supabase
          .from('articulos')
          .select('id, categoria, etapa')
          .eq('etapa', etapa)
        setProgresoGuia(getProgresoPorCategoria(etapa, artsDb || undefined))
      }
      const hoy = new Date().toISOString().split('T')[0]
      const { data: rut } = await supabase.from('rutinas').select('*').eq('parent_id', user.id).eq('fecha', hoy).maybeSingle()
      if (rut) setRutina({ cepillado_manana: rut.cepillado_manana, cepillado_noche: rut.cepillado_noche, revision_encias: rut.revision_encias })
      const hoyDate = new Date()
      const diaSemana = hoyDate.getDay()
      const lunes = new Date(hoyDate)
      lunes.setDate(hoyDate.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1))
      const { data: semana } = await supabase.from('rutinas').select('fecha, completada').eq('parent_id', user.id).gte('fecha', lunes.toISOString().split('T')[0])
      if (semana) {
        const prog = Array(7).fill(false)
        semana.forEach((r: {fecha: string; completada: boolean}) => { const d = new Date(r.fecha + 'T12:00:00').getDay(); const i = d === 0 ? 6 : d-1; prog[i] = r.completada })
        setProgreso(prog)
      }

      // ── Racha: días consecutivos completados de hoy hacia atrás ──
      const { data: todasComp } = await supabase
        .from('rutinas')
        .select('fecha')
        .eq('parent_id', user.id)
        .eq('completada', true)
        .order('fecha', { ascending: false })
        .limit(400)
      if (todasComp) {
        const hechos = new Set(todasComp.map(r => r.fecha))
        const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        let count = 0
        const cursor = new Date()
        if (!hechos.has(toISO(cursor))) cursor.setDate(cursor.getDate() - 1)
        while (hechos.has(toISO(cursor))) {
          count++
          cursor.setDate(cursor.getDate() - 1)
        }
        setRacha(count)
      }
    }
    load()
  }, [router])

  async function toggleRutina(campo: 'cepillado_manana' | 'cepillado_noche' | 'revision_encias') {
    if (!userId) return
    const hoy = new Date().toISOString().split('T')[0]
    const nuevaRutina = { ...rutina, [campo]: !rutina[campo] }
    const completada = nuevaRutina.cepillado_manana && nuevaRutina.cepillado_noche
    setRutina(nuevaRutina)
    await supabase.from('rutinas').upsert({ parent_id: userId, hijo_id: hijo?.id || null, fecha: hoy, ...nuevaRutina, completada }, { onConflict: 'parent_id,hijo_id,fecha' })
    const i = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
    const prog = [...progreso]; prog[i] = completada; setProgreso(prog)

    // Recalcular racha al marcar la rutina de hoy como completa (o descompletarla)
    const { data: todasComp } = await supabase
      .from('rutinas')
      .select('fecha')
      .eq('parent_id', userId)
      .eq('completada', true)
      .order('fecha', { ascending: false })
      .limit(400)
    if (todasComp) {
      const hechos = new Set(todasComp.map(r => r.fecha))
      const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      let count = 0
      const cursor = new Date()
      if (!hechos.has(toISO(cursor))) cursor.setDate(cursor.getDate() - 1)
      while (hechos.has(toISO(cursor))) {
        count++
        cursor.setDate(cursor.getDate() - 1)
      }
      setRacha(count)
    }
  }

  // Refresh Guías progress whenever:
  // - user marks an article as read elsewhere in the app (custom event)
  // - browser tab regains focus / visibility
  // - page is restored from bfcache (back/forward)
  // - localStorage changes in another tab (storage event)
  useEffect(() => {
    let cancel = false
    async function refresh() {
      const { data: artsDb } = await supabase
        .from('articulos')
        .select('id, categoria, etapa')
        .eq('etapa', etapaHijo)
      if (!cancel) setProgresoGuia(getProgresoPorCategoria(etapaHijo, artsDb || undefined))
    }
    // Run once immediately so that on client-side nav back to /dashboard
    // (Next.js Router Cache keeps the component alive but doesn't re-run load())
    refresh()
    const handler = () => { refresh() }
    window.addEventListener('sonrisas-leidos-changed', handler)
    window.addEventListener('focus', handler)
    window.addEventListener('pageshow', handler)
    window.addEventListener('storage', handler)
    document.addEventListener('visibilitychange', handler)
    return () => {
      cancel = true
      window.removeEventListener('sonrisas-leidos-changed', handler)
      window.removeEventListener('focus', handler)
      window.removeEventListener('pageshow', handler)
      window.removeEventListener('storage', handler)
      document.removeEventListener('visibilitychange', handler)
    }
  }, [etapaHijo])

  const nombrePadre = profile?.nombre_completo?.split(' ')[0] || 'Familia'
  const completadas = [rutina.cepillado_manana, rutina.cepillado_noche, rutina.revision_encias].filter(Boolean).length + (sinDulces ? 1 : 0)
  const edad = hijo?.fecha_nacimiento ? calcularEdad(hijo.fecha_nacimiento) : null

  return (
    <div className="app-container">
      <Sparkles />
      {showTimer && <TimerCepillado onClose={() => setShowTimer(false)} hijoNombre={hijo?.nombre} userId={userId} hijoId={hijo?.id} onSave={(campo) => setRutina(r => ({ ...r, [campo]: true }))} />}
      <div className="page-content">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <SonrisasLogo size={56} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/notificaciones')}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm relative"
            >
              <span className="text-lg">🔔</span>
              {hayNotifNueva && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
            <button
              onClick={() => router.push('/dashboard/perfil')}
              className="w-10 h-10 bg-brand-200 rounded-full flex items-center justify-center font-black text-brand-700 text-sm overflow-hidden"
            >
              {avatarPadre && (avatarPadre.startsWith('http') || avatarPadre.startsWith('data:'))
                ? <img src={avatarPadre} alt="perfil" className="w-full h-full object-cover" />
                : avatarPadre || nombrePadre.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>

        {/* Greeting card */}
        {hijo ? (
          <div className="card bg-gradient-to-br from-brand-500 to-brand-700 text-white mb-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-2">
                <p className="font-black text-lg leading-tight">Hola, {nombrePadre} 👋</p>
                <p className="text-white/80 text-sm mt-0.5">
                  Hoy cuidamos a {hijo.nombre}{edad ? ` · ${edad}` : ''}
                </p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {hijo.etapa_dental ? `Etapa ${hijo.etapa_dental}` : 'Sus primeros dientes'}
                  </span>
                  {racha > 0 && (
                    <span className="inline-block bg-orange-400/80 text-white text-xs font-bold px-3 py-1 rounded-full">
                      🔥 {racha} {racha === 1 ? 'día' : 'días'} seguidos
                    </span>
                  )}
                </div>
              </div>
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-5xl flex-shrink-0">
                {hijo.avatar_url || '👶'}
              </div>
            </div>
          </div>
        ) : (
          <div className="card bg-gradient-to-br from-brand-500 to-brand-700 text-white mb-4">
            <p className="font-black text-lg">Hola, {nombrePadre} 👋</p>
            <p className="text-white/80 text-sm mt-1">Bienvenido a Sonrisas</p>
          </div>
        )}

        {/* Consejo del día */}
        <div className="card bg-yellow-50 border border-yellow-200 mb-4">
          <p className="text-yellow-700 font-black text-sm mb-1">💡 Consejo del día</p>
          <p className="text-yellow-600 text-sm">{consejo}</p>
        </div>

        {/* Rutina de hoy */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-brand-800">Rutina de hoy</h3>
            <span className="text-brand-500 font-bold text-sm">{completadas}/4</span>
          </div>
          <div className="h-2 bg-brand-100 rounded-full mb-4">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${Math.round((completadas/4)*100)}%` }} />
          </div>
          <button onClick={() => setShowTimer(true)} className="w-full bg-green-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-lg active:scale-95 transition-all mb-3">
            🪥 Comenzar Rutina
          </button>
          <div className="flex flex-col gap-2">
            {([
              { key: 'cepillado_manana' as const, label: '🌅 Cepillado mañana', sub: '2 min después del desayuno' },
              { key: 'cepillado_noche' as const, label: '🌙 Cepillado noche', sub: '2 min antes de dormir' },
              { key: 'revision_encias' as const, label: '👀 Revisar encías', sub: 'Revisión diaria' },
            ]).map(item => (
              <button key={item.key} onClick={() => toggleRutina(item.key)}
                className={`flex items-center gap-3 p-3 rounded-2xl text-left w-full active:scale-95 transition-all border
                  ${rutina[item.key] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm flex-shrink-0
                  ${rutina[item.key] ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                  {rutina[item.key] ? '✓' : ''}
                </div>
                <div>
                  <p className={`text-sm font-bold ${rutina[item.key] ? 'text-green-700 line-through' : 'text-brand-800'}`}>{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
              </button>
            ))}
            {/* Sin dulces - local only toggle */}
            <button onClick={() => setSinDulces(v => !v)}
              className={`flex items-center gap-3 p-3 rounded-2xl text-left w-full active:scale-95 transition-all border
                ${sinDulces ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm flex-shrink-0
                ${sinDulces ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                {sinDulces ? '✓' : ''}
              </div>
              <div>
                <p className={`text-sm font-bold ${sinDulces ? 'text-green-700 line-through' : 'text-brand-800'}`}>🍬 Sin dulces antes de dormir</p>
                <p className="text-xs text-gray-400">Evita azúcar nocturno</p>
              </div>
            </button>
          </div>
        </div>

        {/* Tu progreso en la guía */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-brand-800">Tu progreso en la guía</h3>
            <button onClick={() => router.push('/dashboard/guias')} className="text-brand-500 text-xs font-bold">Explorar →</button>
          </div>
          {progresoGuia.length === 0 || progresoGuia.every(p => p.leidos === 0) ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-2">📚</p>
              <p className="text-brand-500 text-sm font-semibold">Empieza a leer guías</p>
              <p className="text-brand-400 text-xs mt-1">Tu progreso aparecerá aquí</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {progresoGuia.map(item => {
                const icons: Record<string, string> = { lavado: '🪥', alimentacion: '🍎', dentista: '🏥' }
                const labels: Record<string, string> = { lavado: 'Lavado de dientes', alimentacion: 'Alimentación', dentista: 'Visita dentista' }
                return (
                  <div key={item.categoria}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-brand-800">{icons[item.categoria]} {labels[item.categoria]}</span>
                      <span className="text-xs text-brand-500 font-bold">{item.leidos}/{item.total}</span>
                    </div>
                    <div className="h-2 bg-brand-100 rounded-full">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-500"
                        style={{ width: item.total > 0 ? `${Math.round((item.leidos / item.total) * 100)}%` : '0%' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Progreso esta semana */}
        <div className="card mb-4">
          <h3 className="font-black text-brand-800 mb-3">Progreso esta semana</h3>
          <div className="flex justify-between">
            {DIAS.map((d, i) => {
              const hoyIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                    ${progreso[i] ? 'bg-green-500 text-white' : i === hoyIdx ? 'bg-brand-200 text-brand-700' : 'bg-gray-100 text-gray-400'}`}>
                    {progreso[i] ? '✓' : d}
                  </div>
                  <span className="text-xs text-gray-400">{d}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recomendado para ti */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-brand-800">Recomendado para ti</h3>
            <button onClick={() => router.push('/dashboard/guias')} className="text-brand-500 text-sm font-bold">Ver todo →</button>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {[
              { titulo: 'Primer cepillo', cat: '🪥 Lavado', bg: 'bg-brand-500 text-white' },
              { titulo: 'Alimentos amigos', cat: '🍎 Alimentación', bg: 'bg-white text-brand-800' },
              { titulo: 'Calmar molestias', cat: '🦠 Salud', bg: 'bg-white text-brand-800' },
            ].map((r, i) => (
              <button key={i} onClick={() => router.push('/dashboard/guias')}
                className={`${r.bg} rounded-2xl p-4 min-w-[140px] text-left shadow-card border border-gray-100 active:scale-95 transition-all flex-shrink-0`}>
                <p className="font-black text-sm leading-snug mb-1">{r.titulo}</p>
                <p className="text-xs opacity-60">{r.cat}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

function TimerCepillado({ onClose, hijoNombre, userId, hijoId, onSave }: {
  onClose: () => void; hijoNombre?: string; userId: string | null; hijoId?: string; onSave: (campo: string) => void
}) {
  const [seconds, setSeconds] = useState(120)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [turno, setTurno] = useState(0)
  const turnos = ['Dientes de arriba 😁', 'Dientes de abajo 😬', 'Parte de atrás 👅', 'La lengua 👅']

  useEffect(() => {
    if (!running || seconds <= 0) return
    const t = setInterval(() => setSeconds(s => { if (s <= 1) { setDone(true); setRunning(false); return 0 } return s - 1 }), 1000)
    return () => clearInterval(t)
  }, [running, seconds])

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setTurno(p => (p + 1) % 4), 30000)
    return () => clearInterval(t)
  }, [running])

  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  const pct = ((120 - seconds) / 120) * 100

  async function guardarCepillado() {
    if (userId) {
      const hoy = new Date().toISOString().split('T')[0]
      const campo = new Date().getHours() < 14 ? 'cepillado_manana' : 'cepillado_noche'
      await supabase.from('rutinas').upsert({ parent_id: userId, hijo_id: hijoId || null, fecha: hoy, [campo]: true }, { onConflict: 'parent_id,hijo_id,fecha' })
      onSave(campo)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center">
      <div className="w-full max-w-sm bg-white rounded-t-[2rem] p-6 pb-28 flex flex-col" style={{maxHeight:"92dvh",overflowY:"auto",scrollbarWidth:"none"}}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-brand-800">🪥 Hora de cepillarse</h3>
          <button onClick={onClose} className="text-gray-400 text-3xl w-10 h-10 flex items-center justify-center">×</button>
        </div>
        {!done ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#EAF6FD" strokeWidth="8" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#3B9DC8" strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - pct/100)}`}
                    className="transition-all duration-1000" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-brand-800">{min}:{sec.toString().padStart(2,'0')}</span>
                  <span className="text-brand-400 text-xs">minutos</span>
                </div>
              </div>
            </div>
            <div className="card bg-brand-50 text-center mb-4">
              <p className="text-brand-400 text-xs font-semibold mb-1">Ahora</p>
              <p className="text-brand-800 font-black text-lg">{turnos[turno]}</p>
            </div>
            <div className="card bg-yellow-50 mb-6">
              <p className="text-yellow-700 text-sm font-bold">🎵 Tip para {hijoNombre || 'tu peque'}</p>
              <p className="text-yellow-600 text-xs mt-1">¡Pon una canción divertida! 2 minutos es lo que dura una canción corta.</p>
            </div>
            <button onClick={() => setRunning(r => !r)}
              className={`w-full text-white font-black py-4 rounded-2xl text-base active:scale-95 transition-all
                ${running ? 'bg-red-400' : 'bg-brand-500'}`}>
              {running ? '⏸ Pausar' : seconds === 120 ? '▶ Comenzar' : '▶ Continuar'}
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-7xl mb-4">🎉</div>
            <h3 className="text-2xl font-black text-brand-800 mb-2">¡Excelente!</h3>
            <p className="text-brand-600 mb-6">{hijoNombre || 'Tu peque'} completó el cepillado 🦷✨</p>
            <button onClick={guardarCepillado} className="btn-primary">Guardar y continuar</button>
          </div>
        )}
      </div>
    </div>
  )
}
