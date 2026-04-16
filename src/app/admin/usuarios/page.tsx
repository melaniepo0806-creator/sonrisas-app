'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type UserRow = {
  id: string
  nombre_completo: string | null
  username: string | null
  telefono: string | null
  role: string | null
  plan: string | null
  onboarding_completo: boolean
  created_at: string
}

export default function AdminUsuarios() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [meId, setMeId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setMeId(user?.id || null)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers((data as UserRow[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function cambiarRol(id: string, role: string) {
    await supabase.from('profiles').update({ role }).eq('id', id)
    load()
  }
  async function cambiarPlan(id: string, plan: string) {
    await supabase.from('profiles').update({ plan }).eq('id', id)
    load()
  }

  const filtrados = users.filter(u => {
    if (!q) return true
    const s = q.toLowerCase()
    return (u.nombre_completo || '').toLowerCase().includes(s)
        || (u.username || '').toLowerCase().includes(s)
        || (u.telefono || '').includes(s)
  })

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-1">Usuarios</h1>
      <p className="text-gray-500 text-sm mb-5">{users.length} usuarios registrados. Cambia roles y planes desde aquí.</p>

      <input type="search" placeholder="Buscar por nombre, usuario o teléfono…"
        value={q} onChange={e => setQ(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white mb-4" />

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-8">Cargando…</p>
      ) : filtrados.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Sin resultados.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-bold">Nombre</th>
                <th className="text-left px-4 py-2 font-bold">Usuario</th>
                <th className="text-left px-4 py-2 font-bold">Rol</th>
                <th className="text-left px-4 py-2 font-bold">Plan</th>
                <th className="text-left px-4 py-2 font-bold hidden md:table-cell">Registrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(u => (
                <tr key={u.id}>
                  <td className="px-4 py-2.5">
                    <p className="font-bold text-gray-800 truncate max-w-[160px]">{u.nombre_completo || '—'}</p>
                    <p className="text-xs text-gray-400">{u.telefono || ''}</p>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{u.username ? `@${u.username}` : '—'}</td>
                  <td className="px-4 py-2.5">
                    <select value={u.role || 'user'} disabled={u.id === meId}
                      onChange={e => cambiarRol(u.id, e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white">
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                      <option value="super_admin">super_admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <select value={u.plan || 'free'}
                      onChange={e => cambiarPlan(u.id, e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white">
                      <option value="free">free</option>
                      <option value="pro">pro</option>
                      <option value="family">family</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-400 hidden md:table-cell">
                    {new Date(u.created_at).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
