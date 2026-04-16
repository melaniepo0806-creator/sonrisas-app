'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/ui/BottomNav'
import Sparkles from '@/components/ui/Sparkles'

const DIAS = ['L','M','X','J','V','S','D']
const CONSEJOS = [
  '🦷 Cepilla los dientes durante 2 minutos, dos veces al día.',
  '💧 Beber agua después de comer ayuda a limpiar los dientes.',
  '🍎 Las frutas y verduras crujientes ayudan a limpiar los dientes.',
  '🧴 Cambia el cepillo cada 3 meses o cuando las cerdas se doblen.',
  '😴 El cepillado de noche es el más importante del día.',
]

export default function HomePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{nombre_completo?: string} | null>(null)
  const [hijo, setHijo] = useState<{id?: string; nombre?: string; etapa_dental?: string; avatar_url?: string} | null>(null)
  const [rutina, setRutina] = useState({ cepillado_manana: false, cepillado_noche: false, revision_encias: false })
  const [progreso, setProgreso] = useState<boolean[]>([false,false,false,false,false,false,false])
  const [consejo] = useState(CONSEJOS[Math.floor(Math.random() * CONSEJOS.length)])
  const [showTimer, setShowTimer] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: hijos } = await supabase.from('hijos').select('*').eq('parent_id', user.id).limit(1)
      if (hijos?.length) setHijo(hijos[0])
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
  }

  const nombrePadre = profile?.nombre_completo?.split(' ')[0] || 'Familia'
  const completadas = [rutina.cepillado_manana, rutina.cepillado_noche, rutina.revision_encias].filter(Boolean).length

  return (
    <div className="app-container">
      <Sparkles />
      {showTimer && <TimerCepillado onClose={() => setShowTimer(false)} hijoNombre={hijo?.nombre} userId={userId} hijoId={hijo?.id} onSave={(campo) => setRutina(r => ({ ...r, [campo]: true }))} />}
      <div className="page-content">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-brand-500 text-sm font-semibold">Buenos días 👋</p>
            <h1 className="text-2xl font-black text-brand-800">Hola, {nombrePadre}</h1>
          </div>
          <div className="w-12 h-12 rounded-full bg-brand-200 flex items-center justify-center text-2xl">{hijo?.avatar_url || '👶'}</div>
        </div>

        {hijo && (
          <div className="card bg-gradient-to-br from-brand-500 to-brand-600 text-white mb-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">{hijo.avatar_url || '👶'}</div>
            <div className="flex-1">
              <p className="font-black text-lg">Hola, {hijo.nombre} 💛</p>
              <p className="text-white/80 text-xs">Etapa: {hijo.etapa_dental || '0-1'} • {new Date().toLocaleDateString('es-ES',{weekday:'long', day:'numeric', month:'long'})}</p>
            </div>
          </div>
        )}

        <div className="card bg-yellow-50 border border-yellow-200 mb-4">
          <p className="text-yellow-700 font-black text-sm mb-1">💡 Consejo del día</p>
          <p className="text-yellow-600 text-sm">{consejo}</p>
        </div>

        <div className="card mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-brand-800">Rutina de hoy</h3>
            <span className="text-brand-500 font-bold text-sm">{completadas}/3</span>
          </div>
          <div className="h-2 bg-brand-100 rounded-full mb-4">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${Math.round((completadas/3)*100)}%` }} />
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
          </div>
        </div>

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="w-full max-w-sm bg-white rounded-t-[2rem] p-6 pb-16 flex flex-col" style={{maxHeight:"92dvh",overflowY:"auto",scrollbarWidth:"none"}}>
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
