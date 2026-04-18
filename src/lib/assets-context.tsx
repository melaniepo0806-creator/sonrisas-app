'use client'
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export type AssetRecord = { key: string; url: string; category: string; label: string }

const DEFAULTS: Record<string, string> = {
  logo: '/logo.png',
  logo_solo: '/logo-solo.png',
  mascot_celebrando: '/mascot-celebrando.png',
  mascot_duda: '/mascot-duda.png',
  chatbot_icon: '/chatbot-icon.png',
  landing_hero: '',
}

type Ctx = {
  assets: Record<string, string>    // key → url (siempre con fallback)
  reload: () => Promise<void>
  ready: boolean
}

const AssetsContext = createContext<Ctx>({ assets: DEFAULTS, reload: async () => {}, ready: false })

export function AssetsProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<Record<string, string>>(DEFAULTS)
  const [ready, setReady] = useState(false)

  const reload = useCallback(async () => {
    try {
      const { data } = await supabase.from('site_assets').select('key, url').limit(100)
      if (data) {
        const map: Record<string, string> = { ...DEFAULTS }
        for (const row of data as AssetRecord[]) {
          if (row.url && row.url.length > 0) map[row.key] = row.url
        }
        setAssets(map)
      }
    } catch {
      // silencioso: usa DEFAULTS
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  return (
    <AssetsContext.Provider value={{ assets, reload, ready }}>
      {children}
    </AssetsContext.Provider>
  )
}

/** Devuelve la URL del asset (o el fallback si aún no cargó). */
export function useAsset(key: string): string {
  const { assets } = useContext(AssetsContext)
  return assets[key] ?? DEFAULTS[key] ?? ''
}

export function useAssets(): Ctx {
  return useContext(AssetsContext)
}
