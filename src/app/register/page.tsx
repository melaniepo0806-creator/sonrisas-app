'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SonrisasLogo from '@/components/ui/SonrisasLogo'
import Sparkles from '@/components/ui/Sparkles'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nombre: '', username: '', email: '', telefono: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!form.username.trim()) { setError('El nombre de usuario es obligatorio'); return }
    if (form.username.length < 3) { setError('El nombre de usuario debe tener al menos 3 caracteres'); return }
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true); setError('')
    try {
      // Check username uniqueness
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', form.username.trim())
        .maybeSingle()
      if (existingUser) {
        setError('Este nombre de usuario ya está en uso. Por favor elige otro.')
        setLoading(false)
        return
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { nombre_completo: form.nombre, telefono: form.telefono, username: form.username } }
      })
      if (error) throw error
      // Save profile using user from signUp response
      const userId = signUpData?.user?.id
      if (userId) {
        await supabase.from('profiles').upsert({
          id: userId,
          nombre_completo: form.nombre,
          telefono: form.telefono,
          username: form.username || null,
          onboarding_completo: false,
        })
      }
      router.push('/onboarding')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-start min-h-screen px-6 py-8 overflow-y-auto">
      <Sparkles />
      <div className="flex flex-col items-center mb-6">
        <SonrisasLogo size={52} />
        <div className="flex gap-0 mt-1">
          <span className="text-xl font-black text-brand-700">SON</span>
          <span className="text-xl font-black text-green-500">RISAS</span>
        </div>
      </div>
      <h1 className="text-2xl font-black text-brand-800 mb-6 text-center">Crear una cuenta</h1>
      <form onSubmit={handleRegister} className="w-full flex flex-col gap-3">
        <div>
          <label className="text-brand-700 font-bold text-sm ml-1 mb-1 block">Nombre completo</label>
          <input type="text" placeholder="Tu nombre completo" value={form.nombre}
            onChange={e => update('nombre', e.target.value)} className="input-field" required />
        </div>
        <div>
          <label className="text-brand-700 font-bold text-sm ml-1 mb-1 block">Nombre de usuario *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
            <input type="text" placeholder="tu_nombre" value={form.username}
              onChange={e => update('username', e.target.value.replace(/\s/g, '').toLowerCase())} className="input-field pl-8" required />
          </div>
          <p className="text-brand-400 text-xs ml-1 mt-1">Este nombre te identifica en la comunidad</p>
        </div>
        <div>
          <label className="text-brand-700 font-bold text-sm ml-1 mb-1 block">Email</label>
          <input type="email" placeholder="tu@email.com" value={form.email}
            onChange={e => update('email', e.target.value)} className="input-field" required />
        </div>
        <div>
          <label className="text-brand-700 font-bold text-sm ml-1 mb-1 block">Teléfono</label>
          <input type="tel" placeholder="+34 600 000 000" value={form.telefono}
            onChange={e => update('telefono', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="text-brand-700 font-bold text-sm ml-1 mb-1 block">Contraseña</label>
          <input type="password" placeholder="Mínimo 6 caracteres" value={form.password}
            onChange={e => update('password', e.target.value)} className="input-field" required />
        </div>
        <div>
          <label className="text-brand-700 font-bold text-sm ml-1 mb-1 block">Confirmar contraseña</label>
          <input type="password" placeholder="Repite la contraseña" value={form.confirm}
            onChange={e => update('confirm', e.target.value)} className="input-field" required />
        </div>
        {error && <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl px-3 py-2">{error}</p>}
        <button type="submit" className="btn-primary mt-2" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 w-full">
        <div className="flex-1 h-px bg-brand-200"/>
        <span className="text-brand-400 text-xs font-medium">o continuar con</span>
        <div className="flex-1 h-px bg-brand-200"/>
      </div>

      <div className="flex gap-3 w-full">
        <button onClick={async () => { const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` }}); if (error) setError(error.message) }}
          className="flex-1 flex items-center justify-center gap-2 bg-white rounded-2xl py-3 shadow-card border border-gray-100 font-semibold text-gray-700 text-sm hover:bg-gray-50 active:scale-95 transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 bg-white rounded-2xl py-3 shadow-card border border-gray-100 font-semibold text-gray-700 text-sm hover:bg-gray-50 active:scale-95 transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Apple
        </button>
      </div>

      <p className="mt-5 text-brand-400 text-xs text-center px-4">
        Al registrarte aceptas nuestros{' '}
        <Link href="/terminos" className="text-brand-600 underline">Términos y condiciones</Link>
        {' '}y{' '}
        <Link href="/privacidad" className="text-brand-600 underline">Política de privacidad</Link>
      </p>

      <Link href="/login" className="mt-4 text-brand-600 font-bold text-sm">
        ¿Ya tienes cuenta? <span className="underline">Inicia sesión</span>
      </Link>
    </div>
  )
}
