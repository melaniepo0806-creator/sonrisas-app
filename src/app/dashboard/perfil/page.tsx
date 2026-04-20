'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAvatars, type AvatarItem } from '@/lib/avatars-hook'
import BottomNav from '@/components/ui/BottomNav'
import Sparkles from '@/components/ui/Sparkles'
import SonrisasLogo from '@/components/ui/SonrisasLogo'

const DIAS = ['L','M','X','J','V','S','D']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const LOGROS_DEF = [
  { tipo: 'primera_semana', nombre: 'Primera semana', icono: '⭐', desc: '7 días completando la rutina', color: 'bg-yellow-100 border-yellow-300' },
  { tipo: 'mes_perfecto',   nombre: 'Mes perfecto',   icono: '💎', desc: '30 días sin fallar',            color: 'bg-blue-100 border-blue-300'   },
  { tipo: 'primera_foto',   nombre: 'Foto Sonrisa',   icono: '📸', desc: 'Subiste tu primera foto',       color: 'bg-pink-100 border-pink-300'   },
  { tipo: 'primer_diente',  nombre: 'Primer diente',  icono: '🦷', desc: 'Registraste el primer diente', color: 'bg-green-100 border-green-300' },
  { tipo: 'primera_cita',   nombre: 'Primera cita',   icono: '📅', desc: 'Agendaste tu primera cita',     color: 'bg-purple-100 border-purple-300' },
  { tipo: 'racha_7',        nombre: 'Racha de fuego', icono: '🔥', desc: '7 días seguidos cepillándose', color: 'bg-orange-100 border-orange-300' },
  { tipo: 'racha_30',       nombre: 'Cepillado perfecto', icono: '🏆', desc: '30 días de racha',          color: 'bg-yellow-100 border-yellow-300' },
  { tipo: 'comunidad',      nombre: 'Miembro del Nido', icono: '🪺', desc: 'Publicaste en la comunidad', color: 'bg-teal-100 border-teal-300'   },
]

// Vista flow: inicio → detalle → config
// inicio = calendar + weekly progress (first view on BottomNav tap)
// detalle = avatar + stats + logros + menu
// config = settings page
type Vista = 'inicio' | 'detalle' | 'logros' | 'config' | 'editar_perfil' | 'cambiar_password' | 'perfiles_hijos' | 'legal_datos' | 'legal_privacidad' | 'legal_terminos'

