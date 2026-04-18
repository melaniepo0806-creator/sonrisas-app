'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SonrisasLogo from '@/components/ui/SonrisasLogo'

type Landing = {
  badge: string
  titulo: string
  titulo_highlight: string
  subtitulo: string
  cta_primary: string
  cta_secondary: string
  disclaimer: string
  features_title: string
  quote: string
  quote_source: string
  final_title: string
  final_desc: string
  final_cta: string
  footer_tag: string
  stat1_num: string; stat1_label: string; stat1_sub: string
  stat2_num: string; stat2_label: string; stat2_sub: string
  stat3_num: string; stat3_label: string; stat3_sub: string
}

const DEFAULT_LANDING: Landing = {
  badge: '🦷 App gratuita para familias',
  titulo: 'La salud dental de tu hijo,',
  titulo_highlight: 'desde el primer diente',
  subtitulo: 'Guías adaptadas a cada etapa, rutinas personalizadas y seguimiento del progreso. Todo en una app diseñada para padres.',
  cta_primary: '✨ Comenzar gratis',
  cta_secondary: 'Ya tengo cuenta →',
  disclaimer: 'Sin tarjeta de crédito · Para siempre gratis',
  features_title: 'Todo lo que necesitas',
  quote: '"La salud dental empieza en casa, antes de que salga el primer diente"',
  quote_source: 'Consejo de la Sociedad Española de Odontopediatría',
  final_title: '¿Listo para empezar?',
  final_desc: 'Regístrate en menos de 2 minutos. Sin tarjeta de crédito.',
  final_cta: 'Crear mi cuenta gratis ✨',
  footer_tag: 'Hecho con 🦷 para familias en España',
  stat1_num: '0-12', stat1_label: 'Años de cobertura', stat1_sub: 'desde el primer diente',
  stat2_num: '5',    stat2_label: 'Categorías',        stat2_sub: 'lavado, dieta, dentista',
  stat3_num: '100%', stat3_label: 'Gratis',            stat3_sub: 'sin suscripción',
}

