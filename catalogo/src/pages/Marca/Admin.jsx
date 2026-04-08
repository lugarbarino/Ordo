import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LogOut, ExternalLink, X, ChevronRight, Archive } from 'lucide-react'
import { db } from '../../lib/supabase'
import { useAppStore } from '../../store/useAppStore'

const FASES = ['brief', 'exploracion', 'finalista', 'manual']

const FASE_LABEL = {
  brief: 'Brief',
  exploracion: 'Exploración',
  finalista: 'Finalista',
  manual: 'Manual',
  completado: 'Completado',
}

const FASE_COLOR = {
  brief: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  exploracion: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  finalista: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
  manual: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400' },
  completado: { bg: 'bg-[#f0f0f0]', text: 'text-[#888]', dot: 'bg-[#ccc]' },
}

function ProgressBar({ estado }) {
  const idx = FASES.indexOf(estado)
  return (
    <div className="flex gap-1 mt-3">
      {FASES.map((f, i) => (
        <div key={f} className="flex-1 h-1 rounded-full overflow-hidden bg-[#e8e8e8]">
          <div className={`h-full rounded-full transition-all ${i <= idx ? 'bg-[#1c1c1c]' : ''}`}
            style={{ width: i <= idx ? '100%' : '0%' }} />
        </div>
      ))}
    </div>
  )
}

function Badge({ estado }) {
  const c = FASE_COLOR[estado] || FASE_COLOR.brief
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {FASE_LABEL[estado] || estado}
    </span>
  )
}

