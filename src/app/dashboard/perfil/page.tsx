'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/ui/BottomNav'
import Sparkles from '@/components/ui/Sparkles'

const DIAS = ['L','M','X','J','V','S','D']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const LOGROS_DEF = [
  { tipo: 'primera_semana', nombre: 'Primera semana', icono: '⭐', desc: '7 días completando la rutina', color: 'bg-yellow-100 border-yellow-300' },
  { tipo: 'mes_perfecto', nombre: 'Mes perfecto', icono: '💎', desc: '30 días sin fallar', color: 'bg-blue-100 border-blue-300' },
  { tipo: 'primera_foto', nombre: 'Foto Sonrisa', icono: '📸', desc: 'Subiste tu primera foto al Nido', color: 'bg-pink-100 border-pink-300' },
  { tipo: 'primer_diente', nombre: 'Primer diente', icono: '🦷', desc: 'Registraste el primer diente', color: 'bg-green-100 border-green-300' },
  { tipo: 'primera_cita', nombre: 'Primera cita', icono: '📅', desc: 'Agendaste tu primera cita dental', color: 'bg-purple-100 border-purple-300' },
  { tipo: 'racha_7', nombre: 'Racha de fuego', icono: '🔥', desc: '7 días seguidos cepillándose', color: 'bg-orange-100 border-orange-300' },
  { tipo: 'racha_30', nombre: 'Cepillado perfecto', icono: '🏆', desc: '30 días de racha', color: 'bg-yellow-100 border-yellow-300' },
  { tipo: 'comunidad', nombre: 'Miembro del Nido', icono: '🪺', desc: 'Publicaste en la comunidad', color: 'bg-teal-100 border-teal-300' },
]

type Vista = 'perfil' | 'progreso' | 'calendario' | 'logros' | 'config' | 'editar_perfil' | 'cambiar_password' | 'legal_datos' | 'legal_privacidad' | 'legal_terminos'