export default function LandingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [L, setL] = useState<Landing>(DEFAULT_LANDING)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard')
      } else {
        setChecking(false)
      }
    })
    supabase.from('app_settings').select('value').eq('key', 'landing_content').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setL({ ...DEFAULT_LANDING, ...(data.value as Partial<Landing>) })
      })
  }, [router])

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <SonrisasLogo size={80} variant="solo" />
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
      <nav className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-4 max-w-5xl mx-auto gap-2">
        <SonrisasLogo size={48} variant="solo" />
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button onClick={() => router.push('/login')}
            className="text-brand-600 font-bold text-[11px] sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl hover:bg-white/50 transition-all whitespace-nowrap">
            Entrar
          </button>
          <button onClick={() => router.push('/register')}
            className="bg-brand-500 text-white font-bold text-[11px] sm:text-sm px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-xl shadow-md hover:bg-brand-600 active:scale-95 transition-all whitespace-nowrap">
            Empezar gratis
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12 pb-10 sm:pb-20 text-center">
        <div className="inline-block bg-green-100 text-green-700 text-[10px] sm:text-xs font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 tracking-wide uppercase">
          {L.badge}
        </div>
        <h1 className="text-[28px] leading-[1.1] sm:text-4xl md:text-5xl font-black text-brand-900 mb-3 sm:mb-6 max-w-3xl mx-auto break-words hyphens-auto">
          {L.titulo}{' '}
          <span className="text-brand-500">{L.titulo_highlight}</span>
        </h1>
        <p className="text-sm sm:text-lg md:text-xl text-brand-700 mb-6 sm:mb-10 max-w-xl mx-auto leading-snug sm:leading-relaxed px-2">
          {L.subtitulo}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <button onClick={() => router.push('/register')}
            className="w-full sm:w-auto bg-brand-500 text-white font-black text-sm sm:text-lg px-6 sm:px-10 py-3.5 sm:py-5 rounded-2xl shadow-lg hover:bg-brand-600 active:scale-95 transition-all">
            {L.cta_primary}
          </button>
          <button onClick={() => router.push('/login')}
            className="w-full sm:w-auto bg-white text-brand-600 font-black text-sm sm:text-lg px-6 sm:px-10 py-3.5 sm:py-5 rounded-2xl shadow-sm border-2 border-brand-200 hover:border-brand-400 active:scale-95 transition-all">
            {L.cta_secondary}
          </button>
        </div>
        <p className="text-brand-400 text-[11px] sm:text-sm mt-3 sm:mt-4 px-2">{L.disclaimer}</p>
      </section>

      {/* ── Features 3-col ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 sm:pb-20">
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-4 sm:p-8 border border-white shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            {[
              { emoji: '🪥', title: 'Rutinas diarias', desc: 'Temporizador de cepillado de 2 minutos con guía paso a paso.' },
              { emoji: '📚', title: 'Guías por etapas', desc: 'Contenido adaptado desde los primeros dientes.' },
              { emoji: '🪺', title: 'Comunidad Nido', desc: 'Conecta con otros padres y aprende de la experiencia colectiva.' },
            ].map((feat, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <div className="text-2xl sm:text-4xl mb-1.5 sm:mb-3">{feat.emoji}</div>
                <h3 className="font-black text-brand-800 text-sm sm:text-lg mb-1 sm:mb-2">{feat.title}</h3>
                <p className="text-brand-500 text-xs sm:text-sm leading-snug sm:leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 sm:pb-20">
        <div className="grid grid-cols-3 gap-2 sm:gap-6 text-center">
          {[
            { num: L.stat1_num, label: L.stat1_label, sub: L.stat1_sub },
            { num: L.stat2_num, label: L.stat2_label, sub: L.stat2_sub },
            { num: L.stat3_num, label: L.stat3_label, sub: L.stat3_sub },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-2.5 sm:p-5 shadow-sm border border-gray-100">
              <p className="text-lg sm:text-3xl font-black text-brand-600 mb-0.5 sm:mb-1 leading-none">{stat.num}</p>
              <p className="font-bold text-brand-800 text-[10px] sm:text-sm leading-tight break-words">{stat.label}</p>
              <p className="text-brand-400 text-[9px] sm:text-xs mt-0.5 leading-tight break-words">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features 2-col detail ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 sm:pb-20">
        <h2 className="text-xl sm:text-3xl font-black text-brand-800 text-center mb-5 sm:mb-10">{L.features_title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-5">
          {[
            { icon: '⏱️', title: 'Timer de cepillado',    desc: 'Temporizador de 2 minutos con instrucciones por cuadrante.' },
            { icon: '📅', title: 'Agenda tu cita',         desc: 'Gestiona visitas al dentista y recibe recordatorios.' },
            { icon: '🏆', title: 'Sistema de logros',      desc: 'Motiva a tu hijo con medallas y rachas.' },
            { icon: '🔖', title: 'Guarda artículos',       desc: 'Guarda los artículos para leerlos cuando quieras.' },
            { icon: '📊', title: 'Seguimiento visual',     desc: 'Calendario mensual y barras de progreso.' },
            { icon: '💬', title: 'Preguntas frecuentes',   desc: 'Asistente que responde tus dudas de salud bucodental.' },
          ].map((feat, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 flex gap-2.5 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-brand-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl flex-shrink-0">{feat.icon}</div>
              <div className="min-w-0">
                <h3 className="font-black text-brand-800 text-xs sm:text-base mb-0.5 sm:mb-1">{feat.title}</h3>
                <p className="text-brand-500 text-[11px] sm:text-sm leading-snug sm:leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quote ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 sm:pb-20">
        <div className="bg-brand-500 rounded-3xl p-5 sm:p-10 text-center text-white">
          <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">🦷</div>
          <p className="text-base sm:text-2xl font-black mb-1.5 sm:mb-3 leading-snug px-2">
            {L.quote}
          </p>
          <p className="text-white/70 text-[11px] sm:text-sm font-semibold">{L.quote_source}</p>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12 sm:pb-24 text-center">
        <h2 className="text-xl sm:text-3xl font-black text-brand-800 mb-2 sm:mb-4">{L.final_title}</h2>
        <p className="text-brand-600 mb-5 sm:mb-8 text-sm sm:text-lg px-2">{L.final_desc}</p>
        <button onClick={() => router.push('/register')}
          className="bg-brand-500 text-white font-black text-sm sm:text-xl px-6 sm:px-12 py-3.5 sm:py-5 rounded-2xl shadow-lg hover:bg-brand-600 active:scale-95 transition-all inline-block">
          {L.final_cta}
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-brand-200 py-5 sm:py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <SonrisasLogo size={36} variant="solo" />
          <p className="text-brand-400 text-[11px] sm:text-sm text-center">
            {L.footer_tag} · {new Date().getFullYear()}
          </p>
          <div className="flex gap-4 text-[11px] sm:text-sm text-brand-500">
            <button onClick={() => router.push('/login')} className="hover:text-brand-700 font-semibold">Entrar</button>
            <button onClick={() => router.push('/register')} className="hover:text-brand-700 font-semibold">Registro</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
