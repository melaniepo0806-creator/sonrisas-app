'use client'
import { useRouter } from 'next/navigation'
import Sparkles from '@/components/ui/Sparkles'
import SonrisasLogo from '@/components/ui/SonrisasLogo'

export default function BienvenidaPage() {
  const router = useRouter()
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <Sparkles />
      <SonrisasLogo size={100} />
      <h1 className="text-3xl font-black text-brand-800 mt-6 mb-3">
        ¡Todo listo!
      </h1>
      <p className="text-brand-500 text-base leading-relaxed max-w-xs mb-10">
        Bienvenid@ a Sonrisas. Tu viaje hacia una sonrisa sana para tu bebé comienza hoy. 🦷✨
      </p>
      <button onClick={() => router.push('/dashboard')} className="btn-primary">
        ¡Comenzar!
      </button>
    </div>
  )
}
