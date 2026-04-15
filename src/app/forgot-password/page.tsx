'use client'
import { useState } from 'react'
import Link from 'next/link'
import Sparkles from '@/components/ui/Sparkles'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-6">
      <Sparkles />
      <div className="w-full">
        <Link href="/login" className="flex items-center gap-2 text-brand-600 font-semibold mb-8">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </Link>
        <div className="card">
          <h1 className="text-2xl font-black text-brand-800 mb-2">Me olvidé la contraseña</h1>
          <p className="text-brand-500 text-sm mb-6">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>
          {sent ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">📧</div>
              <p className="text-brand-700 font-bold text-lg">¡Revisa tu email!</p>
              <p className="text-brand-500 text-sm mt-2">
                Te enviamos un enlace a <strong>{email}</strong>
              </p>
              <Link href="/login" className="btn-primary mt-6 block text-center">
                Volver al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email" placeholder="Tu email"
                value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" required
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
