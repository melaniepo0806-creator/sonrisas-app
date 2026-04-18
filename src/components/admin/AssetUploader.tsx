'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export type SiteAsset = {
  key: string
  url: string
  category: string
  label: string
  description: string | null
  updated_at: string
}

type Props = {
  asset: SiteAsset
  fallback: string              // URL por defecto (/logo.png, etc.)
  onUpdated: (a: SiteAsset) => void
}

export default function AssetUploader({ asset, fallback, onUpdated }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayUrl = preview || asset.url || fallback

  async function handleFile(file: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen'); return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Máximo 5 MB'); return
    }
    setError('')
    setUploading(true)
    // preview instantáneo
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const path = `${asset.key}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('site-assets')
        .upload(path, file, { cacheControl: '3600', upsert: true })
      if (upErr) throw upErr

      const { data: pub } = supabase.storage.from('site-assets').getPublicUrl(path)
      const publicUrl = pub.publicUrl
      if (!publicUrl) throw new Error('No se pudo obtener la URL pública')

      const { data: { user } } = await supabase.auth.getUser()
      const { data: updated, error: updErr } = await supabase
        .from('site_assets')
        .update({ url: publicUrl, updated_by: user?.id })
        .eq('key', asset.key)
        .select()
        .single()
      if (updErr) throw updErr

      setPreview(null)
      onUpdated(updated as SiteAsset)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  async function reset() {
    if (!confirm(`¿Restaurar "${asset.label}" al valor por defecto?`)) return
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: updated, error: updErr } = await supabase
        .from('site_assets')
        .update({ url: fallback, updated_by: user?.id })
        .eq('key', asset.key)
        .select()
        .single()
      if (updErr) throw updErr
      onUpdated(updated as SiteAsset)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al restaurar')
    } finally {
      setUploading(false)
    }
  }

  const isCustom = asset.url && asset.url !== fallback && !asset.url.startsWith('/')

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <div className="flex items-start gap-3">
        {/* Preview */}
        <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayUrl} alt={asset.label} className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-gray-300 text-xs">sin imagen</span>
          )}
        </div>

        {/* Info y acciones */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-black text-gray-800 text-sm truncate">{asset.label}</h3>
            {isCustom && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded">Personalizado</span>}
          </div>
          {asset.description && (
            <p className="text-gray-500 text-xs mb-2 leading-snug">{asset.description}</p>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.target.value = ''
            }}
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="bg-brand-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-50"
            >
              {uploading ? 'Subiendo…' : '📤 Subir nueva'}
            </button>
            {isCustom && (
              <button
                onClick={reset}
                disabled={uploading}
                className="text-gray-600 font-bold text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
              >
                Restaurar por defecto
              </button>
            )}
          </div>
          {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
          <p className="text-gray-400 text-[10px] mt-1.5">PNG/JPG/SVG/WEBP · máx. 5&nbsp;MB</p>
        </div>
      </div>
    </div>
  )
}

/** Utility helper: coloca Image con la URL del asset, usando el fallback si está vacío. */
type AssetImageProps = {
  url: string | undefined | null
  fallback: string
  alt: string
  size: number
  className?: string
}
export function AssetImage({ url, fallback, alt, size, className }: AssetImageProps) {
  const src = url && url.length > 0 ? url : fallback
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
      className={className}
      unoptimized={src.startsWith('http')}
    />
  )
}
