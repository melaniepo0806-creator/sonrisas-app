'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AssetUploader, { SiteAsset } from '@/components/admin/AssetUploader'
import AvatarSetEditor, { AvatarRow } from '@/components/admin/AvatarSetEditor'

type Colors = { primary: string; secondary: string; background: string }

type LandingContent = {
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

const DEFAULT_LANDING: LandingContent = {
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

const ASSET_FALLBACKS: Record<string, string> = {
  logo: '/logo.png',
  logo_solo: '/logo-solo.png',
  mascot_celebrando: '/mascot-celebrando.png',
  mascot_duda: '/mascot-duda.png',
  chatbot_icon: '/chatbot-icon.png',
  landing_hero: '',
}

const CATEGORIES: { key: string; label: string; emoji: string }[] = [
  { key: 'logo',    label: 'Logos',      emoji: '🦷' },
  { key: 'mascot',  label: 'Mascotas',   emoji: '🧸' },
  { key: 'landing', label: 'Landing',    emoji: '🌅' },
  { key: 'general', label: 'General',    emoji: '🖼️' },
]

// Pequeño helper para inputs con label
function Field({ label, value, onChange, type = 'text', hint, mono = false, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; hint?: string; mono?: boolean; multiline?: boolean
}) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-600 mb-1 block">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
          className={`w-full border border-gray-200 rounded-xl px-3 py-2 text-sm ${mono ? 'font-mono' : ''}`} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          className={`w-full border border-gray-200 rounded-xl px-3 py-2 text-sm ${mono ? 'font-mono' : ''}`} />
      )}
      {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  )
}