function ModalNuevoProyecto({ empresaId, onClose, onCreado }) {
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCrear = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    setLoading(true)
    const slug = nombre.trim()
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const { data, error: err } = await db
      .from('proyectos_marca')
      .insert({ empresa_id: empresaId, nombre: nombre.trim(), estado: 'brief', slug })
      .select()
      .single()

    setLoading(false)
    if (err) { setError(err.message); return }
    onCreado(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-[18px] p-8 w-full max-w-[420px] shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-[#1c1c1c]">Nueva marca</h2>
          <button onClick={onClose} className="text-[#999] bg-transparent border-none cursor-pointer p-0">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-[#111]">Nombre del proyecto / cliente</label>
            <input
              autoFocus
              type="text"
              value={nombre}
              onChange={e => { setNombre(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleCrear()}
              placeholder="Ej: Café Mamá, Estudio Vela…"
              className="w-full px-3.5 py-2.5 border border-[#dde3ed] rounded-lg text-sm outline-none focus:border-[#1c1c1c] transition-colors"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <button
            onClick={handleCrear}
            disabled={loading}
            className="w-full py-3 bg-[#1c1c1c] text-white rounded-lg font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 border-none">
            {loading ? 'Creando…' : 'Crear proyecto'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProyectoCard({ proyecto, onAbrir, onArchivar }) {
  const [menu, setMenu] = useState(false)
  const faseIdx = FASES.indexOf(proyecto.estado)

  return (
    <div className="bg-white rounded-[18px] p-6 border border-[#e8e8e8] hover:border-[#ccc] hover:shadow-lg transition-all group relative">
      <div className="flex items-start justify-between mb-3">
        <Badge estado={proyecto.estado} />
        <div className="relative">
          <button
            onClick={() => setMenu(v => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#ccc] hover:text-[#666] hover:bg-[#f5f5f5] bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
            ···
          </button>
          {menu && (
            <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-[#e8e8e8] py-1.5 w-44 z-10"
              onMouseLeave={() => setMenu(false)}>
              <button
                onClick={() => { onArchivar(proyecto); setMenu(false) }}
                className="w-full text-left px-4 py-2 text-sm text-[#888] hover:bg-[#f5f5f5] flex items-center gap-2 bg-transparent border-none cursor-pointer">
                <Archive size={14} /> Archivar
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-lg font-black text-[#1c1c1c] mb-1 leading-tight">{proyecto.nombre}</h3>

      <div className="flex gap-3 text-xs text-[#aaa] mb-4">
        <span>{new Date(proyecto.created_at || Date.now()).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>

      <ProgressBar estado={proyecto.estado} />

      <div className="flex gap-2 mt-5">
        <button
          onClick={() => onAbrir(proyecto)}
          className="flex-1 py-2.5 bg-[#1c1c1c] text-white text-sm font-semibold rounded-lg cursor-pointer hover:opacity-90 transition-opacity border-none flex items-center justify-center gap-1.5">
          Gestionar <ChevronRight size={14} />
        </button>
        <a
          href={`/marca/${proyecto.slug || proyecto.id}`}
          target="_blank"
          rel="noreferrer"
          className="w-10 h-10 flex items-center justify-center border border-[#e8e8e8] rounded-lg text-[#666] hover:bg-[#f5f5f5] transition-colors no-underline">
          <ExternalLink size={15} />
        </a>
      </div>
    </div>
  )
}

function AdminContent({ empresa }) {
  const [proyectos, setProyectos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    cargarProyectos()
  }, [empresa.id])

  const cargarProyectos = async () => {
    setCargando(true)
    const { data } = await db
      .from('proyectos_marca')
      .select('*')
      .eq('empresa_id', empresa.id)
      .neq('estado', 'archivado')
      .order('created_at', { ascending: false })
    setProyectos(data || [])
    setCargando(false)
  }

  const handleCreado = (nuevo) => {
    setProyectos(p => [nuevo, ...p])
  }

  const handleArchivar = async (proyecto) => {
    await db.from('proyectos_marca').update({ estado: 'archivado' }).eq('id', proyecto.id)
    setProyectos(p => p.filter(x => x.id !== proyecto.id))
  }

  const handleAbrir = (proyecto) => {
    navigate(`/marca/admin/${proyecto.id}`)
  }

  const handleLogout = async () => {
    await db.auth.signOut()
    window.location.href = '/marca'
  }

  return (
    <div className="min-h-screen bg-[#f5f5f3]">
      {/* Header */}
      <header className="bg-white border-b border-[#e8e8e8] px-6 sm:px-10 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <img src="/logo-ordo.svg" alt="ORDO" className="h-5 w-auto" />
          <div className="w-px h-5 bg-[#e0e0e0]" />
          <span className="text-sm font-semibold text-[#1c1c1c]">Marca</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#888] hidden sm:block">{empresa.nombre}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-[#666] hover:text-[#1c1c1c] bg-transparent border-none cursor-pointer transition-colors px-2 py-1">
            <LogOut size={15} /> Salir
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-[1100px] mx-auto px-6 sm:px-10 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#1c1c1c]">Proyectos de marca</h1>
            <p className="text-sm text-[#888] mt-1">{proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''} activo{proyectos.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-[#1c1c1c] text-white px-5 py-3 rounded-[12px] font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity border-none">
            <Plus size={16} /> Nueva marca
          </button>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-[#e3e3e3] border-t-[#1c1c1c] animate-spin" />
          </div>
        ) : proyectos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#e8e8e8] flex items-center justify-center mb-4">
              <Plus size={24} className="text-[#999]" />
            </div>
            <h2 className="text-lg font-bold text-[#1c1c1c] mb-2">No hay proyectos todavía</h2>
            <p className="text-sm text-[#888] mb-6">Creá tu primer proyecto de marca para empezar</p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#1c1c1c] text-white px-6 py-3 rounded-[12px] font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity border-none">
              Nueva marca
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {proyectos.map(p => (
              <ProyectoCard
                key={p.id}
                proyecto={p}
                onAbrir={handleAbrir}
                onArchivar={handleArchivar}
              />
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <ModalNuevoProyecto
          empresaId={empresa.id}
          onClose={() => setModalOpen(false)}
          onCreado={handleCreado}
        />
      )}
    </div>
  )
}

function AdminApp() {
  const { user, empresa, setUser, cargarEmpresa } = useAppStore()
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = db.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user || null
      setUser(u)
      if (u) await cargarEmpresa()
      setCargando(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (cargando) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-[#e3e3e3] border-t-[#111] animate-spin" />
    </div>
  )

  if (!empresa) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8 text-center">
      <div>
        <h2 className="text-lg font-bold mb-2">Necesitás tener un catálogo configurado</h2>
        <p className="text-sm text-[#888] mb-4">El módulo de Marca usa la misma cuenta que el Catálogo.</p>
        <a href="/catalogo" className="text-[#1c1c1c] font-semibold underline text-sm">Ir a Catálogo</a>
      </div>
    </div>
  )

  return <AdminContent empresa={empresa} />
}

export default function MarcaAdmin() {
  const [authChecked, setAuthChecked] = useState(false)
  const [initialUser, setInitialUser] = useState(undefined)

  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      setInitialUser(session?.user || null)
      setAuthChecked(true)
    })
  }, [])

  if (!authChecked) return null

  if (initialUser === null) {
    window.location.href = '/marca'
    return null
  }

  return <AdminApp />
}
