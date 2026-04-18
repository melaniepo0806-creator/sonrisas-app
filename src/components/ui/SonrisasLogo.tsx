'use client'
import Image from 'next/image'
import { useAsset } from '@/lib/assets-context'

type Props = {
  size?: number
  /** Usa el logo sin texto en lugar del principal */
  variant?: 'full' | 'solo'
}

export default function SonrisasLogo({ size = 80, variant = 'full' }: Props) {
  const key = variant === 'solo' ? 'logo_solo' : 'logo'
  const src = useAsset(key) || '/logo.png'
  const isRemote = src.startsWith('http')
  return (
    <Image
      src={src}
      alt="Sonrisas"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
      priority
      unoptimized={isRemote}
    />
  )
}
