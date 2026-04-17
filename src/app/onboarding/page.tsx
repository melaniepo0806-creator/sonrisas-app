'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Sparkles from '@/components/ui/Sparkles'

// ── Avatar data ─────────────────────────────────────────────
const AVATARES_NINOS = ['👦','🧒','👶','🧑','👦🏽','🧒🏽','👶🏽','🧑🏽','👦🏿','🧒🏿']
const AVATARES_NINAS = ['👧','🧒‍♀️','👶','🧑‍🦱','👧🏽','🧒🏽‍♀️','👶🏽','🧑🏽‍🦱','👧🏿','🧒🏿‍♀️']

// ── Helper: calculate stage ──────────────────────────────────
function calcularEtapa(fechaNac: string): string {
  const hoy = new Date()
  const nac = new Date(fechaNac)
  const meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth())
  if (meses < 6) return '0-6m'
  if (meses < 12) return '6-12m'
  if (meses < 24) return '1-2a'
  if (meses < 72) return '2-6a'
  if (meses < 144) return '6-12a'
  return '12a+'
}

function etapaLabel(e: string) {
  const map: Record<string, string> = {
    '0-6m': '0 a 6 meses', '6-12m': '6 a 12 meses', '1-2a': '1 a 2 años',
    '2-6a': '2 a 6 años', '6-12a': '6 a 12 años', '12a+': 'Más de 12 años'
  }
  return map[e] || e
}

function etapaInfo(e: string) {
  const info: Record<string, { titulo: string; descripcion: string; rutina: string[] }> = {
    '0-6m': {
      titulo: 'Antes del primer diente',
      descripcion: 'Aunque no hay dientes todavía, los cuidados comienzan ahora.',
      rutina: ['Limpia las encías con gasa húmeda', 'Masajea suavemente las encías', 'Evita dormir con biberón']
    },
    '6-12m': {
      titulo: 'Los primeros dientes',
      descripcion: '¡Están saliendo! Es el momento perfecto para empezar.',
      rutina: ['Cepilla con dedil suave 2 veces al día', 'Usa pasta sin flúor (tamaño de un grano de arroz)', 'Primera visita al dentista']
    },
    '1-2a': {
      titulo: 'Dientecitos en crecimiento',
      descripcion: 'Ya tiene varios dientes. ¡La rutina es clave!',
      rutina: ['Cepilla mañana y noche 2 minutos', 'Usa pasta con flúor (tamaño de un guisante)', 'Haz del cepillado un juego divertido']
    },
    '2-6a': {
      titulo: 'Dentición de leche completa',
      descripcion: 'Tiene todos sus dientes de leche. ¡A cuidarlos!',
      rutina: ['Cepillado 2 veces al día 2 minutos', 'Empieza a usar hilo dental', 'Visita al dentista cada 6 meses']
    },
    '6-12a': {
      titulo: 'Dientes permanentes',
      descripcion: 'Los dientes definitivos están llegando. Son para siempre.',
      rutina: ['Cepillado después de cada comida', 'Hilo dental diario', 'Revisar ortodoncia si es necesario']
    },
    '12a+': {
      titulo: 'Sonrisa de adolescente',
      descripcion: 'Autonomía e higiene: el equipo perfecto.',
      rutina: ['Cepillado 3 veces al día', 'Hilo dental y enjuague bucal', 'Revisión anual con el dentista']
    }
  }
  return info[e] || info['0-6m']
}