export default function AdminVisual() {
  const [colors, setColors] = useState<Colors>({ primary: '#3B9DC8', secondary: '#22C55E', background: '#EAF6FD' })
  const [landing, setLanding] = useState<LandingContent>(DEFAULT_LANDING)
  const [consejos, setConsejos] = useState<string[]>([])
  const [nuevo, setNuevo] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [assets, setAssets] = useState<SiteAsset[]>([])
  const [avatarsList, setAvatarsList] = useState<AvatarRow[]>([])
  const [loading, setLoading] = useState(true)
  const [openTab, setOpenTab] = useState<'images'|'avatars'|'texts'|'colors'|'consejos'>('images')

  const load = useCallback(async () => {
    setLoading(true)
    const [settingsRes, assetsRes, avatarsRes] = await Promise.all([
      supabase.from('app_settings').select('*'),
      supabase.from('site_assets').select('*').order('category', { ascending: true }).order('key', { ascending: true }),
      supabase.from('avatars').select('*').order('category').order('display_order'),
    ])
    if (settingsRes.data) {
      for (const row of settingsRes.data) {
        if (row.key === 'brand_colors')     setColors(row.value as Colors)
        if (row.key === 'landing_content')  setLanding({ ...DEFAULT_LANDING, ...(row.value as Partial<LandingContent>) })
        if (row.key === 'home_consejos')    setConsejos(row.value as string[])
      }
    }
    if (assetsRes.data) setAssets(assetsRes.data as SiteAsset[])
    if (avatarsRes.data) setAvatarsList(avatarsRes.data as AvatarRow[])
    setLoading(false)
  }, [])

  const reloadAvatars = useCallback(async () => {
    const { data } = await supabase.from('avatars').select('*').order('category').order('display_order')
    if (data) setAvatarsList(data as AvatarRow[])
    setSavedMsg('Avatars actualizados ✓')
    setTimeout(() => setSavedMsg(''), 2000)
  }, [])

  useEffect(() => { load() }, [load])

  async function guardar(key: string, value: unknown) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('app_settings').upsert({ key, value, updated_by: user?.id, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    setSavedMsg('Guardado ✓')
    setTimeout(() => setSavedMsg(''), 2000)
  }

  function updateL<K extends keyof LandingContent>(k: K, v: LandingContent[K]) {
    setLanding(prev => ({ ...prev, [k]: v }))
  }

  function handleAssetUpdate(updated: SiteAsset) {
    setAssets(prev => prev.map(a => a.key === updated.key ? updated : a))
    setSavedMsg('Imagen actualizada ✓')
    setTimeout(() => setSavedMsg(''), 2000)
  }

  if (loading) return <p className="text-gray-400 text-sm text-center py-8">Cargando…</p>

  const tabs = [
    { k: 'images',   label: 'Imágenes',  emoji: '🖼️' },
    { k: 'avatars',  label: 'Avatars',   emoji: '👦' },
    { k: 'texts',    label: 'Textos',    emoji: '✏️' },
    { k: 'colors',   label: 'Colores',   emoji: '🎨' },
    { k: 'consejos', label: 'Consejos',  emoji: '💡' },
  ] as const

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-1">Visual</h1>
      <p className="text-gray-500 text-sm mb-4">Personaliza imágenes, textos, colores y consejos de la app.</p>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.k} onClick={() => setOpenTab(t.k)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              openTab === t.k ? 'bg-brand-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {savedMsg && <p className="mb-3 bg-green-50 text-green-700 text-sm text-center py-2 rounded-xl">{savedMsg}</p>}

      {/* ── Tab: Imágenes ────────────────────────────────── */}
      {openTab === 'images' && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="font-black text-gray-800 mb-1">🖼️ Imágenes de la app</h2>
          <p className="text-gray-500 text-xs mb-4">Sube nuevas imágenes para reemplazar las actuales. Los cambios se aplican al instante en toda la app.</p>

          {CATEGORIES.map(cat => {
            const items = assets.filter(a => a.category === cat.key)
            if (!items.length) return null
            return (
              <div key={cat.key} className="mb-5 last:mb-0">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">{cat.emoji} {cat.label}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map(a => (
                    <AssetUploader
                      key={a.key}
                      asset={a}
                      fallback={ASSET_FALLBACKS[a.key] ?? ''}
                      onUpdated={handleAssetUpdate}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tab: Avatars ─────────────────────────────────── */}
      {openTab === 'avatars' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="font-black text-gray-800 mb-1">👦 Catálogo de avatars</h2>
            <p className="text-gray-500 text-xs mb-4">
              Añade emojis sueltos, sube imágenes, o sustituye un set completo. Los usuarios que ya eligieron un avatar
              lo mantienen. Los cambios aparecen al instante en el selector de avatars y onboarding.
            </p>
            <div className="space-y-3">
              <AvatarSetEditor category="ninos"  title="Niños"  emoji="👦" avatars={avatarsList} onChange={reloadAvatars} />
              <AvatarSetEditor category="ninas"  title="Niñas"  emoji="👧" avatars={avatarsList} onChange={reloadAvatars} />
              <AvatarSetEditor category="bebes"  title="Bebés"  emoji="👶" avatars={avatarsList} onChange={reloadAvatars} />
              <AvatarSetEditor category="padres" title="Padres" emoji="👨‍👩" avatars={avatarsList} onChange={reloadAvatars} />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Textos de la landing ────────────────────── */}
      {openTab === 'texts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="font-black text-gray-800 mb-1">✏️ Textos de la landing</h2>
            <p className="text-gray-500 text-xs mb-4">Edita cualquier texto de la página pública. Los cambios se aplican al instante.</p>

            <div className="space-y-5">
              {/* Hero */}
              <section>
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Hero</h3>
                <div className="space-y-2.5">
                  <Field label="Badge (insignia arriba)" value={landing.badge} onChange={v => updateL('badge', v)}
                    hint="Ej: 🦷 App gratuita para familias" />
                  <Field label="Título principal" value={landing.titulo} onChange={v => updateL('titulo', v)} />
                  <Field label="Título destacado (se muestra en color)" value={landing.titulo_highlight} onChange={v => updateL('titulo_highlight', v)} />
                  <Field label="Subtítulo" value={landing.subtitulo} onChange={v => updateL('subtitulo', v)} multiline />
                  <Field label="Botón principal" value={landing.cta_primary} onChange={v => updateL('cta_primary', v)} />
                  <Field label="Botón secundario" value={landing.cta_secondary} onChange={v => updateL('cta_secondary', v)} />
                  <Field label="Aviso pequeño" value={landing.disclaimer} onChange={v => updateL('disclaimer', v)}
                    hint="Ej: Sin tarjeta de crédito · Para siempre gratis" />
                </div>
              </section>

              {/* Stats */}
              <section>
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Estadísticas (3 tarjetas)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => {
                    const n = `stat${i}` as const
                    return (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] font-black text-gray-500 uppercase">Estadística {i}</p>
                        <Field label="Número" value={landing[`${n}_num`]} onChange={v => updateL(`${n}_num`, v)} />
                        <Field label="Label" value={landing[`${n}_label`]} onChange={v => updateL(`${n}_label`, v)} />
                        <Field label="Sub" value={landing[`${n}_sub`]} onChange={v => updateL(`${n}_sub`, v)} />
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Features title */}
              <section>
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Sección features</h3>
                <Field label="Título" value={landing.features_title} onChange={v => updateL('features_title', v)} />
              </section>

              {/* Quote */}
              <section>
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Cita destacada</h3>
                <div className="space-y-2.5">
                  <Field label="Frase" value={landing.quote} onChange={v => updateL('quote', v)} multiline />
                  <Field label="Fuente" value={landing.quote_source} onChange={v => updateL('quote_source', v)} />
                </div>
              </section>

              {/* CTA final */}
              <section>
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">CTA final</h3>
                <div className="space-y-2.5">
                  <Field label="Título" value={landing.final_title} onChange={v => updateL('final_title', v)} />
                  <Field label="Descripción" value={landing.final_desc} onChange={v => updateL('final_desc', v)} />
                  <Field label="Botón" value={landing.final_cta} onChange={v => updateL('final_cta', v)} />
                </div>
              </section>

              {/* Footer */}
              <section>
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Footer</h3>
                <Field label="Tagline" value={landing.footer_tag} onChange={v => updateL('footer_tag', v)}
                  hint="Se muestra con el año actual añadido automáticamente" />
              </section>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => guardar('landing_content', landing)}
                  className="bg-brand-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-600 active:scale-95 transition-all">
                  💾 Guardar todos los textos
                </button>
                <button onClick={() => { if (confirm('¿Restaurar todos los textos a los valores por defecto?')) setLanding(DEFAULT_LANDING) }}
                  className="text-gray-600 font-bold text-sm px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all">
                  Restaurar por defecto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Colores ─────────────────────────────────── */}
      {openTab === 'colors' && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="font-black text-gray-800 mb-3">🎨 Colores de la marca</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {(['primary','secondary','background'] as const).map(k => (
              <div key={k}>
                <label className="text-xs font-bold text-gray-600 mb-1 block capitalize">{k}</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={colors[k]} onChange={e => setColors({ ...colors, [k]: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer" />
                  <input value={colors[k]} onChange={e => setColors({ ...colors, [k]: e.target.value })}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2 items-center">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-lg border border-gray-200" style={{ background: colors.primary }} />
              <div className="w-8 h-8 rounded-lg border border-gray-200" style={{ background: colors.secondary }} />
              <div className="w-8 h-8 rounded-lg border border-gray-200" style={{ background: colors.background }} />
            </div>
            <button onClick={() => guardar('brand_colors', colors)}
              className="ml-auto bg-brand-500 text-white font-bold text-sm px-4 py-2 rounded-xl">Guardar colores</button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Se guardan en <code>app_settings.brand_colors</code>.</p>
        </div>
      )}

      {/* ── Tab: Consejos ────────────────────────────────── */}
      {openTab === 'consejos' && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="font-black text-gray-800 mb-3">💡 Consejos del día</h2>
          <ul className="space-y-2 mb-3">
            {consejos.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                <input value={c} onChange={e => {
                  const copy = [...consejos]; copy[i] = e.target.value; setConsejos(copy)
                }} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                <button onClick={() => setConsejos(consejos.filter((_, j) => j !== i))}
                  className="text-red-500 text-sm font-bold px-2 py-1 rounded-lg hover:bg-red-50">Quitar</button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mb-3">
            <input value={nuevo} onChange={e => setNuevo(e.target.value)} placeholder="Añadir consejo…"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            <button onClick={() => { if (nuevo) { setConsejos([...consejos, nuevo]); setNuevo('') } }}
              className="bg-gray-100 text-gray-700 font-bold text-sm px-4 py-2 rounded-xl">Añadir</button>
          </div>
          <button onClick={() => guardar('home_consejos', consejos)}
            className="bg-brand-500 text-white font-bold text-sm px-4 py-2 rounded-xl">Guardar consejos</button>
        </div>
      )}
    </div>
  )
}
