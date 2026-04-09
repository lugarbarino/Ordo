import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, Palette, Star, BookOpen, ChevronDown, ExternalLink, ClipboardList, LayoutGrid, Eye, MessageSquare, ShoppingBag, Link, Pencil, Check, X, Plus, Trash2, Menu, LayoutDashboard } from 'lucide-react'
import { db } from '../../lib/supabase'

const PREGUNTAS_DEFAULT = [
  '¿A qué se dedica la empresa?',
  '¿Quién es el cliente ideal?',
  '¿Cuáles son los valores de la marca?',
  '¿Qué personalidad tiene la marca? (ej: seria, divertida, joven, clásica…)',
  '¿Qué marcas admira o usa como referencia?',
]

// ── Panels ───────────────────────────────────────────────────
function PanelBrief({ proyecto }) {
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [referencias, setReferencias] = useState([])
  const [editando, setEditando] = useState(null)
  const [textoEdit, setTextoEdit] = useState('')
  const [nuevoLink, setNuevoLink] = useState('')
  const [nuevaDesc, setNuevaDesc] = useState('')
  const [cargando, setCargando] = useState(true)
  const inputRef = useRef(null)

  useEffect(() => { cargar() }, [proyecto.id])
  useEffect(() => { if (editando && inputRef.current) inputRef.current.focus() }, [editando])

  const cargar = async () => {
    setCargando(true)
    let { data: preg } = await db.from('brief_preguntas').select('*').eq('proyecto_id', proyecto.id).order('orden')

    if (!preg || preg.length === 0) {
      const inserts = PREGUNTAS_DEFAULT.map((texto, i) => ({ proyecto_id: proyecto.id, texto, orden: i }))
      const { data: nuevas } = await db.from('brief_preguntas').insert(inserts).select()
      preg = nuevas || []
    } else {
      // Deduplicar por texto en caso de inserciones duplicadas previas
      const seen = new Set()
      preg = preg.filter(p => { if (seen.has(p.texto)) return false; seen.add(p.texto); return true })
    }

    const { data: resp } = await db.from('brief_respuestas').select('*').eq('proyecto_id', proyecto.id)
    const respMap = {}
    resp?.forEach(r => { respMap[r.pregunta_id] = r.respuesta })

    const { data: refs } = await db.from('brief_referencias').select('*').eq('proyecto_id', proyecto.id)

    setPreguntas(preg)
    setRespuestas(respMap)
    setReferencias(refs || [])
    setCargando(false)
  }

  const iniciarEdit = (p) => { setEditando(p.id); setTextoEdit(p.texto) }
  const guardarEdit = async () => {
    if (!textoEdit.trim()) return
    await db.from('brief_preguntas').update({ texto: textoEdit.trim() }).eq('id', editando)
    setPreguntas(prev => prev.map(p => p.id === editando ? { ...p, texto: textoEdit.trim() } : p))
    setEditando(null)
  }
  const cancelarEdit = () => setEditando(null)

  const agregarRef = async () => {
    if (!nuevoLink.trim()) return
    const tipo = nuevoLink.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) ? 'imagen' : 'link'
    const { data } = await db.from('brief_referencias')
      .insert({ proyecto_id: proyecto.id, url: nuevoLink.trim(), descripcion: nuevaDesc.trim() || null, tipo })
      .select().single()
    if (data) { setReferencias(prev => [...prev, data]); setNuevoLink(''); setNuevaDesc('') }
  }

  const eliminarRef = async (id) => {
    await db.from('brief_referencias').delete().eq('id', id)
    setReferencias(prev => prev.filter(r => r.id !== id))
  }

  if (cargando) return (
    <div className="p-6 flex items-center justify-center py-20">
      <div className="w-6 h-6 rounded-full border-2 border-[#e3e3e3] border-t-[#1c1c1c] animate-spin" />
    </div>
  )

  return (
    <div className="p-6 md:p-8 max-w-[760px]">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1c1c1c] mb-1">Brief</h2>
          <p className="text-sm text-[#888]">Preguntas para el cliente. Podés editar cualquiera.</p>
        </div>
        <a
          href={`/marca/${proyecto.slug || proyecto.id}/brief`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#1c1c1c] border border-[#e8e8e8] bg-white px-3 py-2 rounded-[8px] no-underline hover:border-[#ccc] transition-colors shrink-0">
          <ExternalLink size={13} /> Ver link del cliente
        </a>
      </div>

      {/* Preguntas */}
      <div className="flex flex-col gap-3 mb-10">
        {preguntas.map((p, i) => (
          <div key={p.id} className="bg-white rounded-[16px] border border-[#e8e8e8] p-5 group">
            <div className="flex items-start gap-3">
              <span className="text-xs font-bold text-[#bbb] mt-0.5 w-5 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                {editando === p.id ? (
                  <div className="flex items-start gap-2">
                    <textarea
                      ref={inputRef}
                      value={textoEdit}
                      onChange={e => setTextoEdit(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); guardarEdit() } if (e.key === 'Escape') cancelarEdit() }}
                      className="flex-1 text-sm text-[#1c1c1c] border border-[#1c1c1c] rounded-[8px] px-3 py-2 resize-none outline-none leading-relaxed"
                      rows={2}
                    />
                    <div className="flex flex-col gap-1">
                      <button onClick={guardarEdit} className="w-7 h-7 flex items-center justify-center bg-[#1c1c1c] text-white rounded-[6px] cursor-pointer border-none hover:opacity-80"><Check size={13} /></button>
                      <button onClick={cancelarEdit} className="w-7 h-7 flex items-center justify-center bg-[#f0f0f0] text-[#666] rounded-[6px] cursor-pointer border-none hover:bg-[#e8e8e8]"><X size={13} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1c1c1c] leading-relaxed">{p.texto}</p>
                    <button onClick={() => iniciarEdit(p)} className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-[#aaa] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] rounded-[6px] cursor-pointer border-none bg-transparent transition-all shrink-0">
                      <Pencil size={13} />
                    </button>
                  </div>
                )}
                {respuestas[p.id] && editando !== p.id && (
                  <div className="mt-3 pt-3 border-t border-[#f0f0f0]">
                    <p className="text-[10px] font-bold text-[#bbb] uppercase tracking-widest mb-1">Respuesta del cliente</p>
                    <p className="text-sm text-[#555] leading-relaxed">{respuestas[p.id]}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Referencias */}
      <div>
        <h3 className="text-sm font-bold text-[#1c1c1c] mb-1">Referencias</h3>
        <p className="text-xs text-[#888] mb-4">Links o imágenes de inspiración para la marca.</p>

        {/* Input */}
        <div className="bg-white border border-[#e8e8e8] rounded-[16px] p-5 mb-4">
          <div className="flex flex-col gap-2">
            <input
              type="url"
              value={nuevoLink}
              onChange={e => setNuevoLink(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregarRef()}
              placeholder="Pegá un link (URL, Pinterest, Behance…)"
              className="w-full px-3 py-2.5 border border-[#e0e0e0] rounded-[8px] text-sm outline-none focus:border-[#1c1c1c] transition-colors"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevaDesc}
                onChange={e => setNuevaDesc(e.target.value)}
                placeholder="Descripción opcional"
                className="flex-1 px-3 py-2 border border-[#e0e0e0] rounded-[8px] text-sm outline-none focus:border-[#1c1c1c] transition-colors"
              />
              <button
                onClick={agregarRef}
                className="flex items-center gap-1.5 bg-[#1c1c1c] text-white px-4 py-2 rounded-[8px] text-sm font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity shrink-0">
                <Plus size={14} /> Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Lista */}
        {referencias.length > 0 && (
          <div className="flex flex-col gap-2">
            {referencias.map(r => (
              <div key={r.id} className="bg-white border border-[#e8e8e8] rounded-[12px] p-4 flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-[6px] bg-[#f5f5f5] flex items-center justify-center shrink-0">
                  <Link size={14} className="text-[#888]" />
                </div>
                <div className="flex-1 min-w-0">
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-[#1c1c1c] font-medium truncate block hover:underline no-underline">
                    {r.url}
                  </a>
                  {r.descripcion && <p className="text-xs text-[#888] mt-0.5">{r.descripcion}</p>}
                </div>
                <button
                  onClick={() => eliminarRef(r.id)}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-[#ccc] hover:text-red-400 rounded-[6px] cursor-pointer border-none bg-transparent transition-all shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
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
const NAV_TOP = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
]
const NAV_LINKS = [
  { key: 'brief',       label: 'Brief',       icon: FileText },
  { key: 'exploracion', label: 'Exploración', icon: Palette },
  { key: 'finalista',   label: 'Finalistas',  icon: Star },
  { key: 'manual',      label: 'Manual',      icon: BookOpen },
]

// ── Sidebar ──────────────────────────────────────────────────
function Sidebar({ cuenta, proyecto, proyectos, panel, onPanel, onProyecto, onLogout }) {
  const [selectorOpen, setSelectorOpen] = useState(false)

  return (
    <aside className="w-[288px] shrink-0 bg-white border-r-2 border-[#f1f1f1] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-8 h-[72px] flex items-center border-b border-[#f1f1f1]">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-[26px] w-auto" />
      </div>

      {/* Proyecto selector */}
      <div className="px-4 py-3 border-b border-[#f1f1f1] relative">
        <button
          onClick={() => setSelectorOpen(v => !v)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] hover:bg-[#f5f5f5] transition-colors bg-transparent border-none cursor-pointer text-left">
          <div className="w-10 h-10 rounded-full bg-[#726d76] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {proyecto.nombre?.[0]?.toUpperCase() || 'M'}
          </div>
          <span className="text-sm font-semibold text-[#1c1c1c] truncate flex-1">{proyecto.nombre}</span>
          <ChevronDown size={14} className={`text-[#aaa] shrink-0 transition-transform ${selectorOpen ? 'rotate-180' : ''}`} />
        </button>

        {selectorOpen && (
          <div className="absolute left-4 right-4 top-[58px] bg-white rounded-[12px] shadow-xl border border-[#e8e8e8] py-1.5 z-50">
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
      <nav className="flex-1 py-4 flex flex-col gap-4">
        <div>
          {NAV_TOP.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onPanel(key)}
              className={`relative w-full flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium cursor-pointer border-none transition-colors text-left bg-transparent
                ${panel === key ? 'text-[#111] font-semibold' : 'text-[#666] hover:text-[#111]'}`}>
              {panel === key && <span className="absolute left-0 top-[15%] bottom-[15%] w-1 bg-[#111] rounded-r-[4px]" />}
              <Icon size={15} className="shrink-0" />
              {label}
            </button>
          ))}
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#bbb] uppercase tracking-widest px-5 mb-2">Links</p>
          {NAV_LINKS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onPanel(key)}
              className={`relative w-full flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium cursor-pointer border-none transition-colors text-left bg-transparent
                ${panel === key ? 'text-[#111] font-semibold' : 'text-[#666] hover:text-[#111]'}`}>
              {panel === key && <span className="absolute left-0 top-[15%] bottom-[15%] w-1 bg-[#111] rounded-r-[4px]" />}
              <Icon size={15} className="shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* User + logout */}
      <div className="px-6 py-6 border-t border-[#e3e3e3]">
        <div className="flex items-center gap-3 pt-3">
          <div className="w-10 h-10 rounded-full bg-[#726d76] shrink-0" />
          <div className="min-w-0">
            <p className="text-[11.2px] text-[#484848] truncate">{cuenta.nombre}</p>
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

// ── Main layout ──────────────────────────────────────────────
function ProyectoLayout({ cuenta, proyectoInicial, proyectos }) {
  const navigate = useNavigate()
  const [proyecto, setProyecto] = useState(proyectoInicial)
  const [panel, setPanel] = useState('dashboard')
  const [stats, setStats] = useState({ vistas: 0, respuestas: 0, pedidos: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const handlePanel = (key) => { setPanel(key); setSidebarOpen(false) }

  return (
    <div className="flex min-h-screen bg-[#f5f5f3]">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed md:sticky top-0 z-40 h-screen transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          cuenta={cuenta}
          proyecto={proyecto}
          proyectos={proyectos}
          panel={panel}
          onPanel={handlePanel}
          onProyecto={handleProyecto}
          onLogout={handleLogout}
        />
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto md:ml-0">
        {/* Mobile topbar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#f1f1f1] md:hidden sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-[8px] hover:bg-[#f5f5f5] bg-transparent border-none cursor-pointer">
            <Menu size={20} className="text-[#1c1c1c]" />
          </button>
          <img src="/logo-ordo.svg" alt="ORDO" className="h-5 w-auto" />
          <span className="text-sm font-semibold text-[#1c1c1c] truncate">{proyecto.nombre}</span>
        </div>
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

    const { data: cuentas } = await db.from('cuentas_marca').select('*').eq('user_id', user.id).limit(1)
    const cuenta = cuentas?.[0]
    if (!cuenta) { navigate('/marca/admin'); return }

    const { data: proyectos } = await db
      .from('proyectos_marca')
      .select('*')
      .eq('cuenta_id', cuenta.id)
      .neq('estado', 'archivado')

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
