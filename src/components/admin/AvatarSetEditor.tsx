'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export type AvatarRow = {
  id: string
  category: string
  value: string
  value_type: 'emoji' | 'image'
  label: string
  display_order: number
  active: boolean
}

type Props = {
  category: 'ninos' | 'ninas' | 'bebes' | 'padres'
  title: string
  emoji: string
  avatars: AvatarRow[]
  onChange: () => void
}

export default function AvatarSetEditor({ category, title, emoji, avatars, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const items = avatars.filter(a => a.category === category).sort((a, b) => a.display_order - b.display_order)

  async function handleUploadSet(files: FileList) {
    if (!files.length) return
    setError('')
    setUploading(true)
    try {
      const maxOrder = items.reduce((m, a) => Math.max(m, a.display_order), 0)
      let i = 0
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        if (file.size > 5 * 1024 * 1024) { setError(`"${file.name}" excede 5 MB`); continue }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
        const path = `avatars/${category}/${Date.now()}-${i}.${ext}`
        const { error: upErr } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true })
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('site-assets').getPublicUrl(path)
        const baseName = file.name.replace(/\.[^.]+$/, '')
        const { error: insErr } = await supabase.from('avatars').insert({
          category,
          value: pub.publicUrl,
          value_type: 'image',
          label: baseName.substring(0, 30),
          display_order: maxOrder + 1 + i,
        })
        if (insErr) throw insErr
        i++
      }
      onChange()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir')
    } finally {
      setUploading(false)
    }
  }

  async function replaceSet(files: FileList) {
    if (!files.length) return
    if (!confirm(`¿Sustituir TODO el set de "${title}" por ${files.length} imagen${files.length > 1 ? 'es' : ''}? Los usuarios que ya eligieron un avatar lo mantienen.`)) return
    setError('')
    setUploading(true)
    try {
      // Primero desactiva todos los existentes
      const { error: delErr } = await supabase.from('avatars').delete().eq('category', category)
      if (delErr) throw delErr
      // Ahora sube el nuevo set
      let i = 0
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        if (file.size > 5 * 1024 * 1024) { setError(`"${file.name}" excede 5 MB`); continue }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
        const path = `avatars/${category}/${Date.now()}-${i}.${ext}`
        const { error: upErr } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true })
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('site-assets').getPublicUrl(path)
        const baseName = file.name.replace(/\.[^.]+$/, '')
        const { error: insErr } = await supabase.from('avatars').insert({
          category,
          value: pub.publicUrl,
          value_type: 'image',
          label: baseName.substring(0, 30),
          display_order: i + 1,
        })
        if (insErr) throw insErr
        i++
      }
      onChange()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al reemplazar')
    } finally {
      setUploading(false)
    }
  }

  async function deleteOne(id: string) {
    if (!confirm('¿Quitar este avatar del set?')) return
    const { error } = await supabase.from('avatars').delete().eq('id', id)
    if (error) { setError(error.message); return }
    onChange()
  }

  async function addEmoji() {
    if (!newEmoji.trim()) return
    const maxOrder = items.reduce((m, a) => Math.max(m, a.display_order), 0)
    const { error } = await supabase.from('avatars').insert({
      category, value: newEmoji.trim(), value_type: 'emoji', label: newLabel.trim() || '', display_order: maxOrder + 1
    })
    if (error) { setError(error.message); return }
    setNewEmoji(''); setNewLabel('')
    onChange()
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-gray-800 text-sm">{emoji} {title} <span className="text-gray-400 font-normal">({items.length})</span></h3>
      </div>

      {/* Grid de avatars actuales */}
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-3">
        {items.map(a => (
          <div key={a.id} className="relative group">
            <div className="aspect-square rounded-xl bg-gray-50 flex items-center justify-center text-2xl overflow-hidden border border-gray-100">
              {a.value_type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.value} alt={a.label} className="w-full h-full object-cover" />
              ) : (
                <span>{a.value}</span>
              )}
            </div>
            <button onClick={() => deleteOne(a.id)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
              ×
            </button>
            {a.label && <p className="text-[9px] text-gray-400 truncate mt-0.5 text-center">{a.label}</p>}
          </div>
        ))}
        {!items.length && <p className="col-span-full text-center text-gray-400 text-xs py-4">Sin avatars en este set</p>}
      </div>

      {/* Añadir emoji suelto */}
      <div className="flex gap-2 mb-3">
        <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} placeholder="😀"
          className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-lg" />
        <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Etiqueta (opcional)"
          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs" />
        <button onClick={addEmoji}
          className="bg-gray-100 text-gray-700 font-bold text-xs px-3 rounded-lg hover:bg-gray-200">Añadir</button>
      </div>

      {/* Subida masiva / reemplazo */}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { if (e.target.files) handleUploadSet(e.target.files); e.target.value = '' }} />
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="bg-brand-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg disabled:opacity-50">
          {uploading ? 'Subiendo…' : '➕ Añadir imágenes'}
        </button>
        <label className="bg-orange-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-orange-600">
          <input type="file" accept="image/*" multiple className="hidden"
            onChange={e => { if (e.target.files) replaceSet(e.target.files); e.target.value = '' }} />
          ♻️ Sustituir set completo
        </label>
      </div>

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  )
}
