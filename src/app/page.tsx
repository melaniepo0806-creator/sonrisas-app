'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SonrisasLogo from '@/components/ui/SonrisasLogo'

export default function LandingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard')
      } else {
        setChecking(false)
      }
    })
  }, [router])

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <SonrisasLogo size={80} />
        <div className="mt-6 flex gap-1.5">
          <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
          <span className="w-2 h-2 bg-brand-300 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
          <span className="w-2 h-2 bg-brand-200 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{background: 'linear-gradient(160deg, #EAF6FD 0%, #C8E8F5 100%)'}}>

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-5xl mx-auto gap-2">
        <SonrisasLogo size={72} />
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => router.push('/login')}
            className="text-brand-600 font-bold text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-xl hover:bg-white/50 transition-all whitespace-nowrap">
            Iniciar sesión
          </button>
          <button onClick={() => router.push('/register')}
            className="bg-brand-500 text-white font-bold text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md hover:bg-brand-600 active:scale-95 transition-all whitespace-nowrap">
            Empezar gratis
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 pt-8 sm:pt-12 pb-14 sm:pb-20 text-center">
        <div className="inline-block bg-green-100 text-green-700 text-[10px] sm:text-xs font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-5 sm:mb-6 tracking-wide uppercase">
          🦷 App gratuita para familias
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-900 leading-[1.15] mb-4 sm:mb-6 max-w-3xl mx-auto">
          La salud dental de tu hijo,{' '}
          <span className="text-brand-500">desde el primer diente</span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-brand-700 mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed">
          Guías adaptadas a cada etapa, rutinas personalizadas y seguimiento del progreso. Todo en una app diseñada para padres.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <button onClick={() => router.push('/register')}
            className="w-full sm:w-auto bg-brand-500 text-white font-black text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 rounded-2xl shadow-lg hover:bg-brand-600 active:scale-95 transition-all">
            ✨ Comenzar gratis
          </button>
          <button onClick={() => router.push('/login')}
            className="w-full sm:w-auto bg-white text-brand-600 font-black text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 rounded-2xl shadow-sm border-2 border-brand-200 hover:border-brand-400 active:scale-95 transition-all">
            Ya tengo cuenta →
          </button>
        </div>
        <p className="text-brand-400 text-xs sm:text-sm mt-4">Sin tarjeta de crédito · Para siempre gratis</p>
      </section>

      {/* ── Features 3-col ── */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 pb-14 sm:pb-20">
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-5 sm:p-8 border border-white shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { emoji: '🪥', title: 'Rutinas diarias', desc: 'Temporizador de cepillado de 2 minutos con guía paso a paso para toda la familia' },
              { emoji: '📚', title: 'Guías por etapas', desc: 'Contenido adaptado desde los primeros dientes hasta la dentición definitiva' },
              { emoji: '🪺', title: 'Comunidad Nido', desc: 'Conecta con otros padres, comparte dudas y aprende de la experiencia colectiva' },
            ].map((feat, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{feat.emoji}</div>
                <h3 className="font-black text-brand-800 text-base sm:text-lg mb-1 sm:mb-2">{feat.title}</h3>
                <p className="text-brand-500 text-xs sm:text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 pb-14 sm:pb-20">
        <div className="grid grid-cols-3 gap-2 sm:gap-6 text-center">
          {[
            { num: '0-12', label: 'Años de cobertura', sub: 'desde el primer diente' },
            { num: '5',    label: 'Categorías de guías', sub: 'lavado, dieta, dentista...' },
            { num: '100%', label: 'Gratis para familias', sub: 'sin suscripción' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100">
              <p className="text-xl sm:text-3xl font-black text-brand-600 mb-1">{stat.num}</p>
              <p className="font-bold text-brand-800 text-[11px] sm:text-sm leading-tight">{stat.label}</p>
              <p className="text-brand-400 text-[10px] sm:text-xs mt-0.5 leading-tight">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features 2-col detail ── */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 pb-14 sm:pb-20">
        <h2 className="text-2xl sm:text-3xl font-black text-brand-800 text-center mb-6 sm:mb-10">Todo lo que necesitas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
          {[
            { icon: '⏱️', title: 'Timer de cepillado',    desc: 'Temporizador de 2 minutos con instrucciones por cuadrante para que tu hijo aprenda la técnica correcta.' },
            { icon: '📅', title: 'Agenda tu cita',         desc: 'Gestiona las visitas al dentista y recibe recordatorios para no olvidar las revisiones de tu hijo.' },
            { icon: '🏆', title: 'Sistema de logros',      desc: 'Motiva a tu hijo con medallas y rachas. Celebra cada semana de rutina completada.' },
            { icon: '🔖', title: 'Guarda artículos',       desc: 'Guarda los artículos que más te interesan para leerlos cuando quieras, sin conexión.' },
            { icon: '📊', title: 'Seguimiento visual',     desc: 'Calendario mensual y barras de progreso para ver de un vistazo cómo va la rutina.' },
            { icon: '💬', title: 'Preguntas frecuentes',   desc: 'Asistente inteligente que responde tus dudas sobre salud bucodental infantil.' },
          ].map((feat, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 flex gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">{feat.icon}</div>
              <div className="min-w-0">
                <h3 className="font-black text-brand-800 text-sm sm:text-base mb-1">{feat.title}</h3>
                <p className="text-brand-500 text-xs sm:text-sm leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quote ── */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 pb-14 sm:pb-20">
        <div className="bg-brand-500 rounded-3xl p-6 sm:p-10 text-center text-white">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🦷</div>
          <p className="text-lg sm:text-2xl font-black mb-2 sm:mb-3 leading-snug">
            &quot;La salud dental empieza en casa,<br className="hidden sm:inline"/> antes de que salga el primer diente&quot;
          </p>
          <p className="text-white/70 text-xs sm:text-sm font-semibold">Consejo de la Sociedad Española de Odontopediatría</p>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 pb-16 sm:pb-24 text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-brand-800 mb-3 sm:mb-4">¿Listo para empezar?</h2>
        <p className="text-brand-600 mb-6 sm:mb-8 text-base sm:text-lg">Regístrate en menos de 2 minutos. Sin tarjeta de crédito.</p>
        <button onClick={() => router.push('/register')}
          className="bg-brand-500 text-white font-black text-base sm:text-xl px-8 sm:px-12 py-4 sm:py-5 rounded-2xl shadow-lg hover:bg-brand-600 active:scale-95 transition-all inline-block">
          Crear mi cuenta gratis ✨
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-brand-200 py-6 sm:py-8 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <SonrisasLogo size={40} />
          <p className="text-brand-400 text-xs sm:text-sm text-center">
            Hecho con 🦷 para familias en España · {new Date().getFullYear()}
          </p>
          <div className="flex gap-4 text-xs sm:text-sm text-brand-500">
            <button onClick={() => router.push('/login')} className="hover:text-brand-700 font-semibold">Entrar</button>
            <button onClick={() => router.push('/register')} className="hover:text-brand-700 font-semibold">Registro</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
