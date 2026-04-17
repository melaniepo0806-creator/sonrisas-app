'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Esta ruta recibe el redirect de Supabase tras login OAuth (Google / Apple).
// Supabase JS auto-detecta la sesión del hash (detectSessionInUrl), así que
// aquí sólo tenemos que: esperar al usuario, asegurar su perfil, y redirigir.

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    async function run() {
      // Pequeña espera para que supabase procese el hash/fragment
      const start = Date.now()
      let user = null
      while (!user && Date.now() - start < 5000) {
        const { data } = await supabase.auth.getUser()
        if (data.user) { user = data.user; break }
        await new Promise(r => setTimeout(r, 200))
      }
      if (cancelled) return
      if (!user) { router.replace('/login?error=oauth'); return }

      // Datos que Google nos manda
      const meta = (user.user_metadata || {}) as Record<string, unknown>
      const nombreCompleto = (meta.full_name || meta.name || '') as string
      const avatarUrl = (meta.avatar_url || meta.picture || '') as string

      // Upsert del perfil — si ya existe, sólo rellena campos que falten
      const { data: existing } = await supabase
        .from('profiles')
        .select('id, nombre_completo, avatar_url, onboarding_completo')
        .eq('id', user.id)
        .maybeSingle()

      if (!existing) {
        await supabase.from('profiles').insert({
          id: user.id,
          nombre_completo: nombreCompleto || null,
          avatar_url: avatarUrl || null,
          onboarding_completo: false,
        })
        router.replace('/onboarding')
        return
      }

      // Rellenar campos vacíos sin pisar lo que el usuario ya haya puesto
      const patch: Record<string, string | null> = {}
      if (!existing.nombre_completo && nombreCompleto) patch.nombre_completo = nombreCompleto
      if (!existing.avatar_url && avatarUrl) patch.avatar_url = avatarUrl
      if (Object.keys(patch).length > 0) {
        await supabase.from('profiles').update(patch).eq('id', user.id)
      }

      router.replace(existing.onboarding_completo ? '/dashboard' : '/onboarding')
    }
    run()
    return () => { cancelled = true }
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="animate-spin w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full mb-4" />
      <p className="text-brand-600 font-bold">Iniciando sesión…</p>
      <p className="text-brand-400 text-sm mt-1">Un momento, preparando tu cuenta.</p>
    </div>
  )
}