export default function PerfilPage() {
  const router = useRouter()
  const [vista, setVista] = useState<Vista>('perfil')
  const [profile, setProfile] = useState<{nombre_completo?: string; telefono?: string; avatar_url?: string} | null>(null)
  const [hijo, setHijo] = useState<{nombre?: string; avatar_url?: string; etapa_dental?: string} | null>(null)
  const [logros, setLogros] = useState<string[]>([])
  const [rutinas, setRutinas] = useState<{fecha: string; completada: boolean}[]>([])
  const [mesActual, setMesActual] = useState(new Date())
  const [progSemana, setProgSemana] = useState<boolean[]>([false,false,false,false,false,false,false])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: hijos } = await supabase.from('hijos').select('*').eq('parent_id', user.id).limit(1)
      if (hijos?.length) setHijo(hijos[0])
      const { data: logrosData } = await supabase.from('logros').select('tipo').eq('parent_id', user.id)
      setLogros(logrosData?.map(l => l.tipo) || [])
      // Rutinas del mes
      const inicio = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1).toISOString().split('T')[0]
      const fin = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).toISOString().split('T')[0]
      const { data: ruts } = await supabase.from('rutinas').select('fecha, completada').eq('parent_id', user.id).gte('fecha', inicio).lte('fecha', fin)
      setRutinas(ruts || [])
      // Progreso semana
      const lunes = new Date(); lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7))
      const { data: semana } = await supabase.from('rutinas').select('fecha, completada').eq('parent_id', user.id).gte('fecha', lunes.toISOString().split('T')[0])
      if (semana) {
        const prog = Array(7).fill(false)
        semana.forEach(r => { const d = (new Date(r.fecha).getDay() + 6) % 7; prog[d] = r.completada })
        setProgSemana(prog)
      }
    }
    load()
  }, [router, mesActual])

  async function handleLogout() { await supabase.auth.signOut(); router.push('/login') }

  const nombre = profile?.nombre_completo?.split(' ')[0] || 'Usuario'
  const completadasSemana = progSemana.filter(Boolean).length
  const completadasMes = rutinas.filter(r => r.completada).length

  // ── Sub-vistas ──────────────────────────────────────────
  if (vista === 'progreso') return <VistaProgreso onBack={() => setVista('perfil')} progSemana={progSemana} completadasSemana={completadasSemana} completadasMes={completadasMes} hijoNombre={hijo?.nombre} />
  if (vista === 'calendario') return <VistaCalendario onBack={() => setVista('perfil')} rutinas={rutinas} mes={mesActual} setMes={setMesActual} />
  if (vista === 'logros') return <VistaLogros onBack={() => setVista('perfil')} logrosGanados={logros} />
  if (vista === 'config') return <VistaConfig onBack={() => setVista('perfil')} onLogout={handleLogout} onLegal={(v: string) => setVista(v as Vista)} onEditPerfil={() => setVista('editar_perfil')} onCambiarPassword={() => setVista('cambiar_password')} />
  if (vista === 'editar_perfil') return <VistaEditarPerfil onBack={() => setVista('config')} profile={profile} onSave={(p: typeof profile) => setProfile(p)} />
  if (vista === 'cambiar_password') return <VistaCambiarPassword onBack={() => setVista('config')} />
  if (vista === 'legal_datos') return <VistaTratamentoDatos onBack={() => setVista('config')} />
  if (vista === 'legal_privacidad') return <VistaPrivacidad onBack={() => setVista('config')} />
  if (vista === 'legal_terminos') return <VistaTerminos onBack={() => setVista('config')} />

  // ── Vista principal perfil ─────────────────────────────
  // Calcular edad del hijo
  const edadHijo = (() => {
    const h = hijo as {fecha_nacimiento?: string} | null
    if (!h?.fecha_nacimiento) return null
    const nacimiento = new Date(h.fecha_nacimiento)
    const hoy = new Date()
    const meses = (hoy.getFullYear() - nacimiento.getFullYear()) * 12 + (hoy.getMonth() - nacimiento.getMonth())
    if (meses < 24) return `${meses}m`
    return `${Math.floor(meses/12)}a`
  })()
  const diasRacha = progSemana.filter(Boolean).length
  const diasActivos = rutinas.filter(r => r.completada).length

  const LOGROS_DISPLAY = [
    { icono: '🔥', nombre: 'Primera semana', sub: '7 días seguidos', ganado: diasActivos >= 7 },
    { icono: '🪥', nombre: 'Cepillado perfecto', sub: '14 días sin fallar', ganado: diasActivos >= 14 },
    { icono: '🏆', nombre: 'Experto', sub: '1 mes activo', ganado: diasActivos >= 30 },
    { icono: '🦷', nombre: 'Familia Sonrisas', sub: 'Cuenta creada', ganado: true },
  ]

  return (
    <div className="app-container">
      <Sparkles />
      <div className="page-content">
        {/* Header hijo */}
        <div className="card bg-gradient-to-br from-brand-500 to-brand-600 text-white mb-4 relative overflow-hidden">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-black">{hijo?.nombre || nombre}</h1>
              {hijo && <p className="text-white/70 text-xs">Perfil de {nombre}</p>}
            </div>
            <button onClick={() => setVista('editar_perfil')} className="text-white/80 text-sm font-bold bg-white/20 px-3 py-1 rounded-full">Editar</button>
          </div>

          {/* Avatar grande */}
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center text-5xl shadow-lg">
              {hijo?.avatar_url || '👶'}
            </div>
          </div>

          {/* Stats: Edad / Días / Racha */}
          <div className="flex justify-around text-center border-t border-white/20 pt-3">
            <div>
              <p className="font-black text-xl">{edadHijo || '--'}</p>
              <p className="text-white/60 text-xs">Edad</p>
            </div>
            <div className="border-l border-white/20 px-4">
              <p className="font-black text-xl">{diasActivos}</p>
              <p className="text-white/60 text-xs">Días</p>
            </div>
            <div className="border-l border-white/20 px-4">
              <p className="font-black text-xl">🔥 {diasRacha}</p>
              <p className="text-white/60 text-xs">Racha</p>
            </div>
          </div>
        </div>

        {/* Esta semana */}
        <div className="card mb-4">
          <h3 className="font-black text-brand-800 mb-3">Esta semana</h3>
          <div className="flex justify-between">
            {DIAS.map((d, i) => {
              const hoyIdx = (new Date().getDay() + 6) % 7
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                    ${progSemana[i] ? 'bg-green-500 text-white' : i === hoyIdx ? 'bg-brand-200 text-brand-700' : 'bg-gray-100 text-gray-300'}`}>
                    {progSemana[i] ? '✓' : ''}
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold">{d}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Logros */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-brand-800">Logros</h3>
            <button onClick={() => setVista('logros')} className="text-brand-500 text-xs font-bold">Ver todo →</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {LOGROS_DISPLAY.map((l, i) => (
              <div key={i} className={`card py-3 text-center transition-all ${l.ganado ? 'opacity-100' : 'opacity-40'}`}>
                <p className="text-3xl mb-1">{l.icono}</p>
                <p className="font-black text-brand-800 text-xs">{l.nombre}</p>
                <p className="text-brand-400 text-[10px]">{l.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Menú opciones */}
        <div className="flex flex-col gap-2 mb-4">
          {[
            { icono: '⚙️', label: 'Configuración', action: () => setVista('config') },
            { icono: '🔔', label: 'Notificaciones', action: () => router.push('/notificaciones') },
            { icono: '📋', label: 'Historial de rutinas', action: () => setVista('calendario') },
          ].map((item, i) => (
            <button key={i} onClick={item.action}
              className="card w-full flex items-center justify-between active:scale-95 transition-all text-left py-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icono}</span>
                <p className="font-bold text-brand-800">{item.label}</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#3B9DC8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          ))}
        </div>

        <button onClick={handleLogout} className="w-full py-4 text-red-400 font-bold text-sm rounded-2xl border-2 border-red-100 mb-2 active:scale-95 transition-all">
          Cerrar sesión
        </button>
      </div>
      <BottomNav />
    </div>
  )
}

// ── Progreso ──────────────────────────────────────────────
function VistaProgreso({ onBack, progSemana, completadasSemana, completadasMes, hijoNombre }: any) {
  return (
    <div className="app-container">
      <div className="page-content">
        <button onClick={onBack} className="text-brand-500 font-bold text-sm mb-4 flex items-center gap-1">← Volver</button>
        <h2 className="text-2xl font-black text-brand-800 mb-4">Progreso semanal</h2>
        <div className="card mb-4">
          <h3 className="font-black text-brand-700 mb-3">Esta semana</h3>
          <div className="flex justify-between mb-3">
            {DIAS.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${progSemana[i] ? 'bg-green-500 text-white' : i === (new Date().getDay()+6)%7 ? 'bg-brand-200 text-brand-700' : 'bg-gray-100 text-gray-400'}`}>
                  {progSemana[i] ? '✓' : d}
                </div>
                <span className="text-xs text-gray-400">{d}</span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-brand-100 rounded-full">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(completadasSemana/7)*100}%` }} />
          </div>
          <p className="text-brand-500 text-xs mt-2 text-center">{completadasSemana} de 7 días completados</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card text-center"><p className="text-3xl font-black text-brand-800">{completadasSemana}</p><p className="text-brand-500 text-xs">Días esta semana</p></div>
          <div className="card text-center"><p className="text-3xl font-black text-green-500">{completadasMes}</p><p className="text-brand-500 text-xs">Días este mes</p></div>
        </div>
        {completadasSemana >= 5 && (
          <div className="card bg-green-50 border border-green-200 text-center">
            <p className="text-3xl mb-1">🎉</p>
            <p className="font-black text-green-700">¡Semana increíble!</p>
            <p className="text-green-600 text-sm">{hijoNombre || 'Tu peque'} lo está haciendo genial</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

// ── Calendario ───────────────────────────────────────────
function VistaCalendario({ onBack, rutinas, mes, setMes }: any) {
  const diasEnMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const primerDia = (new Date(mes.getFullYear(), mes.getMonth(), 1).getDay() + 6) % 7
  const rutinasMap: Record<string, boolean> = {}
  rutinas.forEach((r: any) => { rutinasMap[r.fecha.split('T')[0]] = r.completada })
  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div className="app-container">
      <div className="page-content">
        <button onClick={onBack} className="text-brand-500 font-bold text-sm mb-4 flex items-center gap-1">← Volver</button>
        <h2 className="text-2xl font-black text-brand-800 mb-4">Calendario de rutinas</h2>
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth()-1))} className="text-brand-500 font-bold text-xl px-2">‹</button>
            <p className="font-black text-brand-800">{MESES[mes.getMonth()]} {mes.getFullYear()}</p>
            <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth()+1))} className="text-brand-500 font-bold text-xl px-2">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DIAS.map(d => <p key={d} className="text-center text-xs text-brand-400 font-bold">{d}</p>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array(primerDia).fill(null).map((_, i) => <div key={`e${i}`} />)}
            {Array(diasEnMes).fill(null).map((_, i) => {
              const fecha = `${mes.getFullYear()}-${String(mes.getMonth()+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`
              const completada = rutinasMap[fecha]
              const esHoy = fecha === hoy
              const futuro = fecha > hoy
              return (
                <div key={i} className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all
                  ${completada ? 'bg-green-500 text-white' : esHoy ? 'bg-brand-300 text-white' : futuro ? 'bg-gray-50 text-gray-300' : 'bg-red-100 text-red-300'}`}>
                  {completada ? '✓' : i+1}
                </div>
              )
            })}
          </div>
          <div className="flex gap-3 mt-4 justify-center text-xs">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-gray-500">Completado</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-200" /><span className="text-gray-500">Faltó</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gray-100" /><span className="text-gray-500">Futuro</span></div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

// ── Logros ───────────────────────────────────────────────
function VistaLogros({ onBack, logrosGanados }: { onBack: () => void; logrosGanados: string[] }) {
  return (
    <div className="app-container">
      <div className="page-content">
        <button onClick={onBack} className="text-brand-500 font-bold text-sm mb-4 flex items-center gap-1">← Volver</button>
        <h2 className="text-2xl font-black text-brand-800 mb-1">Logros y medallas</h2>
        <p className="text-brand-500 text-sm mb-5">{logrosGanados.length} de {LOGROS_DEF.length} conseguidos</p>
        <div className="grid grid-cols-2 gap-3">
          {LOGROS_DEF.map(l => {
            const ganado = logrosGanados.includes(l.tipo)
            return (
              <div key={l.tipo} className={`card border-2 ${ganado ? l.color : 'bg-gray-50 border-gray-200 opacity-60'} flex flex-col items-center text-center py-4 gap-2`}>
                <span className={`text-4xl ${!ganado && 'grayscale opacity-50'}`}>{l.icono}</span>
                <p className={`font-black text-sm ${ganado ? 'text-brand-800' : 'text-gray-400'}`}>{l.nombre}</p>
                <p className={`text-xs ${ganado ? 'text-brand-500' : 'text-gray-400'}`}>{l.desc}</p>
                {!ganado && <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">🔒 Por conseguir</span>}
              </div>
            )
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

// ── Configuración ────────────────────────────────────────
function VistaConfig({ onBack, onLogout, onLegal, onEditPerfil, onCambiarPassword }: any) {
  const [notifs, setNotifs] = useState({ cepillado: true, cita: true, comunidad: false })
  return (
    <div className="app-container">
      <div className="page-content">
        <button onClick={onBack} className="text-brand-500 font-bold text-sm mb-4 flex items-center gap-1">← Volver</button>
        <div className="card bg-gradient-to-br from-brand-500 to-brand-600 text-white mb-5 py-3">
          <h2 className="font-black text-xl">⚙️ Configuración</h2>
          <p className="text-white/70 text-xs">Gestiona tu cuenta y preferencias</p>
        </div>
        <p className="text-brand-400 text-xs font-bold uppercase tracking-wide ml-1 mb-2">Mi cuenta</p>
        {[
          { label: 'Editar perfil', sub: 'Nombre, teléfono y datos', icono: '✏️', action: onEditPerfil },
          { label: 'Cambiar contraseña', sub: 'Seguridad de tu cuenta', icono: '🔑', action: onCambiarPassword },
        ].map((item, i) => (
          <button key={i} onClick={item.action} className="card w-full flex items-center gap-3 mb-2 active:scale-95 transition-all text-left">
            <span className="text-xl">{item.icono}</span>
            <div className="flex-1"><p className="font-black text-brand-800 text-sm">{item.label}</p><p className="text-brand-400 text-xs">{item.sub}</p></div>
            <span className="text-brand-400">›</span>
          </button>
        ))}
        <p className="text-brand-400 text-xs font-bold uppercase tracking-wide ml-1 mb-2 mt-4">Notificaciones</p>
        {[{ key: 'cepillado', label: '🪥 Recordatorio cepillado' },
          { key: 'cita', label: '📅 Cita dental' },
          { key: 'comunidad', label: '👥 Comunidad' }].map((item) => (
          <div key={item.key} className="card flex items-center justify-between mb-2">
            <p className="font-bold text-brand-800 text-sm">{item.label}</p>
            <button onClick={() => setNotifs(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
              className={`w-12 h-6 rounded-full transition-all ${notifs[item.key as keyof typeof notifs] ? 'bg-brand-500' : 'bg-gray-200'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-all mx-0.5 ${notifs[item.key as keyof typeof notifs] ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        ))}
        <p className="text-brand-400 text-xs font-bold uppercase tracking-wide ml-1 mb-2 mt-4">Legal y privacidad</p>
        {[{ label: '🔐 Tratamiento de datos', action: () => onLegal('legal_datos') },
          { label: '📋 Política de privacidad', action: () => onLegal('legal_privacidad') },
          { label: '📄 Términos y condiciones', action: () => onLegal('legal_terminos') }].map((item, i) => (
          <button key={i} onClick={item.action} className="card w-full flex items-center justify-between mb-2 active:scale-95 transition-all text-left">
            <p className="font-bold text-brand-800 text-sm">{item.label}</p>
            <span className="text-brand-400">›</span>
          </button>
        ))}
        <button onClick={onLogout} className="w-full mt-4 py-4 text-red-400 font-bold rounded-2xl border-2 border-red-100 active:scale-95 transition-all">
          🚪 Cerrar sesión
        </button>
      </div>
      <BottomNav />
    </div>
  )
}

// ── Legal pages ──────────────────────────────────────────
function VistaTratamentoDatos({ onBack }: { onBack: () => void }) {
  const [consent, setConsent] = useState({ datos: false, notifs: false, comms: false })
  return (
    <div className="app-container">
      <div className="page-content">
        <button onClick={onBack} className="text-brand-500 font-bold text-sm mb-4">← Configuración</button>
        <div className="card bg-brand-50 border border-brand-100 mb-4">
          <p className="text-2xl mb-1">🔐</p>
          <h2 className="text-xl font-black text-brand-800 mb-1">Tratamiento de datos</h2>
          <p className="text-brand-500 text-xs font-semibold">Tu privacidad es nuestra prioridad</p>
        </div>
        {[{ t: '¿Qué datos recogemos?', c: 'Recogemos el nombre, fecha de nacimiento y etapa dental de tu hijo para personalizar los contenidos. También guardamos tu correo electrónico y contraseña para gestionar tu cuenta.' },
          { t: '¿Para qué los usamos?', c: 'Los datos se usan exclusivamente para ofrecerte guías adaptadas a la edad de tu hijo, enviarte recordatorios de rutinas y citas, y mejorar la experiencia de la app.' },
          { t: '¿Con quién los compartimos?', c: 'Solo compartimos datos con proveedores técnicos necesarios para el funcionamiento del servicio. Nunca vendemos tus datos a terceros.' },
          { t: '¿Cuánto tiempo los guardamos?', c: 'Hasta que elimines tu cuenta. Puedes solicitar la eliminación de tus datos en cualquier momento desde Configuración.' }].map((s, i) => (
          <div key={i} className="mb-4"><p className="font-black text-brand-800 mb-1">{s.t}</p><p className="text-brand-600 text-sm leading-relaxed">{s.c}</p></div>
        ))}
        <h3 className="font-black text-brand-800 mb-3">Mis consentimientos</h3>
        {[{ k: 'datos', label: 'Acepto el tratamiento de mis datos personales para el funcionamiento de la app', req: true },
          { k: 'notifs', label: 'Acepto recibir recordatorios y notificaciones sobre rutinas y citas', req: false },
          { k: 'comms', label: 'Acepto recibir comunicaciones sobre novedades y nuevas guías', req: false }].map(item => (
          <div key={item.k} className="card flex items-start gap-3 mb-2">
            <button onClick={() => setConsent(c => ({ ...c, [item.k]: !c[item.k as keyof typeof c] }))}
              className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${consent[item.k as keyof typeof consent] ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-300'}`}>
              {consent[item.k as keyof typeof consent] && '✓'}
            </button>
            <div><p className="text-brand-700 text-sm">{item.label}</p>{item.req && <p className="text-xs text-brand-400 mt-0.5">Obligatorio</p>}</div>
          </div>
        ))}
        <button className="btn-primary mt-4">Guardar preferencias</button>
      </div>
    </div>
  )
}

function VistaPrivacidad({ onBack }: { onBack: () => void }) {
  return (
    <div className="app-container">
      <div className="page-content">
        <button onClick={onBack} className="text-brand-500 font-bold text-sm mb-4">← Configuración</button>
        <div className="card bg-green-50 border border-green-100 mb-4">
          <p className="text-2xl mb-1">🔒</p>
          <h2 className="text-xl font-black text-green-800 mb-1">Política de privacidad</h2>
          <p className="text-green-500 text-xs">Última actualización: enero 2025</p>
        </div>
        {[{ t: '1. Responsable del tratamiento', c: 'Sonrisas App es responsable del tratamiento de los datos recogidos a través de esta aplicación, de acuerdo con el Reglamento General de Protección de Datos (RGPD).' },
          { t: '2. Datos recogidos', c: 'Recogemos datos de identificación (nombre, email), datos del menor (nombre, fecha de nacimiento, etapa dental) y datos de uso de la app (rutinas completadas, guías leídas).' },
          { t: '3. Finalidad', c: 'Personalizar los contenidos, enviar notificaciones de rutinas y citas, y mejorar el servicio mediante análisis estadístico anónimo.' },
          { t: '4. Seguridad', c: 'Todos los datos se almacenan cifrados. Utilizamos Supabase, que cumple con los estándares de seguridad europeos.' },
          { t: '5. Tus derechos', c: 'Tienes derecho a acceder, rectificar, suprimir y portar tus datos. Puedes ejercer estos derechos contactándonos o desde la configuración de la app.' }].map((s, i) => (
          <div key={i} className="mb-4"><p className="font-black text-brand-800 mb-1">{s.t}</p><p className="text-brand-600 text-sm leading-relaxed">{s.c}</p></div>
        ))}
      </div>
    </div>
  )
}

function VistaTerminos({ onBack }: { onBack: () => void }) {
  const [acepto, setAcepto] = useState(false)
  return (
    <div className="app-container">
      <div className="page-content">
        <button onClick={onBack} className="text-brand-500 font-bold text-sm mb-4">← Configuración</button>
        <div className="card bg-purple-50 border border-purple-100 mb-4">
          <p className="text-2xl mb-1">📄</p>
          <h2 className="text-xl font-black text-purple-800 mb-1">Términos y condiciones</h2>
          <p className="text-purple-500 text-xs">Última actualización: enero 2025</p>
        </div>
        {[{ t: '1. Aceptación', c: 'Al usar Sonrisas App aceptas estos términos. Si no estás de acuerdo, por favor no uses la aplicación.' },
          { t: '2. Uso de la app', c: 'Sonrisas App ofrece información sobre salud bucodental infantil con fines educativos. El contenido no sustituye el diagnóstico ni el tratamiento de un profesional dental.' },
          { t: '3. Cuenta de usuario', c: 'Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades realizadas desde tu cuenta.' },
          { t: '4. Contenido de la comunidad', c: 'Los usuarios son responsables del contenido que publican. Está prohibido publicar contenido ofensivo, falso o inapropiado.' }].map((s, i) => (
          <div key={i} className="mb-4"><p className="font-black text-brand-800 mb-1">{s.t}</p><p className="text-brand-600 text-sm leading-relaxed">{s.c}</p></div>
        ))}
        <div className="card flex items-start gap-3 mb-4">
          <button onClick={() => setAcepto(a => !a)} className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${acepto ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-300'}`}>
            {acepto && '✓'}
          </button>
          <p className="text-brand-700 text-sm">He leído y acepto los términos y condiciones de uso de Sonrisas App</p>
        </div>
        <button disabled={!acepto} className="btn-primary">Confirmar aceptación</button>
      </div>
    </div>
  )
}

// ── Editar Perfil ─────────────────────────────────────────
function VistaEditarPerfil({ onBack, profile, onSave }: any) {
  const [nombre, setNombre] = useState(profile?.nombre_completo || '')
  const [telefono, setTelefono] = useState(profile?.telefono || '')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)

  async function guardar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ nombre_completo: nombre, telefono }).eq('id', user.id)
      onSave({ ...profile, nombre_completo: nombre, telefono })
      setOk(true)
      setTimeout(() => { setOk(false); onBack() }, 1200)
    }
    setLoading(false)
  }

  return (
    <div className="app-container">
      <div className="page-content">
        <button onClick={onBack} className="text-brand-500 font-bold text-sm mb-4 flex items-center gap-1">← Volver</button>
        <div className="card bg-gradient-to-br from-brand-500 to-brand-600 text-white mb-5">
          <h2 className="font-black text-xl">✏️ Editar perfil</h2>
          <p className="text-white/70 text-xs">Actualiza tus datos personales</p>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-brand-700 font-bold text-sm mb-1 block">Nombre completo</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} className="input-field" placeholder="Tu nombre completo" />
          </div>
          <div>
            <label className="text-brand-700 font-bold text-sm mb-1 block">Teléfono</label>
            <input value={telefono} onChange={e => setTelefono(e.target.value)} className="input-field" placeholder="+34 600 000 000" type="tel" />
          </div>
          {ok && <p className="text-green-600 text-center font-bold text-sm bg-green-50 rounded-2xl py-3">✓ ¡Guardado correctamente!</p>}
          <button onClick={guardar} disabled={loading || !nombre.trim()} className="btn-primary mt-2">
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Cambiar Contraseña ────────────────────────────────────
function VistaCambiarPassword({ onBack }: any) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user?.email) setEmail(user.email) })
  }, [])

  async function enviarReset() {
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="app-container">
      <div className="page-content">
        <button onClick={onBack} className="text-brand-500 font-bold text-sm mb-4 flex items-center gap-1">← Volver</button>
        <div className="card bg-gradient-to-br from-brand-500 to-brand-600 text-white mb-5">
          <h2 className="font-black text-xl">🔑 Cambiar contraseña</h2>
          <p className="text-white/70 text-xs">Te enviaremos un enlace a tu email</p>
        </div>
        {!sent ? (
          <div className="flex flex-col gap-4">
            <div className="card bg-brand-50">
              <p className="text-brand-700 font-bold text-sm">📧 Email de tu cuenta</p>
              <p className="text-brand-600 text-sm mt-1">{email}</p>
            </div>
            <p className="text-gray-500 text-sm text-center">Te enviaremos un enlace para restablecer tu contraseña a este email.</p>
            <button onClick={enviarReset} disabled={loading} className="btn-primary">
              {loading ? 'Enviando...' : 'Enviar enlace de restablecimiento'}
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📬</div>
            <h3 className="font-black text-brand-800 text-xl mb-2">¡Email enviado!</h3>
            <p className="text-brand-600 text-sm mb-6">Revisa tu bandeja de entrada en <strong>{email}</strong> y sigue las instrucciones para cambiar tu contraseña.</p>
            <button onClick={onBack} className="btn-secondary">Volver</button>
          </div>
        )}
      </div>
    </div>
  )
}
