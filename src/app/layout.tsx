import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sonrisas — Cuidamos los dientes de tu hijo desde el primer día',
  description: 'App de salud dental infantil para padres',
  manifest: '/manifest.json',
  themeColor: '#3B9DC8',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-sky-100">
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  )
}
