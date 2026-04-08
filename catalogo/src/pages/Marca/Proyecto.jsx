import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, Palette, Star, BookOpen, ChevronDown, ExternalLink, ClipboardList, LayoutGrid, Eye, MessageSquare, ShoppingBag, Link } from 'lucide-react'
import { db } from '../../lib/supabase'

// ── Panels ───────────────────────────────────────────────────
function PanelBrief({ proyecto }) {
  return (
    <div className="p-8">
      <h2 className="text-xl font-black text-[#1c1c1c] mb-2">Brief</h2>
      <p className="text-sm text-[#888]">Próximamente — gestión del brief del cliente.</p>
    </div>
  )
}

function PanelExploracion({ proyecto }) {
  return (
    <div className="p-8">
      <h2 className="text-xl font-black text-[#1c1c1c] mb-2">Exploración</h2>
      <p className="text-sm text-[#888]">Próximamente — propuestas visuales.</p>
    </div>
  )
}

function PanelFinalistas({ proyecto }) {
  return (
    <div className="p-8">
      <h2 className="text-xl font-black text-[#1c1c1c] mb-2">Finalistas</h2>
      <p className="text-sm text-[#888]">Próximamente — opciones finalistas.</p>
    </div>
  )
}

function PanelManual({ proyecto }) {
  return (
    <div className="p-8">
      <h2 className="text-xl font-black text-[#1c1c1c] mb-2">Manual de marca</h2>
      <p className="text-sm text-[#888]">Próximamente — manual completo con logos, fuentes y aplicaciones.</p>
    </div>
  )
}

// ── Stat card ────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-white rounded-[16px] p-5 border border-[#e8e8e8] flex items-center justify-between">
      <div>
        <div className="text-3xl font-black text-[#1c1c1c] mb-1">{value}</div>
        <div className="text-xs text-[#888]">{label}</div>
      </div>
      <div className="w-10 h-10 rounded-[10px] bg-[#e8eaf6] flex items-center justify-center shrink-0">
        <Icon size={18} className="text-[#3949ab]" />
      </div>
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────
const PASOS = [
  { key: 'brief',       label: 'Armá tu brief',           icon: ClipboardList, muted: false },
  { key: 'exploracion', label: 'Mostrá tus exploraciones', icon: LayoutGrid,    muted: false },
  { key: 'finalista',   label: 'Los finalistas',           icon: Star,          muted: false },
  { key: 'manual',      label: 'Manual de marca',          icon: Link,          muted: true  },
]

