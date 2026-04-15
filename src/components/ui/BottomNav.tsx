'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    href: '/dashboard',
    label: 'Inicio',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
          fill={active ? '#3B9DC8' : 'none'}
          stroke={active ? '#3B9DC8' : '#9CA3AF'} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/guias',
    label: 'Guías',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="2" width="12" height="20" rx="2"
          fill={active ? '#3B9DC8' : 'none'}
          stroke={active ? '#3B9DC8' : '#9CA3AF'} strokeWidth="2"/>
        <path d="M8 7H13M8 11H13M8 15H11"
          stroke={active ? 'white' : '#9CA3AF'} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="18" cy="18" r="4" fill={active ? '#6DB878' : '#D1D5DB'}/>
        <path d="M16 18L17.5 19.5L20 16.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/nido',
    label: 'Nido',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
          fill={active ? '#3B9DC8' : 'none'}
          stroke={active ? '#3B9DC8' : '#9CA3AF'} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/faq',
    label: 'FAQ',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9"
          fill={active ? '#3B9DC8' : 'none'}
          stroke={active ? '#3B9DC8' : '#9CA3AF'} strokeWidth="2"/>
        <path d="M9.5 9C9.5 7.619 10.619 6.5 12 6.5C13.381 6.5 14.5 7.619 14.5 9C14.5 10.381 12 11.5 12 11.5V13"
          stroke={active ? 'white' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="16" r="0.5" fill={active ? 'white' : '#9CA3AF'} stroke={active ? 'white' : '#9CA3AF'} strokeWidth="1"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/perfil',
    label: 'Perfil',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4"
          fill={active ? '#3B9DC8' : 'none'}
          stroke={active ? '#3B9DC8' : '#9CA3AF'} strokeWidth="2"/>
        <path d="M4 20C4 17.239 7.582 15 12 15C16.418 15 20 17.239 20 20"
          stroke={active ? '#3B9DC8' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm
                    bg-white shadow-nav pb-safe z-50 border-t border-gray-100">
      <div className="flex items-center justify-around px-2 pt-2 pb-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href ||
            (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 min-w-[52px]"
            >
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-brand-50' : ''}`}>
                {tab.icon(isActive)}
              </div>
              <span className={`text-[10px] font-semibold transition-colors
                ${isActive ? 'text-brand-500' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