// ── Paso indicator ───────────────────────────────────────────
function Pasos({ actual, total }: { actual: number; total: number }) {
  return (
    <div className="flex gap-1.5 justify-center mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i < actual ? 'bg-brand-500 w-6' : i === actual ? 'bg-brand-400 w-6' : 'bg-brand-200 w-3'}`} />
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nombrePadre, setNombrePadre] = useState('')

  // Paso 0: datos del hijo
  const [hijo, setHijo] = useState({ nombre: '', dia: '', mes: '', anio: '', genero: 'nino' })
  // Paso 1: avatar
  const [avatarSeleccionado, setAvatarSeleccionado] = useState('')
  const [avatarTab, setAvatarTab] = useState<'ninos' | 'ninas'>('ninos')
  // Paso 4: tutorial
  const [tutorialPaso, setTutorialPaso] = useState(0)

  const etapa = hijo.anio && hijo.mes && hijo.dia
    ? calcularEtapa(`${hijo.anio}-${hijo.mes.padStart(2,'0')}-${hijo.dia.padStart(2,'0')}`)
    : '0-6m'

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('nombre_completo').eq('id', user.id).single()
      if (data?.nombre_completo) {
        const nombre = data.nombre_completo.split(' ')[0]
        setNombrePadre(nombre)
      }
    }
    loadUser()
  }, [router])

  async function guardarHijo() {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const fechaNac = `${hijo.anio}-${hijo.mes.padStart(2,'0')}-${hijo.dia.padStart(2,'0')}`
      const avatarFinal = avatarSeleccionado || (hijo.genero === 'nino' ? '👦' : '👧')

      const { error: insertError } = await supabase.from('hijos').insert({
        parent_id: user.id,
        nombre: hijo.nombre,
        fecha_nacimiento: fechaNac,
        genero: hijo.genero,
        avatar_url: avatarFinal,
        etapa_dental: etapa,
      })
      if (insertError) throw insertError

      // Guardar también en profiles como fallback
      await supabase.from('profiles').update({ avatar_url: avatarFinal }).eq('id', user.id)

      setPaso(2)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el perfil del bebé'
      console.error('[onboarding] hijos insert', err)
      setError(msg)
    } finally { setLoading(false) }
  }

  async function finalizarOnboarding() {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error: updErr } = await supabase.from('profiles').update({ onboarding_completo: true }).eq('id', user.id)
      if (updErr) throw updErr
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al finalizar'
      console.error('[onboarding] finalizar', err)
      setError(msg)
    } finally { setLoading(false) }
  }

  const tutorialSlides = [
    { icono: '🦷', titulo: 'Rutina diaria', desc: 'Registra el cepillado de tu peque cada día y construye un hábito para toda la vida.' },
    { icono: '📚', titulo: 'Guías por etapa', desc: 'Accede a guías personalizadas según la edad y etapa dental de tu hijo.' },
    { icono: '👥', titulo: 'El Nido', desc: 'Comparte experiencias con otros padres. ¡No estás solo en este camino!' },
    { icono: '📅', titulo: 'Citas dentales', desc: 'Agenda y gestiona las citas con el dentista directamente desde la app.' },
  ]

  // ── PASO 0: Perfil del peque ─────────────────────────────
  if (paso === 0) return (
    <div className="relative flex flex-col min-h-screen px-6 py-8">
      <Sparkles />
      <Pasos actual={0} total={6} />
      <h2 className="text-2xl font-black text-brand-800 mb-1">¿Cómo se llama tu peque?</h2>
      <p className="text-brand-500 text-sm mb-6">Cuéntanos sobre tu hijo para personalizar la app</p>
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-brand-700 font-bold text-sm ml-1 mb-1 block">Nombre del peque</label>
          <input type="text" placeholder="Nombre de tu hijo/a" value={hijo.nombre}
            onChange={e => setHijo(h => ({ ...h, nombre: e.target.value }))}
            className="input-field" />
        </div>
        <div>
          <label className="text-brand-700 font-bold text-sm ml-1 mb-1 block">Fecha de nacimiento</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Día" min="1" max="31" value={hijo.dia}
              onChange={e => setHijo(h => ({ ...h, dia: e.target.value }))}
              className="input-field text-center w-20" />
            <input type="number" placeholder="Mes" min="1" max="12" value={hijo.mes}
              onChange={e => setHijo(h => ({ ...h, mes: e.target.value }))}
              className="input-field text-center w-20" />
            <input type="number" placeholder="Año" min="2010" max="2026" value={hijo.anio}
              onChange={e => setHijo(h => ({ ...h, anio: e.target.value }))}
              className="input-field text-center flex-1" />
          </div>
        </div>
        <div>
          <label className="text-brand-700 font-bold text-sm ml-1 mb-2 block">Género</label>
          <div className="flex gap-3">
            {[{ v: 'nino', l: '👦 Niño' }, { v: 'nina', l: '👧 Niña' }].map(g => (
              <button key={g.v} onClick={() => setHijo(h => ({ ...h, genero: g.v }))}
                className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${hijo.genero === g.v ? 'bg-brand-500 text-white shadow-card' : 'bg-white text-brand-600 border-2 border-brand-200'}`}>
                {g.l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-auto pt-8">
        <button className="btn-primary" disabled={!hijo.nombre || !hijo.dia || !hijo.mes || !hijo.anio}
          onClick={() => setPaso(1)}>
          Continuar
        </button>
      </div>
    </div>
  )

  // ── PASO 1: Avatar ───────────────────────────────────────
  if (paso === 1) return (
    <div className="relative flex flex-col min-h-screen px-6 py-8">
      <Sparkles />
      <Pasos actual={1} total={6} />
      <button onClick={() => setPaso(0)} className="text-brand-500 text-sm font-bold mb-4 self-start">← Volver</button>
      <h2 className="text-2xl font-black text-brand-800 mb-1">Crea el perfil de {hijo.nombre || 'tu peque'}</h2>
      <p className="text-brand-500 text-sm mb-6">Elige un avatar que lo represente</p>

      {/* Avatar preview */}
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center text-5xl shadow-card border-4 border-brand-300">
          {avatarSeleccionado || (hijo.genero === 'nino' ? '👦' : '👧')}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['ninos', 'ninas'] as const).map(t => (
          <button key={t} onClick={() => setAvatarTab(t)}
            className={`flex-1 py-2.5 rounded-2xl font-bold text-sm transition-all ${avatarTab === t ? 'bg-brand-500 text-white' : 'bg-white text-brand-600 border-2 border-brand-200'}`}>
            {t === 'ninos' ? '👦 Niños' : '👧 Niñas'}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {(avatarTab === 'ninos' ? AVATARES_NINOS : AVATARES_NINAS).map((av, i) => (
          <button key={i} onClick={() => setAvatarSeleccionado(av)}
            className={`aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all ${avatarSeleccionado === av ? 'bg-brand-200 border-3 border-brand-500 scale-110 shadow-card' : 'bg-white border-2 border-gray-100'}`}>
            {av}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-3">
          <p className="text-red-500 text-sm text-center">{error}</p>
        </div>
      )}

      <div className="mt-auto">
        <button className="btn-primary" onClick={guardarHijo} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>
    </div>
  )

  // ── PASO 2: Bienvenida ───────────────────────────────────
  if (paso === 2) return (
    <div className="relative flex flex-col min-h-screen px-6 py-10 items-center justify-center text-center">
      <Sparkles />
      <Pasos actual={2} total={6} />
      <div className="text-7xl mb-6 animate-bounce">🦷</div>
      <h2 className="text-3xl font-black text-brand-800 mb-2">
        ¡Bienvenida{nombrePadre ? `, ${nombrePadre}` : ''}!
      </h2>
      <p className="text-brand-600 font-semibold text-lg mb-2">Ya casi estamos listos</p>
      <p className="text-brand-500 text-sm mb-8 leading-relaxed">
        Hemos creado el perfil de <strong>{hijo.nombre}</strong>.<br />
        Ahora te mostramos todo lo que puedes hacer.
      </p>
      <div className="w-full grid grid-cols-2 gap-3 mb-8">
        {[
          { icono: '🦷', label: 'Rutinas diarias' },
          { icono: '📚', label: 'Guías de etapas' },
          { icono: '👥', label: 'Comunidad' },
          { icono: '📅', label: 'Citas dentales' },
        ].map((item, i) => (
          <div key={i} className="card flex flex-col items-center gap-2 py-4">
            <span className="text-3xl">{item.icono}</span>
            <span className="text-brand-700 font-bold text-sm">{item.label}</span>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={() => setPaso(3)}>
        Ver cómo funciona →
      </button>
    </div>
  )

  // ── PASO 3: Tutorial ─────────────────────────────────────
  if (paso === 3) return (
    <div className="relative flex flex-col min-h-screen px-6 py-8">
      <Sparkles />
      <Pasos actual={3} total={6} />
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-8xl mb-6">{tutorialSlides[tutorialPaso].icono}</div>
        <h2 className="text-2xl font-black text-brand-800 mb-3">{tutorialSlides[tutorialPaso].titulo}</h2>
        <p className="text-brand-600 text-base leading-relaxed mb-8">{tutorialSlides[tutorialPaso].desc}</p>
        {/* Dots */}
        <div className="flex gap-2 mb-8">
          {tutorialSlides.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === tutorialPaso ? 'bg-brand-500 w-5' : 'bg-brand-200'}`} />
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        {tutorialPaso > 0 && (
          <button onClick={() => setTutorialPaso(p => p - 1)} className="btn-secondary flex-1">← Anterior</button>
        )}
        <button onClick={() => tutorialPaso < tutorialSlides.length - 1 ? setTutorialPaso(p => p + 1) : setPaso(4)}
          className="btn-primary flex-1">
          {tutorialPaso < tutorialSlides.length - 1 ? 'Siguiente →' : '¡Entendido! →'}
        </button>
      </div>
      <button onClick={() => setPaso(4)} className="text-brand-400 text-sm font-medium text-center mt-3">
        Saltar tutorial
      </button>
    </div>
  )

  // ── PASO 4: Etapa dental ─────────────────────────────────
  if (paso === 4) {
    const info = etapaInfo(etapa)
    return (
      <div className="relative flex flex-col min-h-screen px-6 py-8">
        <Sparkles />
        <Pasos actual={4} total={6} />
        <h2 className="text-2xl font-black text-brand-800 mb-1">La etapa de {hijo.nombre || 'tu peque'}</h2>
        <p className="text-brand-500 text-sm mb-6">Basado en su fecha de nacimiento</p>
        {/* Etapa card */}
        <div className="card bg-gradient-to-br from-brand-500 to-brand-600 text-white mb-6">
          <div className="text-4xl mb-2">🦷</div>
          <div className="inline-block bg-white/20 rounded-xl px-3 py-1 text-xs font-bold mb-2">{etapaLabel(etapa)}</div>
          <h3 className="text-xl font-black mb-2">{info.titulo}</h3>
          <p className="text-white/80 text-sm">{info.descripcion}</p>
        </div>
        <h3 className="text-brand-800 font-black text-lg mb-3">Recomendaciones para esta etapa</h3>
        <div className="flex flex-col gap-2 mb-6">
          {info.rutina.map((r, i) => (
            <div key={i} className="card flex items-center gap-3 py-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black ${['bg-brand-500','bg-green-500','bg-yellow-400'][i % 3]}`}>{i+1}</div>
              <span className="text-brand-700 text-sm font-semibold flex-1">{r}</span>
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setPaso(5)}>
          Ver mi rutina personalizada →
        </button>
      </div>
    )
  }

  // ── PASO 5: Rutina personalizada ─────────────────────────
  if (paso === 5) {
    const info = etapaInfo(etapa)
    return (
      <div className="relative flex flex-col min-h-screen px-6 py-8">
        <Sparkles />
        <Pasos actual={5} total={6} />
        <h2 className="text-2xl font-black text-brand-800 mb-1">La rutina de {hijo.nombre || 'tu peque'}</h2>
        <p className="text-brand-500 text-sm mb-6">Esto es lo que haremos cada día juntos</p>

        <div className="flex flex-col gap-3 mb-6">
          {[
            { hora: '🌅 Mañana', actividad: 'Cepillado de mañana', detalle: '2 minutos después del desayuno', icono: '🪥' },
            { hora: '🌙 Noche', actividad: 'Cepillado de noche', detalle: '2 minutos antes de dormir', icono: '🪥' },
            { hora: '👀 Revisión', actividad: 'Revisar encías', detalle: 'Para detectar cambios a tiempo', icono: '🔍' },
          ].map((r, i) => (
            <div key={i} className="card flex items-center gap-4 py-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-2xl">{r.icono}</div>
              <div className="flex-1">
                <p className="text-xs text-brand-400 font-semibold">{r.hora}</p>
                <p className="text-brand-800 font-black">{r.actividad}</p>
                <p className="text-brand-500 text-xs">{r.detalle}</p>
              </div>
              <div className="w-6 h-6 rounded-full border-2 border-brand-300" />
            </div>
          ))}
        </div>

        <div className="card bg-green-50 border border-green-200 mb-6">
          <p className="text-green-700 font-bold text-sm">💡 Consejo para tu etapa</p>
          <p className="text-green-600 text-xs mt-1">{info.descripcion}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-3">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}

        <button className="btn-primary" onClick={finalizarOnboarding} disabled={loading}>
          {loading ? 'Preparando tu app...' : '¡Empezar con Sonrisas! 🎉'}
        </button>
      </div>
    )
  }

  return null
}
