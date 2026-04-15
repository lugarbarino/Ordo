import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Upload, ExternalLink, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { db, SUPABASE_URL } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'

function Label({ children }) {
  return <label className="block text-xs font-semibold text-[#666] uppercase tracking-wide mb-1.5">{children}</label>
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 text-sm border border-[#e3e3e3] rounded-lg outline-none focus:border-[#aaa] bg-white"
    />
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-[#e3e3e3] p-5 ${className}`}>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return <div className="text-xs font-bold text-[#aaa] uppercase tracking-widest mb-4">{children}</div>
}

// ─── Subir archivo a Supabase Storage ────────────────────────────────────────
async function subirArchivo(file, bucket, path) {
  const { error } = await db.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}

// ─── Logo actual ─────────────────────────────────────────────────────────────
function LogoActualSection({ proyectoId, assets, onReload }) {
  const ref = useRef()
  const [subiendo, setSubiendo] = useState(false)
  const [label, setLabel] = useState('')
  const logoActual = assets.find(a => a.tipo === 'logo_actual' && !a.opcion_id)

  useEffect(() => {
    if (logoActual) setLabel(logoActual.label || '')
  }, [logoActual])

  const subir = async (file) => {
    setSubiendo(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${proyectoId}/logo-actual.${ext}`
      const url = await subirArchivo(file, 'marca-assets', path)
      if (logoActual) {
        await db.from('assets_marca').update({ url, label }).eq('id', logoActual.id)
      } else {
        await db.from('assets_marca').insert({ proyecto_id: proyectoId, tipo: 'logo_actual', url, label })
      }
      onReload()
    } finally {
      setSubiendo(false)
    }
  }

  const guardarLabel = async () => {
    if (!logoActual) return
    await db.from('assets_marca').update({ label }).eq('id', logoActual.id)
    onReload()
  }

  return (
    <Card>
      <SectionTitle>Logo actual del cliente</SectionTitle>
      <div className="flex gap-4 items-start">
        <div
          className="w-24 h-24 border-2 border-dashed border-[#e3e3e3] rounded-xl flex items-center justify-center cursor-pointer hover:border-[#aaa] transition-colors flex-shrink-0 overflow-hidden"
          onClick={() => ref.current?.click()}
        >
          {logoActual
            ? <img src={logoActual.url} alt="Logo actual" className="max-h-full max-w-full object-contain p-2" />
            : <Upload size={20} className="text-[#ddd]" />
          }
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <Label>Descripción (opcional)</Label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              onBlur={guardarLabel}
              placeholder="Contexto sobre el logo actual…"
              className="w-full px-3 py-2 text-sm border border-[#e3e3e3] rounded-lg outline-none focus:border-[#aaa] bg-white"
            />
          </div>
          <button
            onClick={() => ref.current?.click()}
            disabled={subiendo}
            className="text-xs text-[#888] hover:text-[#111] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            {subiendo ? 'Subiendo…' : logoActual ? 'Cambiar archivo' : 'Subir logo'}
          </button>
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*,.svg" className="hidden"
        onChange={e => subir(e.target.files[0])} />
    </Card>
  )
}

// ─── Opción individual ────────────────────────────────────────────────────────
function OpcionCard({ opcion, proyectoId, assets, colores, tipografias, onReload, onDelete }) {
  const [form, setForm] = useState({
    nombre: opcion.nombre || '',
    tagline: opcion.tagline || '',
    descripcion: opcion.descripcion || '',
    atributo: opcion.atributo || '',
    es_propuesta: opcion.es_propuesta || false,
    es_finalista: opcion.es_finalista || false,
    es_elegida: opcion.es_elegida || false,
  })
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [subiendo, setSubiendo] = useState({})
  const refs = { isotipo: useRef(), logotipo: useRef(), imagotipo_h: useRef(), imagotipo_v: useRef(), thumbnail: useRef(), mockup: useRef() }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const guardar = async () => {
    setSaving(true)
    await db.from('opciones_marca').update(form).eq('id', opcion.id)
    setSaving(false)
    onReload()
  }

  const subirAsset = async (file, tipo) => {
    setSubiendo(s => ({ ...s, [tipo]: true }))
    try {
      const ext = file.name.split('.').pop()
      const path = `${proyectoId}/${opcion.id}/${tipo}-${Date.now()}.${ext}`
      const url = await subirArchivo(file, 'marca-assets', path)
      const existing = assets.find(a => a.tipo === tipo)
      if (existing) {
        await db.from('assets_marca').update({ url }).eq('id', existing.id)
      } else {
        await db.from('assets_marca').insert({ proyecto_id: proyectoId, opcion_id: opcion.id, tipo, url })
      }
      onReload()
    } finally {
      setSubiendo(s => ({ ...s, [tipo]: false }))
    }
  }

  const subirUrlPng = async (file, assetId) => {
    const ext = file.name.split('.').pop()
    const path = `${proyectoId}/${opcion.id}/png-${Date.now()}.${ext}`
    const url = await subirArchivo(file, 'marca-assets', path)
    await db.from('assets_marca').update({ url_png: url }).eq('id', assetId)
    onReload()
  }

  // Colores
  const [newColor, setNewColor] = useState({ nombre: '', hex: '#000000', rol: 'dark' })
  const agregarColor = async () => {
    await db.from('colores_marca').insert({ proyecto_id: proyectoId, opcion_id: opcion.id, ...newColor })
    setNewColor({ nombre: '', hex: '#000000', rol: 'dark' })
    onReload()
  }
  const eliminarColor = async (id) => {
    await db.from('colores_marca').delete().eq('id', id)
    onReload()
  }

  // Tipografía
  const [newTipo, setNewTipo] = useState({ tipo: 'primary', nombre_fuente: '', pesos: [] })
  const agregarTipo = async () => {
    if (!newTipo.nombre_fuente.trim()) return
    await db.from('tipografias_marca').insert({ proyecto_id: proyectoId, opcion_id: opcion.id, ...newTipo })
    setNewTipo({ tipo: 'primary', nombre_fuente: '', pesos: [] })
    onReload()
  }
  const eliminarTipo = async (id) => {
    await db.from('tipografias_marca').delete().eq('id', id)
    onReload()
  }

  const logoTipos = ['isotipo', 'logotipo', 'imagotipo_h', 'imagotipo_v']

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div>
          <div className="font-semibold text-sm">{form.nombre || 'Sin nombre'}</div>
          <div className="flex gap-2 mt-1">
            {form.es_propuesta && <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">Propuesta</span>}
            {form.es_finalista && <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">Finalista</span>}
            {form.es_elegida && <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-600 rounded-full font-medium">Elegida</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="text-[#ccc] hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none p-1">
            <Trash2 size={14} />
          </button>
          {open ? <ChevronUp size={16} className="text-[#aaa]" /> : <ChevronDown size={16} className="text-[#aaa]" />}
        </div>
      </div>

      {open && (
        <div className="mt-5 space-y-6 border-t border-[#f1f1f1] pt-5">
          {/* Datos */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Opción A" /></div>
              <div><Label>Tagline</Label><Input value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Slogan o concepto" /></div>
            </div>
            <div><Label>Atributo</Label><Input value={form.atributo} onChange={e => set('atributo', e.target.value)} placeholder="Ej: Moderno · Confiable" /></div>
            <div>
              <Label>Descripción</Label>
              <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                rows={2} placeholder="Concepto detrás de esta opción…"
                className="w-full px-3 py-2 text-sm border border-[#e3e3e3] rounded-lg outline-none focus:border-[#aaa] resize-none bg-white" />
            </div>
            {/* Flags */}
            <div className="flex gap-4">
              {[['es_propuesta', 'Propuesta'], ['es_finalista', 'Finalista'], ['es_elegida', 'Elegida (manual)']].map(([k, l]) => (
                <label key={k} className="flex items-center gap-1.5 text-sm text-[#555] cursor-pointer">
                  <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)}
                    className="accent-[#191A23]" />
                  {l}
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={guardar} disabled={saving}
                className="px-4 py-2 rounded-lg bg-[#191A23] text-white text-xs font-medium cursor-pointer disabled:opacity-50 border-none">
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>

          {/* Logos */}
          <div>
            <Label>Logos</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {logoTipos.map(tipo => {
                const asset = assets.find(a => a.tipo === tipo)
                const pngRef = useRef()
                return (
                  <div key={tipo} className="flex flex-col gap-1.5">
                    <div
                      className="aspect-square border-2 border-dashed border-[#e3e3e3] rounded-xl flex items-center justify-center cursor-pointer hover:border-[#aaa] transition-colors overflow-hidden bg-[#fafafa]"
                      onClick={() => refs[tipo].current?.click()}
                    >
                      {asset
                        ? <img src={asset.url} alt={tipo} className="max-h-full max-w-full object-contain p-2" />
                        : subiendo[tipo] ? <span className="text-[10px] text-[#aaa]">Subiendo…</span>
                        : <Upload size={16} className="text-[#ddd]" />
                      }
                    </div>
                    <span className="text-[10px] text-[#888] text-center capitalize">{tipo.replace('_', ' ')}</span>
                    {asset && (
                      <button onClick={() => pngRef.current?.click()}
                        className="text-[10px] text-[#aaa] hover:text-[#555] cursor-pointer bg-transparent border-none p-0 text-center">
                        {asset.url_png ? '✓ PNG' : '+ PNG'}
                      </button>
                    )}
                    <input ref={refs[tipo]} type="file" accept="image/*,.svg" className="hidden"
                      onChange={e => subirAsset(e.target.files[0], tipo)} />
                    {asset && <input ref={pngRef} type="file" accept="image/png" className="hidden"
                      onChange={e => subirUrlPng(e.target.files[0], asset.id)} />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Thumbnail */}
          <div>
            <Label>Thumbnail (para exploración)</Label>
            <div
              className="w-32 h-32 border-2 border-dashed border-[#e3e3e3] rounded-xl flex items-center justify-center cursor-pointer hover:border-[#aaa] overflow-hidden"
              onClick={() => refs.thumbnail.current?.click()}
            >
              {assets.find(a => a.tipo === 'thumbnail')
                ? <img src={assets.find(a => a.tipo === 'thumbnail').url} alt="thumb" className="w-full h-full object-cover" />
                : <Upload size={16} className="text-[#ddd]" />
              }
            </div>
            <input ref={refs.thumbnail} type="file" accept="image/*" className="hidden"
              onChange={e => subirAsset(e.target.files[0], 'thumbnail')} />
          </div>

          {/* Mockups */}
          <div>
            <Label>Mockups</Label>
            <div className="flex gap-3 flex-wrap">
              {assets.filter(a => a.tipo === 'mockup').map(m => (
                <div key={m.id} className="relative">
                  <img src={m.url} alt="mockup" className="w-24 h-24 object-cover rounded-xl border border-[#e3e3e3]" />
                  <button
                    onClick={async () => { await db.from('assets_marca').delete().eq('id', m.id); onReload() }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-[#e3e3e3] flex items-center justify-center cursor-pointer text-[#aaa] hover:text-red-500"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
              <div
                className="w-24 h-24 border-2 border-dashed border-[#e3e3e3] rounded-xl flex items-center justify-center cursor-pointer hover:border-[#aaa]"
                onClick={() => refs.mockup.current?.click()}
              >
                {subiendo.mockup ? <span className="text-[10px] text-[#aaa]">…</span> : <Plus size={18} className="text-[#ddd]" />}
              </div>
            </div>
            <input ref={refs.mockup} type="file" accept="image/*" className="hidden"
              onChange={e => subirAsset(e.target.files[0], 'mockup')} />
          </div>

          {/* Colores */}
          <div>
            <Label>Paleta de colores</Label>
            <div className="space-y-2 mb-3">
              {colores.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border border-black/10 flex-shrink-0" style={{ background: c.hex }} />
                  <span className="text-sm flex-1">{c.nombre} <span className="text-[#aaa] font-mono text-xs">{c.hex}</span></span>
                  <button onClick={() => eliminarColor(c.id)}
                    className="text-[#ccc] hover:text-red-500 cursor-pointer bg-transparent border-none p-1"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-end">
              <div>
                <Label>Color</Label>
                <input type="color" value={newColor.hex} onChange={e => setNewColor(c => ({ ...c, hex: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-[#e3e3e3] cursor-pointer" />
              </div>
              <div className="flex-1">
                <Label>Nombre</Label>
                <Input value={newColor.nombre} onChange={e => setNewColor(c => ({ ...c, nombre: e.target.value }))} placeholder="Dark, Accent…" />
              </div>
              <div>
                <Label>Rol</Label>
                <select value={newColor.rol} onChange={e => setNewColor(c => ({ ...c, rol: e.target.value }))}
                  className="px-3 py-2.5 text-sm border border-[#e3e3e3] rounded-lg outline-none bg-white">
                  {['dark','medium','light','accent'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button onClick={agregarColor}
                className="px-3 py-2.5 rounded-lg bg-[#191A23] text-white text-sm cursor-pointer border-none flex-shrink-0">
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* Tipografía */}
          <div>
            <Label>Tipografía</Label>
            <div className="space-y-2 mb-3">
              {tipografias.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-[#f1f1f1]">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{t.nombre_fuente}</span>
                    <span className="text-xs text-[#aaa] ml-2">{t.tipo === 'primary' ? 'Principal' : 'Secundaria'}</span>
                  </div>
                  <button onClick={() => eliminarTipo(t.id)}
                    className="text-[#ccc] hover:text-red-500 cursor-pointer bg-transparent border-none p-1"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-end">
              <div>
                <Label>Tipo</Label>
                <select value={newTipo.tipo} onChange={e => setNewTipo(t => ({ ...t, tipo: e.target.value }))}
                  className="px-3 py-2.5 text-sm border border-[#e3e3e3] rounded-lg outline-none bg-white">
                  <option value="primary">Principal</option>
                  <option value="secondary">Secundaria</option>
                </select>
              </div>
              <div className="flex-1">
                <Label>Nombre de fuente</Label>
                <Input value={newTipo.nombre_fuente} onChange={e => setNewTipo(t => ({ ...t, nombre_fuente: e.target.value }))}
                  placeholder="Ej: Chivo, Inter…" />
              </div>
              <button onClick={agregarTipo}
                className="px-3 py-2.5 rounded-lg bg-[#191A23] text-white text-sm cursor-pointer border-none flex-shrink-0">
                <Plus size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function ProyectoEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [proyecto, setProyecto] = useState(null)
  const [opciones, setOpciones] = useState([])
  const [assets, setAssets] = useState([])
  const [colores, setColores] = useState([])
  const [tipografias, setTipografias] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargar() }, [id])

  const cargar = async () => {
    setLoading(true)
    const { data: p } = await db.from('proyectos_marca').select('*, empresas(nombre, slug)').eq('id', id).single()
    setProyecto(p)
    const { data: opts } = await db.from('opciones_marca').select('*').eq('proyecto_id', id).order('created_at')
    setOpciones(opts || [])
    const { data: ass } = await db.from('assets_marca').select('*').eq('proyecto_id', id)
    setAssets(ass || [])
    const { data: cols } = await db.from('colores_marca').select('*').eq('proyecto_id', id)
    setColores(cols || [])
    const { data: tips } = await db.from('tipografias_marca').select('*').eq('proyecto_id', id)
    setTipografias(tips || [])
    setLoading(false)
  }

  const agregarOpcion = async () => {
    const { data } = await db.from('opciones_marca').insert({
      proyecto_id: id,
      nombre: 'Nueva opción',
      es_propuesta: true,
    }).select().single()
    setOpciones(o => [...o, data])
  }

  const eliminarOpcion = async (opcionId) => {
    if (!confirm('¿Eliminar esta opción?')) return
    await db.from('opciones_marca').delete().eq('id', opcionId)
    cargar()
  }

  if (loading) return <div className="text-[#888] text-sm">Cargando…</div>
  if (!proyecto) return <div className="text-[#888] text-sm">Proyecto no encontrado</div>

  const slug = proyecto.empresas?.slug

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/admin/proyectos')}
            className="text-xs text-[#888] hover:text-[#111] cursor-pointer bg-transparent border-none p-0 mb-2">
            ← Proyectos
          </button>
          <h1 className="text-xl font-bold">{proyecto.nombre}</h1>
          <p className="text-sm text-[#888]">{proyecto.empresas?.nombre}</p>
        </div>
        {slug && (
          <div className="flex flex-col gap-1.5 text-right">
            <a href={`/${slug}/exploracion`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#888] hover:text-[#111] transition-colors">
              <ExternalLink size={11} /> Exploración
            </a>
            <a href={`/${slug}/finalistas`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#888] hover:text-[#111] transition-colors">
              <ExternalLink size={11} /> Finalistas
            </a>
            <a href={`/${slug}/manual`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#888] hover:text-[#111] transition-colors">
              <ExternalLink size={11} /> Manual
            </a>
          </div>
        )}
      </div>

      {/* Logo actual */}
      <LogoActualSection
        proyectoId={id}
        assets={assets.filter(a => !a.opcion_id)}
        onReload={cargar}
      />

      {/* Opciones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle>Opciones de marca</SectionTitle>
          <button onClick={agregarOpcion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#191A23] text-white text-xs font-medium cursor-pointer border-none">
            <Plus size={13} /> Agregar opción
          </button>
        </div>

        {opciones.length === 0 && (
          <div className="text-sm text-[#aaa] text-center py-8 border border-dashed border-[#e3e3e3] rounded-xl">
            Agregá las propuestas y finalistas de marca
          </div>
        )}

        {opciones.map(op => (
          <OpcionCard
            key={op.id}
            opcion={op}
            proyectoId={id}
            assets={assets.filter(a => a.opcion_id === op.id)}
            colores={colores.filter(c => c.opcion_id === op.id)}
            tipografias={tipografias.filter(t => t.opcion_id === op.id)}
            onReload={cargar}
            onDelete={() => eliminarOpcion(op.id)}
          />
        ))}
      </div>
    </div>
  )
}

