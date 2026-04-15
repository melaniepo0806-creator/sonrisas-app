'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SonrisasLogo from '@/components/ui/SonrisasLogo'
import Sparkles from '@/components/ui/Sparkles'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name } },
      })
      if (error) throw error
      router.push('/onboarding')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-6 py-10">
      <Sparkles />
      <div className="flex flex-col items-center mb-6">
        <SonrisasLogo size={56} />
        <div className="flex mt-1">
          <span className="text-xl font-black text-brand-700">SON</span>
          <span className="text-xl font-black text-green-500">RISAS</span>
        </div>
      </div>
      <h1 className="text-3xl font-black text-brand-800 mb-6 text-center">Crear cuenta</h1>
      <form onSubmit={handleRegister} className="w-full flex flex-col gap-3">
        <input
          type="text" placeholder="Tu nombre"
          value={form.name} onChange={e => setForm({...form, name: e.target.value})}
          className="input-field" required
        />
        <input
          type="email" placeholder="Email"
          value={form.email} onChange={e => setForm({...form, email: e.target.value})}
          className="input-field" required
        />
        <input
          type="password" placeholder="Contraseña"
          value={form.password} onChange={e => setForm({...form, password: e.target.value})}
          className="input-field" required minLength={6}
        />
        <input
          type="password" placeholder="Confirmar contraseña"
          value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})}
          className="input-field" required
        />
        {error && <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl px-3 py-2">{error}</p>}
        <button type="submit" className="btn-primary mt-2" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>
      <p className="mt-5 text-brand-600 text-sm">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-bold underline">Iniciar sesión</Link>
      </p>
    </div>
  )
}
