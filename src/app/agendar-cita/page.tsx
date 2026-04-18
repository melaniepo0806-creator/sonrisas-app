'use client'
import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DIAS_SEMANA = ['Do','Lu','Ma','Mi','Ju','Vi','Sa']
const HORARIOS = ['9:00','10:30','12:00','16:00']
const MOTIVOS = ['Revisión','Limpieza','Urgencia']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function AgendarCitaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-brand-500">Cargando…</div>}>
      <AgendarCitaInner />
    </Suspense>
  )
}

function AgendarCitaInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Acepta ?fecha=YYYY-MM-DD para preseleccionar una fecha viniendo desde el calendario
  useEffect(() => {
    const f = searchParams.get('fecha')
    if (!f) return
    const [y, m, d] = f.split('-').map(Number)
    if (!y || !m || !d) return
    const sel = new Date(y, m - 1, d)
    const hoy = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    if (sel < hoy) return // no preseleccionar fechas pasadas
    setYear(y); setMonth(m - 1); setSelectedDay(d)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  const [motivo, setMotivo] = useState('Revisión')
  const [hora, setHora] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  async function handleSave() {
    if (!selectedDay || !hora) return
    setLoading(true)
    const fecha = new Date(year, month, selectedDay)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('citas').insert({
        parent_id: user.id,
        fecha: fecha.toISOString().split('T')[0],
        hora,
        motivo,
      })
    }
    setLoading(false)
    setSaved(true)
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="text-7xl mb-6">📅</div>
        <h2 className="text-2xl font-black text-brand-800 mb-2">¡Cita guardada!</h2>
        <p className="text-brand-500 mb-2">
          {selectedDay} de {MESES[month]} de {year} a las {hora}
        </p>
        <p className="text-brand-500 text-sm mb-8">Motivo: {motivo}</p>
        <p className="text-green-600 font-semibold text-sm mb-8">🔔 Recordatorio automático activado</p>
        <button onClick={() => router.push('/dashboard')} className="btn-primary">
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen pb-10">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <Link href="/dashboard" className="text-brand-500">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="flex-1 card bg-gradient-to-r from-brand-500 to-brand-600 text-white py-3">
          <p className="font-black">Agendar cita</p>
          <p className="text-white/80 text-xs">Recordatorio automático activado</p>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Para qué hijo */}
        <div className="card">
          <p className="text-brand-600 font-bold text-sm mb-2">¿Para qué hijo?</p>
          <div className="flex items-center gap-3 bg-brand-50 rounded-2xl px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-200 flex items-center justify-center text-lg">👶</div>
            <p className="text-brand-700 font-bold text-sm flex-1">Mateo · 14 meses</p>
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Motivo */}
        <div className="card">
          <p className="text-brand-600 font-bold text-sm mb-2">Motivo</p>
          <div className="flex gap-2">
            {MOTIVOS.map(m => (
              <button key={m} onClick={() => setMotivo(m)}
                className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all
                  ${motivo === m ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-500'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Calendario */}
        <div className="card">
          <p className="text-brand-600 font-bold text-sm mb-3">Selecciona el día</p>
          {/* Nav mes */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 19l-7-7 7-7" stroke="#3B9DC8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-brand-700 font-bold">{MESES[month]}</span>
              <span className="text-brand-500 font-semibold">{year}</span>
            </div>
            <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="#3B9DC8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          {/* Days header */}
          <div className="grid grid-cols-7 mb-1">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="text-center text-brand-400 text-xs font-bold py-1">{d}</div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`}/>)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
              const isSelected = selectedDay === day
              return (
                <button
                  key={day}
                  disabled={isPast}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-full text-sm font-semibold transition-all
                    ${isSelected ? 'bg-brand-500 text-white shadow-md scale-110' :
                      isToday ? 'border-2 border-brand-400 text-brand-600' :
                      isPast ? 'text-gray-300' : 'text-brand-700 hover:bg-brand-50'}`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>

        {/* Horarios */}
        {selectedDay && (
          <div className="card">
            <p className="text-brand-600 font-bold text-sm mb-3">Selecciona el horario</p>
            <div className="flex gap-2 flex-wrap">
              {HORARIOS.map(h => (
                <button key={h} onClick={() => setHora(h)}
                  className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all
                    ${hora === h ? 'bg-brand-500 text-white shadow-card' : 'bg-brand-50 text-brand-600'}`}>
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!selectedDay || !hora || loading}
          className="btn-primary"
        >
          {loading ? 'Guardando...' : 'Guardar y activar recordatorio'}
        </button>
      </div>
    </div>
  )
}
