import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, Palette, Star, BookOpen, LogOut, ChevronDown, ExternalLink, ClipboardList, LayoutGrid } from 'lucide-react'
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

// ── Dashboard ────────────────────────────────────────────────
const PASOS = [
  { key: 'brief',       label: 'Armá tu brief',           icon: ClipboardList },
  { key: 'exploracion', label: 'Mostrá tus exploraciones', icon: LayoutGrid },
  { key: 'finalista',   label: 'Los finalistas',           icon: Star },
  { key: 'manual',      label: 'Manual de marca',          icon: BookOpen },
]

function Dashboard({ proyecto, stats, onPanel }) {
  const slug = proyecto.slug || proyecto.id

  return (
    <div className="p-8 max-w-[900px]">

      {/* Hero */}
      <div className="bg-[#1c1c1c] rounded-[20px] p-8 mb-8">
        <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Compartí tu proceso</p>
        <h2 className="text-2xl font-black text-white mb-2">
          {proyecto.nombre}
        </h2>
        <p className="text-white/60 text-sm mb-5">
          Compartí el link con tu cliente para que participe del proceso
        </p>
        <div className="flex items-center gap-3">
          <a
            href={`/marca/${slug}/brief`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-white text-[#1c1c1c] px-4 py-2.5 rounded-[10px] text-sm font-semibold no-underline hover:opacity-90 transition-opacity">
            <ExternalLink size={14} /> Ver link del cliente
          </a>
        </div>
      </div>

      {/* Stats */}
      <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-3">Datos</p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Propuestas', value: stats.propuestas },
          { label: 'Finalistas', value: stats.finalistas },
          { label: 'Feedback recibido', value: stats.feedback },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-[16px] p-5 border border-[#e8e8e8]">
            <div className="text-3xl font-black text-[#1c1c1c] mb-1">{value}</div>
            <div className="text-xs text-[#888]">{label}</div>
          </div>
        ))}
      </div>

      {/* Primeros pasos */}
      <p className="text-sm font-bold text-[#1c1c1c] mb-4">Primeros pasos</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PASOS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onPanel(key)}
            className="bg-[#1c1c1c] hover:bg-[#333] rounded-[16px] p-5 text-left cursor-pointer border-none transition-colors group">
            <Icon size={20} className="text-white/60 mb-6 group-hover:text-white/80 transition-colors" />
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
    <aside className="w-[220px] shrink-0 bg-white border-r border-[#e8e8e8] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#f0f0f0]">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-5 w-auto" />
      </div>

      {/* Proyecto selector */}
      <div className="px-3 py-3 border-b border-[#f0f0f0] relative">
        <button
          onClick={() => setSelectorOpen(v => !v)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] hover:bg-[#f5f5f5] transition-colors bg-transparent border-none cursor-pointer text-left">
          <div className="w-7 h-7 rounded-full bg-[#1c1c1c] text-white flex items-center justify-center text-xs font-bold shrink-0">
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
      <div className="px-5 py-4 border-t border-[#f0f0f0]">
        <div className="text-xs text-[#aaa] mb-1 truncate">{cuenta.nombre}</div>
        <button
          onClick={onLogout}
          className="text-xs text-[#666] underline bg-transparent border-none cursor-pointer p-0 hover:text-[#1c1c1c] transition-colors">
          cerrar sesión
        </button>
      </div>
    </aside>
  )
}

// ── Main layout ──────────────────────────────────────────────
function ProyectoLayout({ cuenta, proyectoInicial, proyectos }) {
  const navigate = useNavigate()
  const [proyecto, setProyecto] = useState(proyectoInicial)
  const [panel, setPanel] = useState('dashboard')
  const [stats, setStats] = useState({ propuestas: 0, finalistas: 0, feedback: 0 })

  useEffect(() => {
    cargarStats(proyecto.id)
  }, [proyecto.id])

  const cargarStats = async (proyectoId) => {
    const [{ count: propuestas }, { count: finalistas }, { data: fb }] = await Promise.all([
      db.from('opciones_marca').select('*', { count: 'exact', head: true }).eq('proyecto_id', proyectoId).eq('es_propuesta', true),
      db.from('opciones_marca').select('*', { count: 'exact', head: true }).eq('proyecto_id', proyectoId).eq('es_finalista', true),
      db.from('exploracion_feedback').select('id').eq('proyecto_id', proyectoId),
    ])
    setStats({ propuestas: propuestas || 0, finalistas: finalistas || 0, feedback: fb?.length || 0 })
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
