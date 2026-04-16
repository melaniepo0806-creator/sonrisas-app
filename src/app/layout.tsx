import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sonrisas — Cuidamos los dientes de tu hijo desde el primer día',
  description: 'App de salud dental infantil para padres. Rutinas, guías y comunidad.',
  manifest: '/manifest.json',
  applicationName: 'Sonrisas',
  appleWebApp: {
    capable: true,
    title: 'Sonrisas',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/logo-solo.png'],
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#3B9DC8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sonrisas" />
      </head>
      <body className="bg-sky-100">
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  )
}
