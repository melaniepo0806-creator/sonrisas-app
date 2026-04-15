import Image from 'next/image'

export default function SonrisasLogo({ size = 80 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Sonrisas"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
      priority
    />
  )
}