function Dashboard({ proyecto, stats, onPanel }) {
  const slug = proyecto.slug || proyecto.id

  return (
    <div className="p-8 max-w-[960px]">

      {/* Hero */}
      <div className="bg-[#1c1c1c] rounded-[20px] p-8 mb-8">
        <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">Compartí tu proceso</p>
        <h2 className="text-2xl font-black text-white mb-2">
          {proyecto.nombre}
        </h2>
        <p className="text-white/60 text-sm mb-6">
          Compartí tu link con tus clientes y recibí feedback
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onPanel('brief')}
            className="flex items-center gap-2 bg-transparent text-white border border-white/30 hover:border-white/60 px-4 py-2.5 rounded-[10px] text-sm font-semibold cursor-pointer transition-colors">
            <ClipboardList size={14} /> Armá tu brief
          </button>
          <a
            href={`/marca/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-white/50 hover:text-white/80 text-sm no-underline transition-colors">
            <ExternalLink size={14} /> Ver link del cliente
          </a>
        </div>
      </div>

      {/* Stats */}
      <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-3">Datos</p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Vistas"        value={stats.vistas}    icon={Eye} />
        <StatCard label="Respuestas"    value={stats.respuestas} icon={MessageSquare} />
        <StatCard label="Pedidos nuevos" value={stats.pedidos}   icon={ShoppingBag} />
      </div>

      {/* Primeros pasos */}
      <p className="text-sm font-bold text-[#1c1c1c] mb-4">Primeros pasos</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PASOS.map(({ key, label, icon: Icon, muted }) => (
          <button
            key={key}
            onClick={() => onPanel(key)}
            className={`rounded-[16px] p-5 text-left cursor-pointer border-none transition-colors group flex flex-col justify-between min-h-[140px]
              ${muted
                ? 'bg-[#b0b8d4] hover:bg-[#9ba5c8]'
                : 'bg-[#2d3561] hover:bg-[#363f72]'
              }`}>
            <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center mb-4 ${muted ? 'bg-white/20' : 'bg-white/15'}`}>
              <Icon size={18} className="text-white" />
            </div>
            <div className="text-white text-sm font-bold leading-snug">{label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Nav items ────────────────────────────────────────────────
const NAV = [
  { key: 'brief',       label: 'Brief',      icon: FileText },
  { key: 'exploracion', label: 'Exploración', icon: Palette },
  { key: 'finalista',   label: 'Finalistas',  icon: Star },
  { key: 'manual',      label: 'Manual',      icon: BookOpen },
]

// ── Sidebar ──────────────────────────────────────────────────
function Sidebar({ cuenta, proyecto, proyectos, panel, onPanel, onProyecto, onLogout }) {
  const [selectorOpen, setSelectorOpen] = useState(false)

  return (
    <aside className="w-[240px] shrink-0 bg-white border-r border-[#e8e8e8] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#f0f0f0]">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-5 w-auto" />
      </div>

      {/* Proyecto selector */}
      <div className="px-3 py-3 border-b border-[#f0f0f0] relative">
        <button
          onClick={() => setSelectorOpen(v => !v)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] hover:bg-[#f5f5f5] transition-colors bg-transparent border-none cursor-pointer text-left">
          <div className="w-8 h-8 rounded-full bg-[#2d3561] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {proyecto.nombre?.[0]?.toUpperCase() || 'M'}
          </div>
          <span className="text-sm font-semibold text-[#1c1c1c] truncate flex-1">{proyecto.nombre}</span>
          <ChevronDown size={14} className={`text-[#aaa] shrink-0 transition-transform ${selectorOpen ? 'rotate-180' : ''}`} />
        </button>

        {selectorOpen && (
          <div className="absolute left-3 right-3 top-[52px] bg-white rounded-[12px] shadow-xl border border-[#e8e8e8] py-1.5 z-50">
            {proyectos.map(p => (
              <button
                key={p.id}
                onClick={() => { onProyecto(p); setSelectorOpen(false) }}
                className={`w-full text-left px-3.5 py-2 text-sm truncate bg-transparent border-none cursor-pointer transition-colors rounded-[8px] mx-1 ${p.id === proyecto.id ? 'font-semibold text-[#1c1c1c] bg-[#f5f5f5]' : 'text-[#555] hover:bg-[#f5f5f5]'}`}
                style={{ width: 'calc(100% - 8px)' }}>
                {p.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <p className="text-[10px] font-bold text-[#bbb] uppercase tracking-widest px-2.5 mb-2">Links</p>
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onPanel(key)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-[10px] text-sm font-medium mb-0.5 cursor-pointer border-none transition-colors text-left
              ${panel === key
                ? 'bg-[#f0f0f0] text-[#1c1c1c] font-semibold'
                : 'bg-transparent text-[#666] hover:bg-[#f5f5f5] hover:text-[#1c1c1c]'
              }`}>
            <Icon size={15} className="shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-[#f0f0f0] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#e0e0e0] shrink-0" />
        <div className="min-w-0">
          <div className="text-xs text-[#555] font-medium truncate">{cuenta.nombre}</div>
          <button
            onClick={onLogout}
            className="text-xs text-[#999] underline bg-transparent border-none cursor-pointer p-0 hover:text-[#1c1c1c] transition-colors">
            cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  )
}

// ── Main layout ──────────────────────────────────────────────
function ProyectoLayout({ cuenta, proyectoInicial, proyectos }) {
  const navigate = useNavigate()
  const [proyecto, setProyecto] = useState(proyectoInicial)
  const [panel, setPanel] = useState('dashboard')
  const [stats, setStats] = useState({ vistas: 0, respuestas: 0, pedidos: 0 })

  useEffect(() => {
    cargarStats(proyecto.id)
  }, [proyecto.id])

  const cargarStats = async (proyectoId) => {
    const [{ count: respuestas }, { count: pedidos }] = await Promise.all([
      db.from('exploracion_feedback').select('*', { count: 'exact', head: true }).eq('proyecto_id', proyectoId),
      db.from('opciones_marca').select('*', { count: 'exact', head: true }).eq('proyecto_id', proyectoId).eq('es_finalista', true),
    ])
    setStats({ vistas: 0, respuestas: respuestas || 0, pedidos: pedidos || 0 })
  }

  const handleProyecto = (p) => {
    setProyecto(p)
    setPanel('dashboard')
    navigate(`/marca/admin/${p.id}`, { replace: true })
  }

  const handleLogout = async () => {
    await db.auth.signOut()
    window.location.href = '/marca'
  }

  const renderPanel = () => {
    if (panel === 'dashboard') return <Dashboard proyecto={proyecto} stats={stats} onPanel={setPanel} />
    if (panel === 'brief')       return <PanelBrief proyecto={proyecto} />
    if (panel === 'exploracion') return <PanelExploracion proyecto={proyecto} />
    if (panel === 'finalista')   return <PanelFinalistas proyecto={proyecto} />
    if (panel === 'manual')      return <PanelManual proyecto={proyecto} />
  }

  return (
    <div className="flex min-h-screen bg-[#f5f5f3]">
      <Sidebar
        cuenta={cuenta}
        proyecto={proyecto}
        proyectos={proyectos}
        panel={panel}
        onPanel={setPanel}
        onProyecto={handleProyecto}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto">
        {renderPanel()}
      </main>
    </div>
  )
}

// ── Auth + data loader ───────────────────────────────────────
export default function MarcaProyecto() {
  const { proyectoId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ checked: false, cuenta: null, proyecto: null, proyectos: [] })

  useEffect(() => {
    load()
  }, [proyectoId])

  const load = async () => {
    const { data: { session } } = await db.auth.getSession()
    const user = session?.user
    if (!user) { window.location.href = '/marca'; return }

    const { data: cuenta } = await db.from('cuentas_marca').select('*').eq('user_id', user.id).single()
    if (!cuenta) { navigate('/marca/admin'); return }

    const { data: proyectos } = await db
      .from('proyectos_marca')
      .select('*')
      .eq('cuenta_id', cuenta.id)
      .neq('estado', 'archivado')
      .order('created_at', { ascending: false })

    const proyecto = (proyectos || []).find(p => p.id === proyectoId)
    if (!proyecto) { navigate('/marca/admin'); return }

    setState({ checked: true, cuenta, proyecto, proyectos: proyectos || [] })
  }

  if (!state.checked) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-[#e3e3e3] border-t-[#1c1c1c] animate-spin" />
    </div>
  )

  return (
    <ProyectoLayout
      cuenta={state.cuenta}
      proyectoInicial={state.proyecto}
      proyectos={state.proyectos}
    />
  )
}
