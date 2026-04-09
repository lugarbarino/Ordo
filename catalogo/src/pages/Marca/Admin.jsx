import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ExternalLink, X, ChevronRight, Archive, Briefcase, Package, Link, ChevronDown, FileText, Palette, Star, BookOpen } from 'lucide-react'
import { db } from '../../lib/supabase'

const FASES = ['brief', 'exploracion', 'finalista', 'manual']

const FASE_LABEL = {
  brief: 'Brief',
  exploracion: 'Exploración',
  finalista: 'Finalista',
  manual: 'Manual',
  completado: 'Completado',
}

const FASE_COLOR = {
  brief:      { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  exploracion:{ bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400' },
  finalista:  { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
  manual:     { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-400' },
  completado: { bg: 'bg-[#f0f0f0]', text: 'text-[#888]',     dot: 'bg-[#ccc]' },
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

function ProgressBar({ estado }) {
  const idx = FASES.indexOf(estado)
  return (
    <div className="flex gap-1 mt-3">
      {FASES.map((f, i) => (
        <div key={f} className="flex-1 h-1 rounded-full bg-[#e8e8e8]">
          <div className={`h-full rounded-full ${i <= idx ? 'bg-[#1c1c1c]' : ''}`}
            style={{ width: i <= idx ? '100%' : '0%' }} />
        </div>
      ))}
    </div>
  )
}

// ── Onboarding ───────────────────────────────────────────────
function Onboarding({ user, onCreada }) {
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCrear = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    setLoading(true)
    const { data, error: err } = await db
      .from('cuentas_marca')
      .insert({ user_id: user.id, nombre: nombre.trim() })
      .select()
      .single()
    setLoading(false)
    if (err) { setError(err.message); return }
    onCreada(data)
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-8">
      <div className="bg-white rounded-[24px] p-10 w-full max-w-[440px] shadow-xl">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-6 w-auto mb-8" />
        <h1 className="text-2xl font-black text-[#1c1c1c] mb-2">Bienvenido a Marca</h1>
        <p className="text-sm text-[#888] mb-8 leading-relaxed">
          ¿Cómo se llama tu estudio o tu nombre como diseñador?
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-[#111]">Nombre del estudio / diseñador</label>
            <input
              autoFocus
              type="text"
              value={nombre}
              onChange={e => { setNombre(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleCrear()}
              placeholder="Ej: Estudio Vela, Ana García…"
              className="w-full px-3.5 py-2.5 border border-[#dde3ed] rounded-lg text-sm outline-none focus:border-[#1c1c1c] transition-colors"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
          <button
            onClick={handleCrear}
            disabled={loading}
            className="w-full py-3 bg-[#1c1c1c] text-white rounded-lg font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 border-none">
            {loading ? 'Creando…' : 'Empezar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal nuevo proyecto ─────────────────────────────────────
function ModalNuevoProyecto({ cuentaId, onClose, onCreado }) {
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
      .insert({ cuenta_id: cuentaId, nombre: nombre.trim(), estado: 'brief', slug })
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
            <label className="block text-xs font-semibold mb-1.5 text-[#111]">Nombre de la empresa cliente</label>
            <input
              autoFocus
              type="text"
              value={nombre}
              onChange={e => { setNombre(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleCrear()}
              placeholder="Ej: Café Mamá, Clínica Sur…"
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

// ── Card de proyecto ─────────────────────────────────────────
function ProyectoCard({ proyecto, onAbrir, onArchivar }) {
  const [menu, setMenu] = useState(false)

  return (
    <div className="bg-white rounded-[18px] p-6 border border-[#e8e8e8] hover:border-[#ccc] hover:shadow-lg transition-all group relative">
      <div className="flex items-start justify-between mb-3">
        <Badge estado={proyecto.estado} />
        <div className="relative">
          <button
            onClick={() => setMenu(v => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#ccc] hover:text-[#666] hover:bg-[#f5f5f5] bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-base leading-none">
            ···
          </button>
          {menu && (
            <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-[#e8e8e8] py-1.5 w-40 z-10"
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
      <p className="text-xs text-[#aaa] mb-4">
        {new Date(proyecto.created_at || Date.now()).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>

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
          title="Ver página del cliente"
          className="w-10 h-10 flex items-center justify-center border border-[#e8e8e8] rounded-lg text-[#666] hover:bg-[#f5f5f5] transition-colors no-underline">
          <ExternalLink size={15} />
        </a>
      </div>
    </div>
  )
}

// ── Empty state dashboard ────────────────────────────────────
const PASOS_EMPTY = [
  { label: 'Armá tu brief',            icon: Briefcase, bg: 'bg-[#35425f]', textColor: 'text-white' },
  { label: 'Mostrá tus exploraciones', icon: Package,   bg: 'bg-[#495a82]', textColor: 'text-white' },
  { label: 'Los finalistas',           icon: Package,   bg: 'bg-[#495a82]', textColor: 'text-white' },
  { label: 'Manual de marca',          icon: Link,      bg: 'bg-[#aab8d8]', textColor: 'text-[#171717]' },
]

function EmptyDashboard({ onNuevo }) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-[960px]">

        {/* Hero — mismo estilo que Dashboard de proyecto */}
        <div className="bg-[#1c1c1c] rounded-[20px] p-8 mb-8">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">Compartí tu proceso</p>
          <h2 className="text-2xl font-black text-white mb-2">Crea tu primera marca</h2>
          <p className="text-white/60 text-sm mb-6">Compartí tu link con tus clientes y recibí feedback</p>
          <button
            onClick={onNuevo}
            className="flex items-center gap-2 bg-transparent text-white border border-white/30 hover:border-white/60 px-4 py-2.5 rounded-[10px] text-sm font-semibold cursor-pointer transition-colors">
            <Plus size={14} /> Nuevo proyecto
          </button>
        </div>

        {/* Stats en 0 */}
        <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-3">Datos</p>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Vistas', icon: Eye },
            { label: 'Respuestas', icon: MessageSquare },
            { label: 'Pedidos nuevos', icon: ShoppingBag },
          ].map(({ label, icon: Icon }) => (
            <button key={label} onClick={onNuevo} className="bg-white rounded-[16px] p-5 border border-[#e8e8e8] flex items-center justify-between cursor-pointer hover:border-[#ccc] transition-colors text-left">
              <div>
                <div className="text-3xl font-black text-[#ccc] mb-1">—</div>
                <div className="text-xs text-[#aaa]">{label}</div>
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-[#f0f0f0] flex items-center justify-center shrink-0">
                <Icon size={18} className="text-[#ccc]" />
              </div>
            </button>
          ))}
        </div>

        {/* Primeros pasos */}
        <p className="text-sm font-bold text-[#1c1c1c] mb-4">Primeros pasos</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PASOS_EMPTY.map(({ label, icon: Icon, bg, textColor }) => (
            <button key={label} onClick={onNuevo} className={`${bg} rounded-[16px] p-5 flex flex-col justify-between min-h-[140px] border-none cursor-pointer text-left hover:opacity-90 transition-opacity`}>
              <div className="w-9 h-9 rounded-[8px] bg-white/15 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-white" />
              </div>
              <p className={`text-sm font-bold ${textColor} leading-snug`}>{label}</p>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}

const NAV_EMPTY = [
  { label: 'Brief',      icon: FileText },
  { label: 'Exploración', icon: Palette },
  { label: 'Finalistas',  icon: Star },
  { label: 'Manual',      icon: BookOpen },
]

// ── Sidebar (admin) ──────────────────────────────────────────
function AdminSidebar({ cuenta, onLogout, onNuevo }) {
  return (
    <aside className="w-[288px] shrink-0 bg-white border-r-2 border-[#f1f1f1] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-8 h-[72px] flex items-center border-b border-[#f1f1f1]">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-[26px] w-auto" />
      </div>

      {/* Proyecto selector placeholder */}
      <div className="px-4 py-3 border-b border-[#f1f1f1]">
        <button
          onClick={onNuevo}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] hover:bg-[#f5f5f5] transition-colors bg-transparent border-none cursor-pointer text-left">
          <div className="w-10 h-10 rounded-full bg-[#726d76] text-white flex items-center justify-center text-xs font-bold shrink-0">
            M
          </div>
          <span className="text-sm font-semibold text-[#aaa] truncate flex-1">Nueva marca</span>
          <Plus size={14} className="text-[#aaa] shrink-0" />
        </button>
      </div>

      {/* Nav links (placeholder, todos abren modal) */}
      <nav className="flex-1 px-4 py-4">
        <p className="text-[10px] font-bold text-[#bbb] uppercase tracking-widest px-2.5 mb-2">Links</p>
        {NAV_EMPTY.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={onNuevo}
            className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-[10px] text-sm font-medium mb-0.5 cursor-pointer border-none transition-colors text-left bg-transparent text-[#bbb] hover:bg-[#f5f5f5] hover:text-[#999]">
            <Icon size={15} className="shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-6 py-6 border-t border-[#e3e3e3]">
        <div className="flex items-center gap-3 pt-3">
          <div className="w-10 h-10 rounded-full bg-[#726d76] shrink-0" />
          <div>
            <p className="text-[11.2px] text-[#484848]">{cuenta.nombre}</p>
            <button
              onClick={onLogout}
              className="text-[11.5px] text-[#111] underline bg-transparent border-none cursor-pointer p-0 hover:opacity-70">
              cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ── Panel principal ──────────────────────────────────────────
function AdminContent({ cuenta, user }) {
  const [proyectos, setProyectos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { cargarProyectos() }, [cuenta.id])

  useEffect(() => {
    if (!cargando && proyectos.length > 0) {
      navigate(`/marca/admin/${proyectos[0].id}`, { replace: true })
    }
  }, [cargando, proyectos.length])

  const cargarProyectos = async () => {
    setCargando(true)
    const { data } = await db
      .from('proyectos_marca')
      .select('*')
      .eq('cuenta_id', cuenta.id)
      .neq('estado', 'archivado')
    setProyectos(data || [])
    setCargando(false)
  }

  const handleLogout = async () => {
    await db.auth.signOut()
    window.location.href = '/marca'
  }

  if (cargando) return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-[#e3e3e3] border-t-[#1c1c1c] animate-spin" />
    </div>
  )

  // Con proyectos → el useEffect ya redirige, mostramos spinner mientras
  if (proyectos.length > 0) return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-[#e3e3e3] border-t-[#1c1c1c] animate-spin" />
    </div>
  )

  // ── Empty state ──────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <AdminSidebar cuenta={cuenta} onLogout={handleLogout} onNuevo={() => setModalOpen(true)} />
      <EmptyDashboard onNuevo={() => setModalOpen(true)} />
      {modalOpen && (
        <ModalNuevoProyecto
          cuentaId={cuenta.id}
          onClose={() => setModalOpen(false)}
          onCreado={p => navigate(`/marca/admin/${p.id}`)}
        />
      )}
    </div>
  )
}

// ── Auth wrapper ─────────────────────────────────────────────
export default function MarcaAdmin() {
  const [state, setState] = useState({ checked: false, user: null, cuenta: null })

  useEffect(() => {
    const { data: { subscription } } = db.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user || null
      if (!user) { setState({ checked: true, user: null, cuenta: null }); return }

      const { data: cuentas } = await db
        .from('cuentas_marca')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)

      setState({ checked: true, user, cuenta: cuentas?.[0] || null })
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!state.checked) return null

  if (!state.user) {
    window.location.href = '/marca'
    return null
  }

  if (!state.cuenta) {
    return (
      <Onboarding
        user={state.user}
        onCreada={cuenta => setState(s => ({ ...s, cuenta }))}
      />
    )
  }

  return <AdminContent cuenta={state.cuenta} user={state.user} />
}
