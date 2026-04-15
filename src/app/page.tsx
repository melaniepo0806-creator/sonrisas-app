'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SonrisasLogo from '@/components/ui/SonrisasLogo'
import Sparkles from '@/components/ui/Sparkles'

export default function SplashPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login')
    }, 2500)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <Sparkles />
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <SonrisasLogo size={120} />
        <div>
          <h1 className="text-4xl font-black tracking-tight">
            <span className="text-brand-700">SON</span>
            <span className="text-green-500">RISAS</span>
          </h1>
          <p className="text-brand-600 font-semibold mt-2 text-sm leading-snug">
            Cuidamos los dientes de tu hijo<br />desde el primer día
          </p>
        </div>
        <div className="mt-8 flex gap-1.5">
          <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
          <span className="w-2 h-2 bg-brand-300 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
          <span className="w-2 h-2 bg-brand-200 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
        </div>
      </div>
    </div>
  )
}
