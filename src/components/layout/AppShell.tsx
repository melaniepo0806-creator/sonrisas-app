'use client'
import { usePathname } from 'next/navigation'

/**
 * Decide si envolver el contenido en el contenedor móvil (.app-container,
 * max-w-sm) o dejarlo full-width. El admin usa full-width para verse bien en PC.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFullWidth = pathname?.startsWith('/admin')

  if (isFullWidth) {
    // Admin y otras rutas de escritorio: sin contenedor móvil
    return <>{children}</>
  }

  return <div className="app-container">{children}</div>
}
