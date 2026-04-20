'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type AvatarSet = {
  id: string
  key: string
  nombre: string
  descripcion: string | null
  genero: 'nino' | 'nina' | 'neutro' | null
  imagenes: Record<string, string>
  activo: boolean
  orden: number
  created_at: string
}

const POSES: { key: string; label: string; hint: string }[] = [
  { key: 'worried',  label: 'Preocupada',  hint: 'Rutina sin empezar (0 tareas)' },
  { key: 'thinking', label: 'Pensando',    hint: 'Con 1 tarea completada' },
  { key: 'neutral',  label: 'Contenta',    hint: 'Con 2-3 tareas completadas' },
  { key: 'dentist',  label: 'Dentista',    hint: '4 tareas o racha ≥ 7 días' },
]

const EMPTY_FORM = {
  key: '',
  nombre: '',
  descripcion: '',
  genero: 'neutro' as 'nino' | 'nina' | 'neutro',
  activo: true,
  orden: 100,
}

export default function AdminAvataresPage() {
  const [sets, setSets] = useState<AvatarSet[]>([])
  const [cargando, setCargando] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formImages, setFormImages] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    const { data, error } = await supabase.from('avatar_sets')
      .select('*').order('orden')
    if (error) setError(error.message)
    setSets((data || []) as AvatarSet[])
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function resetForm() {
    setForm(EMPTY_FORM)
    setFormImages({})
    setEditingId(null)
    setShowNew(false)
    setError(null)
  }

  function startEdit(s: AvatarSet) {
    setForm({
      key: s.key,
      nombre: s.nombre,
      descripcion: s.descripcion || '',
      genero: (s.genero || 'neutro') as 'nino' | 'nina' | 'neutro',
      activo: s.activo,
      orden: s.orden,
    })
    setFormImages(s.imagenes || {})
    setEditingId(s.id)
    setShowNew(false)
    setError(null)
  }

  async function subirImagen(file: File, poseKey: string): Promise<string | null> {
    if (!form.key.trim()) {
      setError('Define primero la "clave" del personaje antes de subir imágenes')
      return null
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(`"${file.name}" excede 5 MB`)
      return null
    }
    const ext = (file.name.split('.').pop() || 'png').toLowerCase()
    const path = `avatares/${form.key.trim()}/${poseKey}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('site-assets').upload(path, file, {
      contentType: file.type || 'image/png',
      upsert: true,
    })
    if (upErr) {
      setError(upErr.message)
      return null
    }
    const { data } = supabase.storage.from('site-assets').getPublicUrl(path)
    return data.publicUrl
  }

  async function guardar() {
    setError(null)
    if (!form.key.trim() || !form.nombre.trim()) {
      setError('Clave y nombre son obligatorios')
      return
    }
    setSaving(true)
    try {
      const payload = {
        key: form.key.trim(),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        genero: form.genero,
        activo: form.activo,
        orden: form.orden,
        imagenes: formImages,
      }
      if (editingId) {
        const { error } = await supabase.from('avatar_sets').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('avatar_sets').insert(payload)
        if (error) throw error
      }
      await cargar()
      resetForm()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActivo(s: AvatarSet) {
    const { error } = await supabase.from('avatar_sets').update({ activo: !s.activo }).eq('id', s.id)
    if (error) { setError(error.message); return }
    cargar()
  }

  async function eliminar(s: AvatarSet) {
    if (s.key === 'default') {
      alert('El personaje "default" no se puede eliminar')
      return
    }
    if (!confirm(`¿Eliminar el personaje "${s.nombre}"? Los niños que lo tengan volverán al por defecto.`)) return
    const { error } = await supabase.from('avatar_sets').delete().eq('id', s.id)
    if (error) { setError(error.message); return }
    cargar()
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <header className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">🧒 Personajes del avatar</h1>
        <p className="text-gray-500 text-sm">
          Cada personaje tiene 4 poses que cambian según el progreso de la rutina del niño.
        </p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm mb-4">{error}</div>
      )}

      {/* Botón crear */}
      {!showNew && !editingId && (
        <button
          onClick={() => { resetForm(); setShowNew(true) }}
          className="mb-4 bg-brand-500 text-white font-black px-4 py-2.5 rounded-xl text-sm active:scale-95">
          ➕ Nuevo personaje
        </button>
      )}

      {/* Formulario crear/editar */}
      {(showNew || editingId) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-6">
          <h2 className="font-black text-gray-900 mb-3">
            {editingId ? '✏️ Editar personaje' : '➕ Nuevo personaje'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">Clave (key) *</label>
              <input
                value={form.key}
                onChange={e => setForm(f => ({ ...f, key: e.target.value.replace(/[^a-z0-9_]/g, '') }))}
                disabled={!!editingId}
                placeholder="nino_rojo, nina_pelirroja, etc."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono disabled:bg-gray-50" />
              <p className="text-[10px] text-gray-400 mt-0.5">Identificador único, minúsculas y _. No se puede cambiar.</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">Nombre visible *</label>
              <input
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Lila del unicornio"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-600 mb-1 block">Descripción</label>
              <input
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Niña con vestido morado y peluche de unicornio"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">Género</label>
              <select
                value={form.genero}
                onChange={e => setForm(f => ({ ...f, genero: e.target.value as 'nino' | 'nina' | 'neutro' }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="nino">Niño</option>
                <option value="nina">Niña</option>
                <option value="neutro">Neutro</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">Orden</label>
              <input
                type="number"
                value={form.orden}
                onChange={e => setForm(f => ({ ...f, orden: parseInt(e.target.value, 10) || 0 }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <p className="text-[10px] text-gray-400 mt-0.5">Menor número = aparece primero</p>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                id="activo"
                type="checkbox"
                checked={form.activo}
                onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                className="w-4 h-4" />
              <label htmlFor="activo" className="text-sm text-gray-700 font-bold">Activo (visible para usuarios)</label>
            </div>
          </div>

          {/* Imágenes por pose */}
          <h3 className="font-black text-gray-800 text-sm mt-4 mb-2">Imágenes por pose</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {POSES.map(p => (
              <PoseUploader
                key={p.key}
                poseKey={p.key}
                label={p.label}
                hint={p.hint}
                url={formImages[p.key]}
                onUpload={async (file) => {
                  const url = await subirImagen(file, p.key)
                  if (url) setFormImages(m => ({ ...m, [p.key]: url }))
                }}
                onClear={() => setFormImages(m => { const n = { ...m }; delete n[p.key]; return n })}
              />
            ))}
          </div>

          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={guardar}
              disabled={saving}
              className="bg-brand-500 text-white font-black px-4 py-2.5 rounded-xl text-sm disabled:opacity-50 active:scale-95">
              {saving ? 'Guardando…' : (editingId ? '💾 Guardar cambios' : '💾 Crear personaje')}
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-100 text-gray-700 font-black px-4 py-2.5 rounded-xl text-sm active:scale-95">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de sets */}
      {cargando ? (
        <p className="text-gray-400 text-sm text-center py-8">Cargando personajes…</p>
      ) : sets.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Sin personajes aún. Crea el primero.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map(s => (
            <div key={s.id} className={`bg-white rounded-2xl border p-4 ${s.activo ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    {s.genero && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full
                        ${s.genero === 'nina' ? 'bg-pink-100 text-pink-600' : s.genero === 'nino' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                        {s.genero === 'nina' ? 'Niña' : s.genero === 'nino' ? 'Niño' : 'Neutro'}
                      </span>
                    )}
                    {!s.activo && <span className="text-[9px] font-black bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">Inactivo</span>}
                    <span className="text-[10px] text-gray-400 font-mono">#{s.orden}</span>
                  </div>
                  <h3 className="font-black text-gray-900 text-base leading-tight truncate">{s.nombre}</h3>
                  <p className="text-gray-400 text-[11px] font-mono truncate">{s.key}</p>
                </div>
              </div>
              {s.descripcion && <p className="text-gray-500 text-xs mb-2 line-clamp-2">{s.descripcion}</p>}

              {/* 4 thumbnails de las poses */}
              <div className="grid grid-cols-4 gap-1 mb-3">
                {POSES.map(p => (
                  <div key={p.key} className="relative aspect-square rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                    {s.imagenes?.[p.key] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.imagenes[p.key]} alt={p.label} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[9px] text-gray-300 font-bold">sin foto</span>
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[8px] font-bold text-center py-0.5 truncate">{p.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => startEdit(s)}
                  className="flex-1 bg-brand-100 text-brand-700 font-bold text-xs px-2 py-1.5 rounded-lg active:scale-95">
                  ✏️ Editar
                </button>
                <button onClick={() => toggleActivo(s)}
                  className="bg-gray-100 text-gray-700 font-bold text-xs px-2 py-1.5 rounded-lg active:scale-95">
                  {s.activo ? '🙈 Ocultar' : '👁️ Activar'}
                </button>
                {s.key !== 'default' && (
                  <button onClick={() => eliminar(s)}
                    className="bg-red-50 text-red-600 font-bold text-xs px-2 py-1.5 rounded-lg active:scale-95">
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sub-componente: uploader por pose ──────────────────────────────────────
function PoseUploader({
  poseKey, label, hint, url, onUpload, onClear,
}: {
  poseKey: string; label: string; hint: string;
  url?: string;
  onUpload: (file: File) => void | Promise<void>
  onClear: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl p-2 bg-gray-50/50">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-black text-gray-700">{label}</p>
        {url && (
          <button onClick={onClear} className="text-red-500 text-[10px] font-bold">quitar</button>
        )}
      </div>
      <p className="text-[9px] text-gray-400 mb-1.5 leading-tight">{hint}</p>
      <div
        onClick={() => ref.current?.click()}
        className="aspect-square rounded-lg bg-white border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-brand-400 transition-all overflow-hidden relative"
      >
        {busy ? (
          <span className="text-[10px] text-gray-400">Subiendo…</span>
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={poseKey} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="text-center">
            <div className="text-xl">📤</div>
            <p className="text-[9px] text-gray-400 font-bold mt-0.5">Subir PNG</p>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async e => {
          const f = e.target.files?.[0]
          if (!f) return
          setBusy(true)
          await onUpload(f)
          setBusy(false)
          if (ref.current) ref.current.value = ''
        }}
      />
    </div>
  )
}
