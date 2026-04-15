import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ExternalLink } from 'lucide-react'
import { db } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'

export function ProyectosPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [proyectos, setProyectos] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(false)
  const [form, setForm] = useState({ empresa_id: '', nombre: '' })

  useEffect(() => {
    cargar()
  }, [user])

  const cargar = async () => {
    setLoading(true)
    // Empresas del usuario
    const { data: emps } = await db.from('empresas').select('id, nombre, slug').eq('user_id', user.id)
    setEmpresas(emps || [])

    // Proyectos de esas empresas
    if (emps?.length) {
      const ids = emps.map(e => e.id)
      const { data: proys } = await db
        .from('proyectos_marca')
        .select('*, empresas(nombre, slug)')
        .in('empresa_id', ids)
        .order('created_at', { ascending: false })
      setProyectos(proys || [])
    }
    setLoading(false)
  }

  const crear = async () => {
    if (!form.empresa_id || !form.nombre.trim()) return
    const { data, error } = await db.from('proyectos_marca').insert({
      empresa_id: form.empresa_id,
      nombre: form.nombre.trim(),
      estado: 'activo',
    }).select().single()
    if (!error && data) {
      setCreando(false)
      setForm({ empresa_id: '', nombre: '' })
      navigate(`/admin/proyectos/${data.id}`)
    }
  }

  if (loading) return <div className="text-[#888] text-sm">Cargando…</div>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold">Proyectos de marca</h1>
        <button
          onClick={() => setCreando(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#191A23] text-white text-sm font-medium cursor-pointer border-none"
        >
          <Plus size={15} /> Nuevo proyecto
        </button>
      </div>

      {/* Modal crear */}
      {creando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="font-bold text-base">Nuevo proyecto</h2>
            <div>
              <label className="block text-xs font-semibold text-[#666] mb-1.5">Empresa</label>
              <select
                value={form.empresa_id}
                onChange={e => setForm(f => ({ ...f, empresa_id: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-[#e3e3e3] rounded-lg outline-none focus:border-[#aaa] bg-white"
              >
                <option value="">Seleccioná una empresa</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#666] mb-1.5">Nombre del proyecto</label>
              <input
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Rediseño de marca 2025"
                className="w-full px-3 py-2.5 text-sm border border-[#e3e3e3] rounded-lg outline-none focus:border-[#aaa] bg-white"
                onKeyDown={e => e.key === 'Enter' && crear()}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCreando(false)}
                className="flex-1 py-2 rounded-lg border border-[#e3e3e3] text-sm text-[#555] cursor-pointer bg-white"
              >
                Cancelar
              </button>
              <button
                onClick={crear}
                disabled={!form.empresa_id || !form.nombre.trim()}
                className="flex-1 py-2 rounded-lg bg-[#191A23] text-white text-sm font-medium cursor-pointer disabled:opacity-40 border-none"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {proyectos.length === 0 ? (
        <div className="text-center py-16 text-[#aaa] text-sm">
          No hay proyectos todavía. Creá el primero.
        </div>
      ) : (
        <div className="space-y-3">
          {proyectos.map(p => {
            const slug = p.empresas?.slug
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-[#e3e3e3] p-5 flex items-center justify-between hover:border-[#bbb] transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/proyectos/${p.id}`)}
              >
                <div>
                  <div className="font-semibold text-sm">{p.nombre}</div>
                  <div className="text-xs text-[#888] mt-0.5">{p.empresas?.nombre} · {p.estado}</div>
                </div>
                <div className="flex items-center gap-3">
                  {slug && (
                    <a
                      href={`/${slug}/exploracion`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[#888] hover:text-[#111] transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <span className="text-[#ccc]">→</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