export default function PerfilPage() {
  const router = useRouter()
  const [vista, setVista] = useState<Vista>('inicio')
  const [profile, setProfile] = useState<{nombre_completo?: string; telefono?: string; avatar_url?: string; username?: string; role?: string; fecha_nacimiento?: string; created_at?: string} | null>(null)
  const [hijo, setHijo] = useState<{nombre?: string; avatar_url?: string; etapa_dental?: string; fecha_nacimiento?: string} | null>(null)
  const [logros, setLogros] = useState<string[]>([])
  const [rutinas, setRutinas] = useState<{fecha: string; completada: boolean}[]>([])
  const [mesActual, setMesActual] = useState(new Date())
  const [progSemana, setProgSemana] = useState<boolean[]>([false,false,false,false,false,false,false])
  const [racha, setRacha] = useState(0)
  const [totalActivos, setTotalActivos] = useState(0)
  // Calendario interactivo: fechas con cita / recuerdo + menú contextual
  const [citasMes, setCitasMes] = useState<{fecha: string; hora?: string; motivo?: string}[]>([])
  const [memoriasMes, setMemoriasMes] = useState<{fecha: string; id: string; titulo?: string; foto_url?: string}[]>([])
  const [menuFecha, setMenuFecha] = useState<string | null>(null)
  const [recuerdoFecha, setRecuerdoFecha] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: hijos } = await supabase.from('hijos').select('*').eq('parent_id', user.id).limit(1)
      if (hijos?.length) setHijo(hijos[0])
      const { data: logrosData } = await supabase.from('logros').select('tipo').eq('parent_id', user.id)
      setLogros(logrosData?.map((l: {tipo: string}) => l.tipo) || [])
      const inicio = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1).toISOString().split('T')[0]
      const fin = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).toISOString().split('T')[0]
      const { data: ruts } = await supabase.from('rutinas').select('fecha, completada').eq('parent_id', user.id).gte('fecha', inicio).lte('fecha', fin)
      setRutinas(ruts || [])

      // Citas dentales del mes
      const { data: citasData } = await supabase
        .from('citas')
        .select('fecha, hora, motivo')
        .eq('parent_id', user.id)
        .gte('fecha', inicio)
        .lte('fecha', fin)
      setCitasMes(citasData || [])

      // Memorias/recuerdos del mes (si la tabla existe)
      const { data: memsData } = await supabase
        .from('memorias')
        .select('id, fecha, titulo, foto_url')
        .eq('parent_id', user.id)
        .gte('fecha', inicio)
        .lte('fecha', fin)
      setMemoriasMes(memsData || [])
      const lunes = new Date(); lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7))
      const { data: semana } = await supabase.from('rutinas').select('fecha, completada').eq('parent_id', user.id).gte('fecha', lunes.toISOString().split('T')[0])
      if (semana) {
        const prog = Array(7).fill(false)
        semana.forEach((r: {fecha: string; completada: boolean}) => { const d = (new Date(r.fecha + 'T12:00:00').getDay() + 6) % 7; prog[d] = r.completada })
        setProgSemana(prog)
      }

      // ── Racha real: días consecutivos completados, de hoy hacia atrás ──
      const { data: todas } = await supabase
        .from('rutinas')
        .select('fecha, completada')
        .eq('parent_id', user.id)
        .eq('completada', true)
        .order('fecha', { ascending: false })
        .limit(400)
      if (todas) {
        setTotalActivos(todas.length)
        const hechos = new Set(todas.map(r => r.fecha))
        const hoy = new Date()
        const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        let count = 0
        // Si hoy no está hecho aún, la racha puede seguir viva si ayer sí → empezamos por ayer
        const cursor = new Date(hoy)
        if (!hechos.has(toISO(cursor))) cursor.setDate(cursor.getDate() - 1)
        while (hechos.has(toISO(cursor))) {
          count++
          cursor.setDate(cursor.getDate() - 1)
        }
        setRacha(count)
      }
    }
    load()
  }, [router, mesActual])

  async function handleLogout() { await supabase.auth.signOut(); router.push('/login') }

  const nombre = profile?.nombre_completo?.split(' ')[0] || 'Usuario'
  const completadasSemana = progSemana.filter(Boolean).length

  // Días activos reales = días desde que se creó la cuenta (min 1) + días con rutina histórica
  // Usamos el máximo entre ambos para reflejar "tiempo usando la app" aunque no haya rutinas.
  const diasActivos = (() => {
    const desdeSignup = profile?.created_at
      ? Math.max(1, Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000) + 1)
      : 0
    return Math.max(desdeSignup, totalActivos)
  })()

  // Edad del padre — se muestra en la tarjeta de stats
  const edadPadre = (() => {
    if (!profile?.fecha_nacimiento) return null
    const nacimiento = new Date(profile.fecha_nacimiento)
    const hoy = new Date()
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const m = hoy.getMonth() - nacimiento.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--
    return edad >= 0 ? `${edad}a` : null
  })()

  const edadHijo = (() => {
    if (!hijo?.fecha_nacimiento) return null
    const nacimiento = new Date(hijo.fecha_nacimiento)
    const hoy = new Date()
    const meses = (hoy.getFullYear() - nacimiento.getFullYear()) * 12 + (hoy.getMonth() - nacimiento.getMonth())
    if (meses < 24) return `${meses}m`
    return `${Math.floor(meses/12)}a`
  })()

  const LOGROS_DISPLAY = [
    { icono: '🔥', nombre: 'Primera semana', sub: '7 días seguidos',  ganado: racha >= 7,  bg: 'bg-orange-50 border-orange-200' },
    { icono: '🪥', nombre: 'Cepillado',      sub: '14 días sin fallar', ganado: racha >= 14, bg: 'bg-blue-50 border-blue-200'   },
    { icono: '🏆', nombre: 'Experto',         sub: '1 mes activo',      ganado: racha >= 30, bg: 'bg-yellow-50 border-yellow-200' },
    { icono: '🦷', nombre: 'Familia Sonrisas',sub: 'Cuenta creada',     ganado: true,              bg: 'bg-green-50 border-green-200'  },
  ]

  // ── Sub-vistas ──────────────────────────────────────────────────────────────
  if (vista === 'logros')           return <VistaLogros onBack={() => setVista('detalle')} logrosGanados={logros} />
  if (vista === 'config')           return <VistaConfig onBack={() => setVista('detalle')} onLogout={handleLogout} onLegal={(v) => setVista(v as Vista)} onEditPerfil={() => setVista('editar_perfil')} onCambiarPassword={() => setVista('cambiar_password')} onPerfilesHijos={() => setVista('perfiles_hijos')} onModoJuego={() => router.push('/dashboard/perfil/juego')} isAdmin={profile?.role === 'admin' || profile?.role === 'super_admin'} onAdmin={() => router.push('/admin')} />
  if (vista === 'editar_perfil')    return <VistaEditarPerfil onBack={() => setVista('config')} profile={profile} hijoActual={hijo} onSave={(p, hijoAvatarUrl) => { setProfile(p); if (hijoAvatarUrl !== undefined) setHijo(h => h ? { ...h, avatar_url: hijoAvatarUrl } : h) }} />
  if (vista === 'cambiar_password') return <VistaCambiarPassword onBack={() => setVista('config')} />
  if (vista === 'perfiles_hijos')   return <VistaPerfilesHijos onBack={() => setVista('config')} onHijoUpdated={(h) => setHijo({ nombre: h.nombre, avatar_url: h.avatar_url ?? undefined, etapa_dental: h.etapa_dental ?? undefined, fecha_nacimiento: h.fecha_nacimiento })} />
  if (vista === 'legal_datos')      return <VistaTratamentoDatos onBack={() => setVista('config')} />
  if (vista === 'legal_privacidad') return <VistaPrivacidad onBack={() => setVista('config')} />
  if (vista === 'legal_terminos')   return <VistaTerminos onBack={() => setVista('config')} />

  // ── Vista detalle (perfil 2): avatar + stats + logros + menu ────────────────
  if (vista === 'detalle') {
    return (
      <div className="app-container">
        <Sparkles />
        <div className="page-content">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setVista('inicio')} className="flex items-center gap-1 text-brand-500 font-bold text-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Perfil
            </button>
            <button onClick={() => setVista('config')} className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">⚙️</button>
          </div>

          {/* Avatar + nombre hijo — tap para ir al perfil de juego */}
          <div className="card mb-4 text-center py-6">
            {(() => {
              const avatar = hijo?.avatar_url || profile?.avatar_url || '👶'
              const isImage = avatar.startsWith('data:') || avatar.startsWith('http')
              return (
                <button
                  onClick={() => router.push('/dashboard/perfil/juego')}
                  aria-label="Abrir perfil de juego"
                  className="relative block mx-auto mb-3 active:scale-95 transition-transform"
                >
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="Avatar" className="w-28 h-28 rounded-full object-cover border-4 border-brand-300 shadow-lg" />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 border-4 border-brand-300 flex items-center justify-center text-6xl shadow-lg">
                      {avatar}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 bg-brand-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                    🎮 Jugar
                  </span>
                </button>
              )
            })()}
            <h2 className="font-black text-2xl text-brand-800">{hijo?.nombre || nombre}</h2>
            {hijo?.etapa_dental && (
              <span className="inline-block bg-brand-100 text-brand-600 text-xs font-bold px-3 py-1 rounded-full mt-1">
                Etapa {hijo.etapa_dental}
              </span>
            )}
            <p className="text-brand-400 text-sm mt-1">@{profile?.username || nombre.toLowerCase()}</p>
          </div>

          {/* Stats */}
          <div className="card mb-4">
            <div className="flex justify-around">
              <div className="text-center">
                <p className="font-black text-2xl text-brand-800">{edadPadre || edadHijo || '--'}</p>
                <p className="text-brand-400 text-xs font-semibold mt-0.5">
                  {edadPadre ? 'Tu edad' : edadHijo ? 'Peque' : 'Edad'}
                </p>
              </div>
              <div className="border-l border-gray-100 text-center px-6">
                <p className="font-black text-2xl text-brand-800">{diasActivos}</p>
                <p className="text-brand-400 text-xs font-semibold mt-0.5">Días activos</p>
              </div>
              <div className="border-l border-gray-100 text-center px-4">
                <p className="font-black text-2xl text-brand-800">🔥{racha}</p>
                <p className="text-brand-400 text-xs font-semibold mt-0.5">Racha</p>
              </div>
            </div>
          </div>

          {/* Esta semana */}
          <div className="card mb-4">
            <h3 className="font-black text-brand-800 mb-3 text-sm">Esta semana</h3>
            <div className="flex justify-between">
              {DIAS.map((d, i) => {
                const hoyIdx = (new Date().getDay() + 6) % 7
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                      ${progSemana[i] ? 'bg-green-500 text-white shadow-sm' : i === hoyIdx ? 'bg-brand-200 text-brand-700' : 'bg-gray-100 text-gray-400'}`}>
                      {progSemana[i] ? '✓' : d}
                    </div>
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
                <div key={i} className={`rounded-2xl p-3 border-2 transition-all ${l.ganado ? l.bg : 'bg-gray-50 border-gray-200 opacity-50'}`}>
                  <p className="text-3xl mb-2">{l.icono}</p>
                  <p className="font-black text-brand-800 text-xs leading-tight">{l.nombre}</p>
                  <p className="text-brand-400 text-[10px] mt-0.5">{l.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Álbum de recuerdos — acceso destacado */}
          <button onClick={() => router.push('/dashboard/album')}
            className="card w-full flex items-center gap-3 mb-3 bg-gradient-to-br from-pink-100 via-white to-brand-50 border border-pink-100 active:scale-95 transition-all text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-brand-500 flex items-center justify-center text-2xl shadow-sm">📖</div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-brand-800 text-sm">Álbum de recuerdos</p>
              <p className="text-brand-500 text-xs">{memoriasMes.length > 0 ? `${memoriasMes.length} recuerdos este mes` : 'Guarda tus momentos favoritos'}</p>
            </div>
            <span className="text-pink-400 font-black">›</span>
          </button>

          {/* Menú */}
          <div className="flex flex-col gap-2 mb-6">
            {[
              { icono: '⚙️', label: 'Configuración',       action: () => setVista('config') },
              { icono: '🔔', label: 'Notificaciones',       action: () => router.push('/notificaciones') },
              { icono: '📋', label: 'Historial de rutinas', action: () => setVista('inicio') },
            ].map((item, i) => (
              <button key={i} onClick={item.action}
                className="card w-full flex items-center justify-between active:scale-95 transition-all text-left py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icono}</span>
                  <p className="font-bold text-brand-800">{item.label}</p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#3B9DC8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  // ── Vista inicio (perfil 1): calendario + progreso semanal ──────────────────
  const diasEnMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).getDate()
  const primerDia = (new Date(mesActual.getFullYear(), mesActual.getMonth(), 1).getDay() + 6) % 7
  const rutinasMap: Record<string, boolean> = {}
  rutinas.forEach(r => { rutinasMap[r.fecha.split('T')[0]] = r.completada })
  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div className="app-container">
      <Sparkles />
      <div className="page-content">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <SonrisasLogo size={34} />
            <div>
              <h1 className="text-xl font-black text-brand-800 leading-tight">Mi Perfil</h1>
              <p className="text-brand-400 text-xs font-semibold">@{profile?.username || nombre.toLowerCase()}</p>
            </div>
          </div>
          <button onClick={() => setVista('config')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">⚙️</button>
        </div>

        {/* Mini perfil card — tap en la foto abre perfil de juego */}
        <div className="card bg-gradient-to-br from-brand-500 to-brand-700 text-white mb-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/perfil/juego')}
            aria-label="Abrir perfil de juego"
            className="relative w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden active:scale-95 transition-transform"
          >
            {hijo?.avatar_url && (hijo.avatar_url.startsWith('http') || hijo.avatar_url.startsWith('data:'))
              ? <img src={hijo.avatar_url} alt={hijo.nombre || 'hijo'} className="w-full h-full object-cover" />
              : (hijo?.avatar_url || '👶')}
            <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-brand-800 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-white">
              🎮
            </span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-black text-lg truncate">{hijo?.nombre || nombre}</p>
            <p className="text-white/70 text-xs">{hijo?.etapa_dental ? `Etapa ${hijo.etapa_dental}` : 'Sonrisas App'}</p>
            <div className="flex gap-3 mt-2">
              <span className="text-white/80 text-xs">🔥 Racha de {racha} {racha === 1 ? 'día' : 'días'}</span>
              <span className="text-white/80 text-xs">📅 {diasActivos} en total</span>
            </div>
          </div>
          <button onClick={() => setVista('detalle')}
            className="bg-white/20 border border-white/30 text-white text-xs font-black px-3 py-2 rounded-xl flex-shrink-0">
            Ver →
          </button>
        </div>

        {/* Progreso esta semana */}
        <div className="card mb-4">
          <h3 className="font-black text-brand-800 mb-3">Esta semana</h3>
          <div className="flex justify-between mb-3">
            {DIAS.map((d, i) => {
              const hoyIdx = (new Date().getDay() + 6) % 7
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                    ${progSemana[i] ? 'bg-green-500 text-white' : i === hoyIdx ? 'bg-brand-200 text-brand-700' : 'bg-gray-100 text-gray-400'}`}>
                    {progSemana[i] ? '✓' : d}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="h-2 bg-brand-100 rounded-full">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(completadasSemana/7)*100}%` }} />
          </div>
          <p className="text-brand-400 text-xs mt-2 text-center font-semibold">{completadasSemana} de 7 días completados</p>
        </div>

        {/* Calendario */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth()-1))} className="text-brand-500 font-bold text-2xl w-8 h-8 flex items-center justify-center">‹</button>
            <p className="font-black text-brand-800">{MESES[mesActual.getMonth()]} {mesActual.getFullYear()}</p>
            <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth()+1))} className="text-brand-500 font-bold text-2xl w-8 h-8 flex items-center justify-center">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DIAS.map(d => <p key={d} className="text-center text-xs text-brand-400 font-bold">{d}</p>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array(primerDia).fill(null).map((_, i) => <div key={`e${i}`} />)}
            {Array(diasEnMes).fill(null).map((_, i) => {
              const fecha = `${mesActual.getFullYear()}-${String(mesActual.getMonth()+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`
              const completada = rutinasMap[fecha]
              const esHoy = fecha === hoy
              const futuro = fecha > hoy
              const tieneCita = citasMes.some(c => c.fecha === fecha)
              const tieneRecuerdo = memoriasMes.some(m => m.fecha === fecha)
              return (
                <button
                  key={i}
                  onClick={() => setMenuFecha(fecha)}
                  className={`relative aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all active:scale-95
                    ${completada ? 'bg-green-500 text-white' : esHoy ? 'bg-brand-400 text-white' : futuro ? 'bg-gray-50 text-gray-400 hover:bg-brand-50' : 'bg-red-100 text-red-400 hover:bg-red-200'}`}>
                  {completada ? '✓' : i+1}
                  {(tieneCita || tieneRecuerdo) && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {tieneCita && <span className="block w-1 h-1 rounded-full bg-purple-500" />}
                      {tieneRecuerdo && <span className="block w-1 h-1 rounded-full bg-pink-500" />}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="flex gap-3 mt-3 justify-center text-xs flex-wrap">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-gray-500">Completado</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-gray-500">Cita</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pink-500" /><span className="text-gray-500">Recuerdo</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gray-100" /><span className="text-gray-500">Futuro</span></div>
          </div>
        </div>

        {/* Bottom sheet: menú al tocar fecha */}
        {menuFecha && (
          <MenuFecha
            fecha={menuFecha}
            citas={citasMes.filter(c => c.fecha === menuFecha)}
            memorias={memoriasMes.filter(m => m.fecha === menuFecha)}
            onClose={() => setMenuFecha(null)}
            onAgendarCita={() => { router.push(`/agendar-cita?fecha=${menuFecha}`) }}
            onAddRecuerdo={() => { setRecuerdoFecha(menuFecha); setMenuFecha(null) }}
            onVerAlbum={() => { router.push('/dashboard/album') }}
          />
        )}

        {/* Modal: añadir recuerdo con foto + nota */}
        {recuerdoFecha && (
          <AgregarRecuerdo
            fecha={recuerdoFecha}
            onClose={() => setRecuerdoFecha(null)}
            onSaved={(mem) => {
              setMemoriasMes(prev => [...prev, mem])
              setRecuerdoFecha(null)
            }}
          />
        )}

        {/* Estadísticas del mes */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="card text-center py-4">
            <p className="text-2xl font-black text-green-500">{diasActivos}</p>
            <p className="text-brand-400 text-xs mt-0.5">Completados</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-black text-brand-800">{completadasSemana}</p>
            <p className="text-brand-400 text-xs mt-0.5">Esta semana</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-black text-orange-500">🔥{racha}</p>
            <p className="text-brand-400 text-xs mt-0.5">Racha</p>
          </div>
        </div>

        {/* CTA Ver perfil */}
        <button onClick={() => setVista('detalle')}
          className="w-full bg-brand-500 text-white font-black py-4 rounded-2xl text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mb-6">
          Ver mi perfil completo →
        </button>

      </div>
      <BottomNav />
    </div>
  )
}

// ── Logros ───────────────────────────────────────────────────────────────────
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

// ── Configuración ────────────────────────────────────────────────────────────
function VistaConfig({ onBack, onLogout, onLegal, onEditPerfil, onCambiarPassword, onPerfilesHijos, onModoJuego, isAdmin, onAdmin }: {
  onBack: () => void; onLogout: () => void; onLegal: (v: string) => void; onEditPerfil: () => void; onCambiarPassword: () => void; onPerfilesHijos: () => void; onModoJuego: () => void; isAdmin: boolean; onAdmin: () => void
}) {
  const [notifs, setNotifs] = useState({ cepillado: true, cita: true, comunidad: false })
  return (
    <div className="app-container">
      <div className="page-content">
        <button onClick={onBack} className="text-brand-500 font-bold text-sm mb-4 flex items-center gap-1">← Volver</button>
        <div className="card bg-gradient-to-br from-brand-500 to-brand-600 text-white mb-5 py-3">
          <h2 className="font-black text-xl">⚙️ Configuración</h2>
          <p className="text-white/70 text-xs">Gestiona tu cuenta y preferencias</p>
        </div>

        {isAdmin && (
          <>
            <p className="text-brand-400 text-xs font-bold uppercase tracking-wide ml-1 mb-2">Administración</p>
            <button onClick={onAdmin}
              className="card w-full flex items-center gap-3 mb-4 active:scale-95 transition-all text-left bg-gradient-to-r from-purple-500 to-brand-500 text-white">
              <span className="text-2xl">🛠️</span>
              <div className="flex-1">
                <p className="font-black text-sm">Panel de admin</p>
                <p className="text-white/80 text-xs">Artículos, usuarios, comunidad, visual</p>
              </div>
              <span className="text-white">›</span>
            </button>
          </>
        )}

        <p className="text-brand-400 text-xs font-bold uppercase tracking-wide ml-1 mb-2">Mi cuenta</p>
        {[
          { label: 'Editar perfil',       sub: 'Nombre, teléfono, usuario',  icono: '✏️', action: onEditPerfil },
          { label: 'Cambiar contraseña',  sub: 'Seguridad de tu cuenta',     icono: '🔑', action: onCambiarPassword },
          { label: 'Perfiles de hijos',   sub: 'Gestionar hijos registrados',icono: '👶', action: onPerfilesHijos },
          { label: 'Modo juego (beta)',   sub: 'Perfil gamificado de prueba', icono: '🎮', action: onModoJuego },
        ].map((item, i) => (
          <button key={i} onClick={item.action} className="card w-full flex items-center gap-3 mb-2 active:scale-95 transition-all text-left">
            <span className="text-xl">{item.icono}</span>
            <div className="flex-1"><p className="font-black text-brand-800 text-sm">{item.label}</p><p className="text-brand-400 text-xs">{item.sub}</p></div>
            <span className="text-brand-400">›</span>
          </button>
        ))}

        <p className="text-brand-400 text-xs font-bold uppercase tracking-wide ml-1 mb-2 mt-4">Notificaciones</p>
        {[
          { key: 'cepillado', label: '🪥 Recordatorio cepillado' },
          { key: 'cita',      label: '📅 Cita dental'           },
          { key: 'comunidad', label: '👥 Comunidad'             },
        ].map(item => (
          <div key={item.key} className="card flex items-center justify-between mb-2">
            <p className="font-bold text-brand-800 text-sm">{item.label}</p>
            <button onClick={() => setNotifs(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
              className={`w-12 h-6 rounded-full transition-all relative ${notifs[item.key as keyof typeof notifs] ? 'bg-brand-500' : 'bg-gray-200'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${notifs[item.key as keyof typeof notifs] ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>
        ))}

        <p className="text-brand-400 text-xs font-bold uppercase tracking-wide ml-1 mb-2 mt-4">Legal y privacidad</p>
        {[
          { label: '🔐 Tratamiento de datos',   action: () => onLegal('legal_datos')       },
          { label: '📋 Política de privacidad', action: () => onLegal('legal_privacidad')  },
          { label: '📄 Términos y condiciones', action: () => onLegal('legal_terminos')    },
        ].map((item, i) => (
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

// ── Legal pages ──────────────────────────────────────────────────────────────
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
        {[
          { t: '¿Qué datos recogemos?',        c: 'Recogemos el nombre, fecha de nacimiento y etapa dental de tu hijo para personalizar los contenidos. También guardamos tu correo electrónico y contraseña para gestionar tu cuenta.' },
          { t: '¿Para qué los usamos?',        c: 'Los datos se usan exclusivamente para ofrecerte guías adaptadas a la edad de tu hijo, enviarte recordatorios de rutinas y citas, y mejorar la experiencia de la app.' },
          { t: '¿Con quién los compartimos?',  c: 'Solo compartimos datos con proveedores técnicos necesarios para el funcionamiento del servicio. Nunca vendemos tus datos a terceros.' },
          { t: '¿Cuánto tiempo los guardamos?',c: 'Hasta que elimines tu cuenta. Puedes solicitar la eliminación de tus datos en cualquier momento desde Configuración.' },
        ].map((s, i) => (
          <div key={i} className="mb-4"><p className="font-black text-brand-800 mb-1">{s.t}</p><p className="text-brand-600 text-sm leading-relaxed">{s.c}</p></div>
        ))}
        <h3 className="font-black text-brand-800 mb-3">Mis consentimientos</h3>
        {[
          { k: 'datos',  label: 'Acepto el tratamiento de mis datos personales para el funcionamiento de la app', req: true  },
          { k: 'notifs', label: 'Acepto recibir recordatorios y notificaciones sobre rutinas y citas',            req: false },
          { k: 'comms',  label: 'Acepto recibir comunicaciones sobre novedades y nuevas guías',                   req: false },
        ].map(item => (
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
        {[
          { t: '1. Responsable del tratamiento', c: 'Sonrisas App es responsable del tratamiento de los datos recogidos a través de esta aplicación, de acuerdo con el Reglamento General de Protección de Datos (RGPD).' },
          { t: '2. Datos recogidos',             c: 'Recogemos datos de identificación (nombre, email), datos del menor (nombre, fecha de nacimiento, etapa dental) y datos de uso de la app (rutinas completadas, guías leídas).' },
          { t: '3. Finalidad',                   c: 'Personalizar los contenidos, enviar notificaciones de rutinas y citas, y mejorar el servicio mediante análisis estadístico anónimo.' },
          { t: '4. Seguridad',                   c: 'Todos los datos se almacenan cifrados. Utilizamos Supabase, que cumple con los estándares de seguridad europeos.' },
          { t: '5. Tus derechos',                c: 'Tienes derecho a acceder, rectificar, suprimir y portar tus datos. Puedes ejercer estos derechos contactándonos o desde la configuración de la app.' },
        ].map((s, i) => (
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
        {[
          { t: '1. Aceptación',            c: 'Al usar Sonrisas App aceptas estos términos. Si no estás de acuerdo, por favor no uses la aplicación.' },
          { t: '2. Uso de la app',         c: 'Sonrisas App ofrece información sobre salud bucodental infantil con fines educativos. El contenido no sustituye el diagnóstico ni el tratamiento de un profesional dental.' },
          { t: '3. Cuenta de usuario',     c: 'Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades realizadas desde tu cuenta.' },
          { t: '4. Contenido comunidad',   c: 'Los usuarios son responsables del contenido que publican. Está prohibido publicar contenido ofensivo, falso o inapropiado.' },
        ].map((s, i) => (
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

// ── Editar Perfil ─────────────────────────────────────────────────────────────
function VistaEditarPerfil({ onBack, profile, hijoActual, onSave }: {
  onBack: () => void
  profile: {nombre_completo?: string; telefono?: string; avatar_url?: string; username?: string; fecha_nacimiento?: string; created_at?: string} | null
  hijoActual: {nombre?: string; avatar_url?: string; etapa_dental?: string; fecha_nacimiento?: string} | null
  onSave: (p: typeof profile, hijoAvatarUrl?: string) => void
}) {
  const [nombre, setNombre] = useState(profile?.nombre_completo || '')
  const [telefono, setTelefono] = useState(profile?.telefono || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [fechaNacimiento, setFechaNacimiento] = useState(profile?.fecha_nacimiento || '')
  const [avatarPadre, setAvatarPadre] = useState<string | null>(profile?.avatar_url || null)
  const [avatarHijo, setAvatarHijo] = useState<string | null>(hijoActual?.avatar_url || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  const avatarsPadres   = useAvatars('padres')
  const avatarsNinos    = useAvatars('ninos')
  const avatarsNinas    = useAvatars('ninas')
  const avatarsBebes    = useAvatars('bebes')
  const avatarsMascotas = useAvatars('mascotas')
  // Para el avatar del hijo unimos niños/niñas/bebés
  const avatarsHijoCombo: AvatarItem[] = [...avatarsNinos, ...avatarsNinas, ...avatarsBebes]

  function handleFotoUpload(target: 'padre' | 'hijo') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (file.size > 2 * 1024 * 1024) { setError('La foto no puede superar 2MB'); return }
      const reader = new FileReader()
      reader.onload = ev => {
        const result = ev.target?.result as string
        if (target === 'padre') setAvatarPadre(result)
        else setAvatarHijo(result)
      }
      reader.readAsDataURL(file)
    }
  }

  async function guardar() {
    setError('')
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check username uniqueness (excluding current user)
      if (username && username !== profile?.username) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .neq('id', user.id)
          .maybeSingle()
        if (existing) {
          setError('Este nombre de usuario ya está en uso. Por favor elige otro.')
          setLoading(false)
          return
        }
      }

      // Guardar perfil del padre (avatar propio + fecha_nacimiento)
      const { error: profileErr } = await supabase.from('profiles').update({
        nombre_completo: nombre,
        telefono,
        username: username || null,
        fecha_nacimiento: fechaNacimiento || null,
        ...(avatarPadre ? { avatar_url: avatarPadre } : {}),
      }).eq('id', user.id)
      if (profileErr) throw profileErr

      // Avatar del hijo — sólo si existe el hijo y hay valor
      let hijoAvatarGuardado: string | undefined
      if (avatarHijo) {
        const { data: hijos } = await supabase
          .from('hijos')
          .select('id')
          .eq('parent_id', user.id)
          .limit(1)
        if (hijos && hijos.length > 0) {
          const { error: hijoErr } = await supabase
            .from('hijos')
            .update({ avatar_url: avatarHijo })
            .eq('id', hijos[0].id)
          if (hijoErr) throw hijoErr
          hijoAvatarGuardado = avatarHijo
        }
      }

      onSave({
        ...profile,
        nombre_completo: nombre,
        telefono,
        username,
        fecha_nacimiento: fechaNacimiento || undefined,
        avatar_url: avatarPadre ?? profile?.avatar_url,
      }, hijoAvatarGuardado)
      setOk(true)
      setTimeout(() => { setOk(false); onBack() }, 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const renderAvatarPicker = (
    target: 'padre' | 'hijo',
    value: string | null,
    setValue: (v: string | null) => void,
    items: AvatarItem[],
    itemsExtra?: { label: string; items: AvatarItem[] },
  ) => {
    const isPhoto = value?.startsWith('data:') || value?.startsWith('http')
    const display = value || (target === 'padre' ? '👤' : '👶')
    return (
      <>
        <div className="flex items-center gap-3 mb-4 p-3 bg-brand-50 rounded-2xl">
          {isPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={display} alt="Avatar" className="w-14 h-14 rounded-full object-cover border-2 border-brand-300" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 border-2 border-brand-300 flex items-center justify-center text-3xl">
              {display}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-brand-700 text-sm">Avatar actual</p>
            <p className="text-brand-400 text-xs">Elige una foto o un emoji</p>
          </div>
          {value && (
            <button onClick={() => setValue(null)} className="text-red-400 text-xs font-bold">Quitar</button>
          )}
        </div>

        <div className="mb-3">
          <p className="text-brand-400 text-xs mb-2 font-semibold uppercase tracking-wide">📷 Subir foto</p>
          <label className="flex items-center gap-3 cursor-pointer bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-3 hover:border-brand-300 transition-all">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-xl">📁</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-brand-700 text-sm">Seleccionar foto</p>
              <p className="text-brand-400 text-xs">JPG, PNG · máx. 2MB</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleFotoUpload(target)} />
          </label>
        </div>

        <div className="mb-2">
          <p className="text-brand-400 text-xs mb-2 font-semibold uppercase tracking-wide">😊 O elige un emoji</p>
          <div className="flex flex-wrap gap-2">
            {items.map(a => (
              <button key={a.id} onClick={() => setValue(a.value)}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-2xl transition-all overflow-hidden
                  ${value === a.value ? 'ring-4 ring-brand-500 scale-110 bg-brand-50' : 'bg-gray-50'}`}>
                {a.value_type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.value} alt={a.label} className="w-full h-full object-cover" />
                ) : (
                  a.value
                )}
              </button>
            ))}
          </div>
        </div>
        {itemsExtra && itemsExtra.items.length > 0 && (
          <div>
            <p className="text-brand-500 text-xs mb-2 font-semibold">{itemsExtra.label}</p>
            <div className="flex flex-wrap gap-2">
              {itemsExtra.items.map(a => (
                <button key={a.id} onClick={() => setValue(a.value)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-2xl transition-all overflow-hidden
                    ${value === a.value ? 'ring-4 ring-brand-500 scale-110 bg-brand-50' : 'bg-gray-50'}`}>
                  {a.value_type === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.value} alt={a.label} className="w-full h-full object-cover" />
                  ) : (
                    a.value
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="app-container">
      <div className="page-content">
        <button onClick={onBack} className="flex items-center gap-1 text-brand-500 font-bold text-sm mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Volver
        </button>
        <h2 className="text-2xl font-black text-brand-800 mb-5">Editar perfil</h2>

        <div className="flex flex-col gap-4">
          {/* Datos del padre */}
          <div className="card">
            <p className="text-brand-700 font-bold text-sm mb-3">👤 Tus datos</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-brand-600 font-semibold text-xs mb-1 block">Nombre completo *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} className="input-field" placeholder="Tu nombre completo" />
              </div>
              <div>
                <label className="text-brand-600 font-semibold text-xs mb-1 block">Nombre de usuario</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                  <input value={username} onChange={e => setUsername(e.target.value.replace(/\s/g,'').toLowerCase())} className="input-field pl-8" placeholder="tu_usuario" />
                </div>
                <p className="text-brand-300 text-xs ml-1 mt-1">Visible en la comunidad</p>
              </div>
              <div>
                <label className="text-brand-600 font-semibold text-xs mb-1 block">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={e => setFechaNacimiento(e.target.value)}
                  className="input-field"
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-brand-300 text-xs ml-1 mt-1">Sólo se usa para mostrar tu edad en el perfil</p>
              </div>
              <div>
                <label className="text-brand-600 font-semibold text-xs mb-1 block">Teléfono</label>
                <input value={telefono} onChange={e => setTelefono(e.target.value)} className="input-field" placeholder="+34 600 000 000" type="tel" />
              </div>
            </div>
          </div>

          {/* Avatar del padre */}
          <div className="card">
            <p className="text-brand-700 font-bold text-sm mb-3">🧑 Tu avatar</p>
            {renderAvatarPicker('padre', avatarPadre, setAvatarPadre, avatarsPadres)}
          </div>

          {/* Avatar del hijo */}
          <div className="card">
            <p className="text-brand-700 font-bold text-sm mb-3">👶 Avatar de tu peque</p>
            {!hijoActual ? (
              <p className="text-brand-400 text-xs bg-brand-50 rounded-xl p-3">
                Aún no has registrado a tu peque. Podrás añadir su avatar cuando lo registres.
              </p>
            ) : (
              renderAvatarPicker('hijo', avatarHijo, setAvatarHijo, avatarsHijoCombo, { label: 'Mascotas', items: avatarsMascotas })
            )}
          </div>

          {error && <p className="text-red-500 text-center font-bold text-sm bg-red-50 rounded-2xl py-3">{error}</p>}
          {ok && <p className="text-green-600 text-center font-bold text-sm bg-green-50 rounded-2xl py-3">✓ ¡Guardado correctamente!</p>}
          <button onClick={guardar} disabled={loading || !nombre.trim()} className="btn-primary">
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Menú contextual al tocar una fecha del calendario ────────────────────────
function MenuFecha({ fecha, citas, memorias, onClose, onAgendarCita, onAddRecuerdo, onVerAlbum }: {
  fecha: string
  citas: {fecha: string; hora?: string; motivo?: string}[]
  memorias: {fecha: string; id: string; titulo?: string; foto_url?: string}[]
  onClose: () => void
  onAgendarCita: () => void
  onAddRecuerdo: () => void
  onVerAlbum: () => void
}) {
  const [y, m, d] = fecha.split('-').map(Number)
  const fechaObj = new Date(y, m - 1, d)
  const label = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* sheet */}
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-28 sm:pb-8 shadow-2xl animate-slide-up">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden" />
        <h3 className="font-black text-brand-800 text-lg capitalize">{label}</h3>
        <p className="text-brand-400 text-xs mb-4">¿Qué quieres hacer en este día?</p>

        {/* Existing items */}
        {(citas.length > 0 || memorias.length > 0) && (
          <div className="mb-4 space-y-2">
            {citas.map((c, i) => (
              <div key={`c-${i}`} className="flex items-center gap-3 bg-purple-50 rounded-2xl p-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">📅</div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-purple-800 text-sm truncate">Cita · {c.motivo || 'Revisión'}</p>
                  <p className="text-purple-500 text-xs">{c.hora || '—'}</p>
                </div>
              </div>
            ))}
            {memorias.map(m => (
              <div key={m.id} className="flex items-center gap-3 bg-pink-50 rounded-2xl p-3">
                {m.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.foto_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-xl">📸</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-pink-800 text-sm truncate">{m.titulo || 'Recuerdo'}</p>
                  <p className="text-pink-500 text-xs">Guardado en tu álbum</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button onClick={onAgendarCita} className="w-full flex items-center gap-3 bg-brand-50 hover:bg-brand-100 transition-colors rounded-2xl p-3.5 text-left">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-xl">📅</div>
            <div className="flex-1">
              <p className="font-black text-brand-800 text-sm">Añadir recordatorio de cita</p>
              <p className="text-brand-500 text-xs">Revisión, limpieza o urgencia</p>
            </div>
            <span className="text-brand-400">›</span>
          </button>
          <button onClick={onAddRecuerdo} className="w-full flex items-center gap-3 bg-pink-50 hover:bg-pink-100 transition-colors rounded-2xl p-3.5 text-left">
            <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center text-xl">📸</div>
            <div className="flex-1">
              <p className="font-black text-pink-800 text-sm">Añadir un recuerdo</p>
              <p className="text-pink-500 text-xs">Foto + nota para tu álbum virtual</p>
            </div>
            <span className="text-pink-400">›</span>
          </button>
          {memorias.length > 0 && (
            <button onClick={onVerAlbum} className="w-full flex items-center gap-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-2xl p-3 text-left">
              <div className="w-9 h-9 bg-gray-200 rounded-xl flex items-center justify-center text-lg">📖</div>
              <p className="flex-1 font-bold text-gray-700 text-sm">Ver álbum de recuerdos</p>
              <span className="text-gray-400">›</span>
            </button>
          )}
          <button onClick={onClose} className="w-full py-3 text-gray-400 font-bold text-sm">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: añadir recuerdo (foto + nota) ─────────────────────────────────────
function AgregarRecuerdo({ fecha, onClose, onSaved }: {
  fecha: string
  onClose: () => void
  onSaved: (mem: {fecha: string; id: string; titulo?: string; foto_url?: string}) => void
}) {
  const [titulo, setTitulo] = useState('')
  const [nota, setNota] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { setError('La foto no puede superar 3MB'); return }
    const reader = new FileReader()
    reader.onload = ev => setFoto(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function guardar() {
    setError('')
    if (!titulo.trim() && !nota.trim() && !foto) {
      setError('Añade al menos un título, nota o foto')
      return
    }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      const { data: hijos } = await supabase.from('hijos').select('id').eq('parent_id', user.id).limit(1)
      const hijoId = hijos?.[0]?.id ?? null
      const { data: nueva, error: insErr } = await supabase.from('memorias').insert({
        parent_id: user.id,
        hijo_id: hijoId,
        fecha,
        titulo: titulo || null,
        nota: nota || null,
        foto_url: foto || null,
      }).select('id, fecha, titulo, foto_url').single()
      if (insErr) throw insErr
      if (nueva) {
        onSaved({
          id: nueva.id,
          fecha: nueva.fecha,
          titulo: nueva.titulo ?? undefined,
          foto_url: nueva.foto_url ?? undefined,
        })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const [y, m, d] = fecha.split('-').map(Number)
  const label = new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-28 sm:pb-8 shadow-2xl max-h-[90dvh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden" />
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-pink-700 text-lg">📸 Nuevo recuerdo</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">×</button>
        </div>
        <p className="text-pink-400 text-xs mb-4 capitalize">{label}</p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-brand-600 font-semibold text-xs mb-1 block">Título</label>
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className="input-field"
              placeholder="Ej: El primer diente"
              maxLength={80}
            />
          </div>

          <div>
            <label className="text-brand-600 font-semibold text-xs mb-1 block">Nota</label>
            <textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              rows={3}
              className="input-field resize-none"
              placeholder="Cuenta este momento especial…"
              maxLength={500}
            />
          </div>

          <div>
            <label className="text-brand-600 font-semibold text-xs mb-1 block">Foto</label>
            {foto ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto} alt="Preview" className="w-full h-48 object-cover rounded-2xl" />
                <button onClick={() => setFoto(null)} className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold rounded-full px-3 py-1">
                  ✕ Quitar
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-3 cursor-pointer bg-pink-50 border-2 border-dashed border-pink-200 rounded-2xl p-3 hover:border-pink-400 transition-all">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-xl">📷</div>
                <div>
                  <p className="font-bold text-pink-700 text-sm">Subir foto</p>
                  <p className="text-pink-400 text-xs">JPG, PNG · máx. 3MB</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleFoto} />
              </label>
            )}
          </div>

          {error && <p className="text-red-500 text-center font-bold text-sm bg-red-50 rounded-2xl py-2">{error}</p>}

          <button onClick={guardar} disabled={saving} className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-black py-3.5 rounded-2xl active:scale-95 transition-all">
            {saving ? 'Guardando…' : 'Guardar recuerdo'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Cambiar Contraseña ─────────────────────────────────────────────────────────
function VistaCambiarPassword({ onBack }: { onBack: () => void }) {
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
            <p className="text-brand-600 text-sm mb-6">Revisa tu bandeja de entrada en <strong>{email}</strong> y sigue las instrucciones.</p>
            <button onClick={onBack} className="btn-secondary">Volver</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Perfiles de hijos ─────────────────────────────────────────────────────────
type HijoRow = {
  id: string
  nombre: string
  fecha_nacimiento: string
  genero?: string | null
  etapa_dental?: string | null
  avatar_url?: string | null
}

function calcularEtapaDental(fechaNacimiento: string): string {
  const n = new Date(fechaNacimiento), h = new Date()
  const meses = (h.getFullYear() - n.getFullYear()) * 12 + (h.getMonth() - n.getMonth())
  if (meses < 6)  return '0-6m'
  if (meses < 12) return '6-12m'
  if (meses < 24) return '1-2a'
  if (meses < 72) return '2-6a'
  return '6-12a'
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

function VistaPerfilesHijos({ onBack, onHijoUpdated }: {
  onBack: () => void
  onHijoUpdated: (h: HijoRow) => void
}) {
  const [hijos, setHijos] = useState<HijoRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState<HijoRow | null>(null)
  const [creando, setCreando] = useState(false)

  async function cargar() {
    setCargando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('hijos')
      .select('id, nombre, fecha_nacimiento, genero, etapa_dental, avatar_url')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: true })
    setHijos((data || []) as HijoRow[])
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  if (editando || creando) {
    return (
      <FormHijo
        hijo={editando}
        onCancel={() => { setEditando(null); setCreando(false) }}
        onSaved={(h) => {
          setEditando(null)
          setCreando(false)
          cargar()
          // Notifica al padre para que la vista detalle refleje el cambio si es el hijo actual
          if (h) onHijoUpdated(h)
        }}
        onDeleted={() => {
          setEditando(null)
          cargar()
        }}
      />
    )
  }

  return (
    <div className="app-container">
      <div className="page-content">
        <button onClick={onBack} className="text-brand-500 font-bold text-sm mb-4 flex items-center gap-1">← Volver</button>

        <div className="card bg-gradient-to-br from-brand-500 to-brand-600 text-white mb-5 py-3">
          <h2 className="font-black text-xl">👶 Perfiles de hijos</h2>
          <p className="text-white/70 text-xs">Gestiona los hijos registrados en tu cuenta</p>
        </div>

        {cargando ? (
          <p className="text-brand-500 text-center py-8">Cargando...</p>
        ) : hijos.length === 0 ? (
          <div className="card text-center py-8">
            <div className="text-5xl mb-3">👶</div>
            <p className="font-black text-brand-800">Aún no tienes hijos registrados</p>
            <p className="text-brand-500 text-sm mt-1 mb-4">Agrega uno para personalizar consejos y guías</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-5">
            {hijos.map(h => {
              const isImg = !!h.avatar_url && (h.avatar_url.startsWith('http') || h.avatar_url.startsWith('data:'))
              const edad = edadHijo(h.fecha_nacimiento)
              return (
                <button key={h.id} onClick={() => setEditando(h)}
                  className="card w-full flex items-center gap-3 active:scale-95 transition-all text-left">
                  <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-3xl overflow-hidden flex-shrink-0">
                    {isImg
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={h.avatar_url!} alt={h.nombre} className="w-full h-full object-cover" />
                      : (h.avatar_url || '👶')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-brand-800 truncate">{h.nombre}</p>
                    <div className="flex gap-1.5 flex-wrap mt-0.5">
                      {edad && <span className="bg-brand-50 text-brand-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{edad}</span>}
                      {h.etapa_dental && <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Etapa {h.etapa_dental}</span>}
                    </div>
                  </div>
                  <span className="text-brand-400">›</span>
                </button>
              )
            })}
          </div>
        )}

        <button onClick={() => setCreando(true)}
          className="w-full btn-primary flex items-center justify-center gap-2">
          <span>➕</span> Agregar otro hijo
        </button>
      </div>
      <BottomNav />
    </div>
  )
}

function FormHijo({ hijo, onCancel, onSaved, onDeleted }: {
  hijo: HijoRow | null
  onCancel: () => void
  onSaved: (h: HijoRow | null) => void
  onDeleted: () => void
}) {
  const esEdicion = !!hijo
  const [nombre, setNombre] = useState(hijo?.nombre || '')
  const [nacimiento, setNacimiento] = useState(hijo?.fecha_nacimiento || '')
  const [genero, setGenero] = useState<string>(hijo?.genero || 'niña')
  const [avatar, setAvatar] = useState<string | null>(hijo?.avatar_url || null)
  const [loading, setLoading] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)

  const avatarsNinos = useAvatars('ninos')
  const avatarsNinas = useAvatars('ninas')
  const avatarsBebes = useAvatars('bebes')
  const avatarsCombo: AvatarItem[] = [...avatarsNinos, ...avatarsNinas, ...avatarsBebes]

  const edadPreview = nacimiento ? edadHijo(nacimiento) : null
  const etapaPreview = nacimiento ? calcularEtapaDental(nacimiento) : null
  const isImg = !!avatar && (avatar.startsWith('http') || avatar.startsWith('data:'))

  async function guardar() {
    setError('')
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!nacimiento) { setError('La fecha de nacimiento es obligatoria'); return }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const etapa_dental = calcularEtapaDental(nacimiento)
      const payload = {
        nombre: nombre.trim(),
        fecha_nacimiento: nacimiento,
        genero,
        etapa_dental,
        ...(avatar ? { avatar_url: avatar } : {}),
      }
      if (esEdicion && hijo) {
        const { data, error: err } = await supabase.from('hijos').update(payload).eq('id', hijo.id).select().maybeSingle()
        if (err) throw err
        onSaved(data as HijoRow)
      } else {
        const { data, error: err } = await supabase.from('hijos').insert({
          parent_id: user.id,
          ...payload,
        }).select().maybeSingle()
        if (err) throw err
        onSaved(data as HijoRow)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
      setLoading(false)
    }
  }

  async function eliminar() {
    if (!hijo) return
    setEliminando(true)
    try {
      const { error: err } = await supabase.from('hijos').delete().eq('id', hijo.id)
      if (err) throw err
      onDeleted()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
      setEliminando(false)
      setConfirmDel(false)
    }
  }

  return (
    <div className="app-container">
      <div className="page-content">
        <button onClick={onCancel} className="text-brand-500 font-bold text-sm mb-4 flex items-center gap-1">← Cancelar</button>

        <div className="card bg-gradient-to-br from-brand-500 to-brand-600 text-white mb-5 py-3">
          <h2 className="font-black text-xl">{esEdicion ? '✏️ Editar hijo' : '➕ Nuevo hijo'}</h2>
          <p className="text-white/70 text-xs">{esEdicion ? 'Actualiza los datos del perfil' : 'Crea un perfil para tu peque'}</p>
        </div>

        {/* Avatar preview */}
        <div className="flex justify-center mb-5">
          <div className="w-24 h-24 rounded-full bg-brand-100 border-4 border-brand-300 flex items-center justify-center text-5xl overflow-hidden shadow-card">
            {isImg
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={avatar!} alt="avatar" className="w-full h-full object-cover" />
              : (avatar || (genero === 'niño' ? '👦' : '👧'))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-brand-700 font-semibold text-sm mb-1 block">Nombre *</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="input-field" placeholder="Ej: Mateo" />
          </div>

          <div>
            <label className="text-brand-700 font-semibold text-sm mb-1 block">Fecha de nacimiento *</label>
            <input type="date" value={nacimiento} max={new Date().toISOString().split('T')[0]}
              onChange={e => setNacimiento(e.target.value)} className="input-field" />
            {edadPreview && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="bg-brand-50 text-brand-600 text-xs font-bold px-3 py-1 rounded-full">{edadPreview}</span>
                <span className="bg-green-50 text-green-600 text-xs font-bold px-3 py-1 rounded-full">Etapa {etapaPreview}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-brand-700 font-semibold text-sm mb-2 block">Género</label>
            <div className="flex gap-3">
              {['niña', 'niño'].map(g => (
                <button key={g} type="button" onClick={() => setGenero(g)}
                  className={`flex-1 py-3 rounded-2xl font-semibold capitalize transition-all
                    ${genero === g ? 'bg-brand-500 text-white shadow-card' : 'bg-white text-brand-500 border-2 border-brand-200'}`}>
                  {g === 'niña' ? '👧 Niña' : '👦 Niño'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-brand-700 font-semibold text-sm mb-2 block">Avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {avatarsCombo.map(a => (
                <button key={a.id} type="button" onClick={() => setAvatar(a.value)}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all active:scale-90 overflow-hidden
                    ${avatar === a.value ? 'bg-brand-200 ring-2 ring-brand-500 scale-110 shadow-md' : 'bg-white shadow-sm'}`}>
                  {a.value_type === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.value} alt={a.label} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    a.value
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <p className="text-red-500 text-sm text-center">{error}</p>
            </div>
          )}

          <button onClick={guardar} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Guardando...' : (esEdicion ? 'Guardar cambios' : 'Crear perfil')}
          </button>

          {esEdicion && (
            <>
              {!confirmDel ? (
                <button onClick={() => setConfirmDel(true)} className="w-full py-3 text-red-500 font-bold rounded-2xl border-2 border-red-100 active:scale-95 transition-all">
                  🗑️ Eliminar este perfil
                </button>
              ) : (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                  <p className="text-red-700 font-bold text-sm mb-1">¿Eliminar a {hijo?.nombre}?</p>
                  <p className="text-red-600 text-xs mb-3">Esta acción no se puede deshacer. Se perderán sus datos.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDel(false)} className="flex-1 py-2 bg-white text-brand-600 font-bold rounded-xl text-sm">Cancelar</button>
                    <button onClick={eliminar} disabled={eliminando} className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                      {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
