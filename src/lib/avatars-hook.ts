'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type AvatarItem = {
  id: string
  category: string
  value: string
  value_type: 'emoji' | 'image'
  label: string
  display_order: number
}

/**
 * Fallbacks por categoría, usados solo si la tabla `avatars` está vacía o no responde.
 * El admin (/admin/visual → tab Avatars) puede sobreescribir todos los sets.
 */
const FALLBACKS: Record<string, Array<{ value: string; label: string; value_type?: 'emoji' | 'image' }>> = {
  ninos: [
    { value: '👦🏻', label: 'Rubio' },
    { value: '👦',   label: 'Castaño' },
    { value: '👦🏽', label: 'Moreno' },
    { value: '👦🏾', label: 'Oscuro' },
    { value: '🧒🏻', label: 'Pelirrojo' },
    { value: '🧒🏽', label: 'Rizado' },
  ],
  ninas: [
    { value: '👧🏻', label: 'Rubia' },
    { value: '👧',   label: 'Castaña' },
    { value: '👧🏽', label: 'Morena' },
    { value: '👧🏾', label: 'Oscura' },
    { value: '🧒🏻', label: 'Bebé' },
    { value: '👶🏽', label: 'Pequeña' },
  ],
  bebes: [
    { value: '👶🏻', label: 'Bebé 1' },
    { value: '👶',   label: 'Bebé 2' },
    { value: '👶🏽', label: 'Bebé 3' },
    { value: '👶🏾', label: 'Bebé 4' },
  ],
  padres: [
    { value: '👨🏻', label: 'Papá 1' },
    { value: '👨',   label: 'Papá 2' },
    { value: '👨🏽', label: 'Papá 3' },
    { value: '👨🏾', label: 'Papá 4' },
    { value: '👩🏻', label: 'Mamá 1' },
    { value: '👩',   label: 'Mamá 2' },
    { value: '👩🏽', label: 'Mamá 3' },
    { value: '👩🏾', label: 'Mamá 4' },
  ],
  mascotas: [
    { value: '🐶', label: 'Perro' },
    { value: '🐱', label: 'Gato' },
    { value: '🐭', label: 'Ratón' },
    { value: '🐹', label: 'Hámster' },
    { value: '🐰', label: 'Conejo' },
    { value: '🦊', label: 'Zorro' },
    { value: '🐻', label: 'Oso' },
    { value: '🐼', label: 'Panda' },
  ],
}

/**
 * Hook para leer el catálogo de avatars por categoría.
 * Prioriza la tabla `avatars` (gestionada desde Super Admin).
 * Si está vacía o hay error, cae a los defaults hardcoded.
 *
 * Uso:
 *   const avatarsNinos = useAvatars('ninos')
 *   avatarsNinos.map(a => <button key={a.id}>{a.value}</button>)
 */
export function useAvatars(category: string): AvatarItem[] {
  const [avatars, setAvatars] = useState<AvatarItem[]>(() => buildFallback(category))

  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('avatars')
          .select('id, category, value, value_type, label, display_order')
          .eq('category', category)
          .eq('active', true)
          .order('display_order', { ascending: true })
        if (cancel) return
        if (!error && data && data.length > 0) {
          setAvatars(data as AvatarItem[])
        } else {
          setAvatars(buildFallback(category))
        }
      } catch {
        if (!cancel) setAvatars(buildFallback(category))
      }
    })()
    return () => { cancel = true }
  }, [category])

  return avatars
}

function buildFallback(category: string): AvatarItem[] {
  const fb = FALLBACKS[category] || []
  return fb.map((f, i) => ({
    id: `fb-${category}-${i}`,
    category,
    value: f.value,
    value_type: (f.value_type as 'emoji' | 'image') || 'emoji',
    label: f.label,
    display_order: i + 1,
  }))
}
