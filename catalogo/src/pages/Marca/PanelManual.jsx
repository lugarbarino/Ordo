import { useState, useEffect, useRef } from 'react'
import { Upload, Plus, Trash2, Check, X, Image, ExternalLink, Download } from 'lucide-react'
import { db, SUPABASE_URL } from '../../lib/supabase'
import { Button } from '../../components/admin/ui/Button'
import { Input } from '../../components/admin/ui/Input'
import { Card } from '../../components/admin/ui/Card'

// ── Upload helpers ────────────────────────────────────────────
function subirArchivo(proyectoId, file) {
  const ext = file.name.split('.').pop()
  const path = `manual/${proyectoId}/${Date.now()}.${ext}`
  return db.storage.from('banners').upload(path, file, { upsert: true }).then(({ error }) => {
    if (error) throw error
    return `${SUPABASE_URL}/storage/v1/object/public/banners/${path}`
  })
}

async function descargarArchivo(url, nombre) {
  const res = await fetch(url)
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nombre
  a.click()
  URL.revokeObjectURL(a.href)
}

async function downloadPng(url, nombre) {
  const res = await fetch(url)
  const svgText = await res.text()
  const blob = new Blob([svgText], { type: 'image/svg+xml' })
  const objUrl = URL.createObjectURL(blob)
  const img = new window.Image()
  img.onload = () => {
    const ratio = (img.naturalWidth && img.naturalHeight) ? img.naturalWidth / img.naturalHeight : 1
    const w = 1200; const h = Math.round(1200 / ratio)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `${nombre}.png`
    a.click()
    URL.revokeObjectURL(objUrl)
  }
  img.src = objUrl
}

// ── Logo slot ─────────────────────────────────────────────────
function LogoSlot({ url, onUrl, proyectoId, dark, nombreBase }) {
  const ref = useRef()
  const [loading, setLoading] = useState(false)
  const [dlLoading, setDlLoading] = useState('')

  const handleFile = async (file) => {
    if (!file?.name.endsWith('.svg')) { alert('Solo se aceptan archivos SVG'); return }
    setLoading(true)
    try { onUrl(await subirArchivo(proyectoId, file)) }
    catch (e) { alert('Error: ' + e.message) }
    finally { setLoading(false) }
  }

  const handleDl = async (tipo) => {
    setDlLoading(tipo)
    try {
      if (tipo === 'svg') await descargarArchivo(url, `${nombreBase}.svg`)
      else await downloadPng(url, nombreBase)
    } catch { alert('Error al descargar') }
    finally { setDlLoading('') }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        onClick={() => !loading && !url && ref.current?.click()}
        className={`relative w-full h-[100px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors group
          ${url ? 'border-transparent cursor-default' : 'cursor-pointer hover:border-[#bbb]'}
          ${dark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-[#f5f5f5] border-[#e0e0e0]'}`}
      >
        {url ? (
          <>
            <img src={url} alt="" className="max-h-[76px] max-w-[80%] object-contain" />
            <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="sm" variant="secondary" onClick={e => { e.stopPropagation(); ref.current?.click() }}>
                <Upload size={12} />
              </Button>
              <Button size="sm" variant="danger" onClick={e => { e.stopPropagation(); onUrl('') }}>
                <X size={12} />
              </Button>
            </div>
          </>
        ) : loading ? (
          <div className="w-5 h-5 rounded-full border-2 border-[#ccc] border-t-[#666] animate-spin" />
        ) : (
          <>
            <Upload size={15} className={dark ? 'text-[#444]' : 'text-[#ccc]'} />
            <p className={`text-[10px] ${dark ? 'text-[#444]' : 'text-[#ccc]'}`}>SVG</p>
          </>
        )}
      </div>
      {url && (
        <div className="flex gap-1">
          {[['svg','SVG'], ['png','PNG']].map(([tipo, label]) => (
            <Button key={tipo} size="sm" variant="secondary" className="flex-1 !text-[10px]"
              loading={dlLoading === tipo} onClick={() => handleDl(tipo)}>
              <Download size={10} /> {label}
            </Button>
          ))}
        </div>
      )}
      <input ref={ref} type="file" accept=".svg,image/svg+xml" className="hidden" onChange={e => handleFile(e.target.files[0])} />
    </div>
  )
}

// ── ColorRow ──────────────────────────────────────────────────
function ColorRow({ color, onChange, onDelete }) {
  return (
    <Card className="flex items-center gap-3 p-3">
      <div className="relative w-10 h-10 rounded-lg shrink-0 overflow-hidden border border-[#e0e0e0] cursor-pointer" style={{ background: color.hex }}>
        <input type="color" value={color.hex} onChange={e => onChange({ ...color, hex: e.target.value })}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
      </div>
      <Input value={color.hex} onChange={e => onChange({ ...color, hex: e.target.value })}
        className="w-24 font-mono uppercase text-xs" placeholder="#000000" />
      <Input value={color.nombre} onChange={e => onChange({ ...color, nombre: e.target.value })}
        className="flex-1" placeholder="Ej: Azul principal" />
      <Input value={color.uso} onChange={e => onChange({ ...color, uso: e.target.value })}
        className="flex-1 text-[#888]" placeholder="Ej: Color primario" />
      <Button variant="ghost" size="sm" onClick={onDelete} className="text-[#ccc] hover:text-red-500 shrink-0">
        <Trash2 size={14} />
      </Button>
    </Card>
  )
}

// ── TipoRow ───────────────────────────────────────────────────
function TipoRow({ tipo, onChange, onDelete, proyectoId }) {
  const fontRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [dlLoading, setDlLoading] = useState(false)

  const handleFontFile = async (file) => {
    setUploading(true)
    try { onChange({ ...tipo, archivo_url: await subirArchivo(proyectoId, file), archivo_nombre: file.name }) }
    catch (e) { alert('Error: ' + e.message) }
    finally { setUploading(false) }
  }

  return (
    <Card className="flex items-start gap-3 p-4">
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex gap-2">
          <Input value={tipo.nombre} onChange={e => onChange({ ...tipo, nombre: e.target.value })}
            className="flex-1 font-semibold" placeholder="Nombre (ej: Inter)" />
          <Input value={tipo.uso} onChange={e => onChange({ ...tipo, uso: e.target.value })}
            className="flex-1 text-[#888]" placeholder="Uso (ej: Títulos)" />
        </div>
        <div className="flex gap-2">
          <Input value={tipo.url} onChange={e => onChange({ ...tipo, url: e.target.value })}
            className="flex-1 text-[#888] text-xs" placeholder="URL Google Fonts (opcional)" />
          {tipo.archivo_url ? (
            <Button size="sm" variant="secondary" loading={dlLoading}
              onClick={async () => { setDlLoading(true); await descargarArchivo(tipo.archivo_url, tipo.archivo_nombre || 'fuente').catch(() => alert('Error')); setDlLoading(false) }}>
              <Download size={12} /> {tipo.archivo_nombre?.split('.').pop()?.toUpperCase() || 'Fuente'}
            </Button>
          ) : (
            <Button size="sm" variant="secondary" loading={uploading} onClick={() => fontRef.current?.click()}>
              <Upload size={12} /> Subir fuente
            </Button>
          )}
        </div>
        {tipo.nombre && (
          <p className="text-3xl text-[#1c1c1c] leading-tight px-1 mt-1" style={{ fontFamily: `'${tipo.nombre}', sans-serif` }}>
            Aa Bb Cc 123
          </p>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={onDelete} className="text-[#ccc] hover:text-red-500 shrink-0 mt-0.5">
        <Trash2 size={14} />
      </Button>
      <input ref={fontRef} type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={e => handleFontFile(e.target.files[0])} />
    </Card>
  )
}

// ── UsoRow ────────────────────────────────────────────────────
function UsoRow({ uso, onChange, onDelete, proyectoId, tipo }) {
  const ref = useRef()
  const [loading, setLoading] = useState(false)
  const isOk = tipo === 'correcto'

  const handleFile = async (file) => {
    setLoading(true)
    try { onChange({ ...uso, imagen_url: await subirArchivo(proyectoId, file) }) }
    catch (e) { alert('Error: ' + e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className={`p-3 rounded-xl border flex gap-3 items-start ${isOk ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isOk ? 'bg-green-500' : 'bg-red-500'}`}>
        {isOk ? <Check size={11} className="text-white" /> : <X size={11} className="text-white" />}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <Input value={uso.texto} onChange={e => onChange({ ...uso, texto: e.target.value })}
          placeholder={isOk ? 'Ej: Usar sobre fondo blanco' : 'Ej: No deformar el logo'} />
        {uso.imagen_url ? (
          <div className="relative">
            <img src={uso.imagen_url} alt="" className="w-full max-h-[120px] object-contain rounded-xl bg-white border border-[#e3e3e3]" />
            <Button size="sm" variant="danger" onClick={() => onChange({ ...uso, imagen_url: '' })}
              className="absolute top-1.5 right-1.5 !p-0.5 !rounded-full">
              <X size={10} />
            </Button>
          </div>
        ) : (
          <button onClick={() => ref.current?.click()} disabled={loading}
            className="text-xs text-[#999] flex items-center gap-1.5 bg-transparent border-none cursor-pointer hover:text-[#555] transition-colors p-0">
            {loading ? <div className="w-3 h-3 rounded-full border border-[#ccc] border-t-[#555] animate-spin" /> : <Image size={12} />}
            Agregar imagen (opcional)
          </button>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={onDelete} className="text-[#ccc] hover:text-red-500 shrink-0">
        <Trash2 size={12} />
      </Button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
    </div>
  )
}

// ── MockupGrid ────────────────────────────────────────────────
function MockupGrid({ mockups, onMockups, proyectoId }) {
  const ref = useRef()
  const [loading, setLoading] = useState(false)

  const handleFiles = async (files) => {
    setLoading(true)
    try {
      const urls = await Promise.all(Array.from(files).map(f => subirArchivo(proyectoId, f)))
      onMockups([...mockups, ...urls.map(url => ({ url, caption: '' }))])
    } catch (e) { alert('Error: ' + e.message) }
    finally { setLoading(false) }
  }

  const updateCaption = (i, caption) => { const next = [...mockups]; next[i] = { ...next[i], caption }; onMockups(next) }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {mockups.map((m, i) => (
        <div key={i} className="flex flex-col gap-1.5 group relative">
          <div className="relative w-full aspect-video bg-[#f0f0f0] rounded-xl overflow-hidden border border-[#e0e0e0]">
            <img src={m.url} alt="" className="w-full h-full object-cover" />
            <Button size="sm" variant="danger" onClick={() => onMockups(mockups.filter((_, idx) => idx !== i))}
              className="absolute top-1.5 right-1.5 !p-0.5 !rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <X size={11} />
            </Button>
          </div>
          <Input value={m.caption} onChange={e => updateCaption(i, e.target.value)} className="text-xs text-[#666]" placeholder="Descripción (opcional)" />
        </div>
      ))}
      <Button variant="secondary" loading={loading} onClick={() => ref.current?.click()}
        className="aspect-video flex-col gap-2 border-dashed !border-2">
        <Plus size={20} className="text-[#bbb]" />
        <span className="text-xs text-[#bbb]">Agregar</span>
      </Button>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
    </div>
  )
}

// ── TemplateSlot ──────────────────────────────────────────────
function TemplateSlot({ tmpl, onChange, proyectoId }) {
  const ref = useRef()
  const [loading, setLoading] = useState(false)

  const handleFile = async (file) => {
    setLoading(true)
    try { onChange({ ...tmpl, preview_url: await subirArchivo(proyectoId, file) }) }
    catch (e) { alert('Error: ' + e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col gap-2">
      {tmpl.preview_url ? (
        <div className="relative aspect-video rounded-xl overflow-hidden border border-[#e0e0e0] group cursor-pointer" onClick={() => ref.current?.click()}>
          <img src={tmpl.preview_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload size={16} className="text-white" />
          </div>
          <Button size="sm" variant="danger" onClick={e => { e.stopPropagation(); onChange({ ...tmpl, preview_url: '' }) }}
            className="absolute top-1.5 right-1.5 !p-0.5 !rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <X size={9} />
          </Button>
        </div>
      ) : (
        <Button variant="secondary" loading={loading} onClick={() => ref.current?.click()}
          className="aspect-video flex-col gap-1.5 border-dashed !border-2 w-full">
          <Upload size={15} className="text-[#ccc]" />
          <span className="text-[10px] text-[#ccc]">Preview</span>
        </Button>
      )}
      <Input value={tmpl.canva_url || ''} onChange={e => onChange({ ...tmpl, canva_url: e.target.value })}
        className="text-xs text-[#888]" placeholder="Link de Canva (opcional)" />
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────
function Section({ title, hint, children }) {
  return (
    <div className="mb-10">
      <div className="pb-3 border-b border-[#f0f0f0] mb-4">
        <h3 className="text-base font-black text-[#1c1c1c]">{title}</h3>
        {hint && <p className="text-xs text-[#999] mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

const LOGO_VARIANTS = [
  { key: 'iso_claro',    label: 'Isotipo',    sub: 'Fondo claro',  dark: false },
  { key: 'iso_oscuro',   label: 'Isotipo',    sub: 'Fondo oscuro', dark: true  },
  { key: 'texto_claro',  label: 'Solo texto', sub: 'Fondo claro',  dark: false },
  { key: 'texto_oscuro', label: 'Solo texto', sub: 'Fondo oscuro', dark: true  },
  { key: 'horiz_claro',  label: 'Horizontal', sub: 'Fondo claro',  dark: false },
  { key: 'horiz_oscuro', label: 'Horizontal', sub: 'Fondo oscuro', dark: true  },
  { key: 'vert_claro',   label: 'Vertical',   sub: 'Fondo claro',  dark: false },
  { key: 'vert_oscuro',  label: 'Vertical',   sub: 'Fondo oscuro', dark: true  },
]

const REDES = [
  { key: 'ig_post',    label: 'Instagram Post',   sub: '1080 × 1080' },
  { key: 'ig_story',   label: 'Instagram Story',  sub: '1080 × 1920' },
  { key: 'fb_portada', label: 'Facebook Portada', sub: '1640 × 924'  },
  { key: 'li_portada', label: 'LinkedIn Portada', sub: '1584 × 396'  },
  { key: 'li_post',    label: 'LinkedIn Post',    sub: '1200 × 627'  },
  { key: 'canva_1',    label: 'Template Canva 1', sub: 'Personalizado' },
  { key: 'canva_2',    label: 'Template Canva 2', sub: 'Personalizado' },
  { key: 'canva_3',    label: 'Template Canva 3', sub: 'Personalizado' },
]

// ── Main ──────────────────────────────────────────────────────
export function PanelManual({ proyecto }) {
  const [data, setData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logos, setLogos] = useState({})
  const [colores, setColores] = useState([])
  const [tipografias, setTipografias] = useState([])
  const [mockups, setMockups] = useState([])
  const [usosCorrectos, setUsosCorrectos] = useState([])
  const [usosIncorrectos, setUsosIncorrectos] = useState([])
  const [templates, setTemplates] = useState({})

  useEffect(() => { cargar() }, [proyecto.id])

  const cargar = async () => {
    const { data: rows } = await db.from('manual_marca').select('*').eq('proyecto_id', proyecto.id).limit(1)
    const row = rows?.[0]
    if (!row) return
    setData(row)
    setLogos(row.logos || {})
    setColores(row.colores || [])
    setTipografias(row.tipografias || [])
    setMockups(row.mockups || [])
    setUsosCorrectos(row.usos_correctos || [])
    setUsosIncorrectos(row.usos_incorrectos || [])
    setTemplates(row.templates || {})
  }

  const guardar = async () => {
    setSaving(true)
    const payload = { proyecto_id: proyecto.id, logos, colores, tipografias, mockups, usos_correctos: usosCorrectos, usos_incorrectos: usosIncorrectos, templates }
    if (data?.id) {
      await db.from('manual_marca').update(payload).eq('id', data.id)
    } else {
      const { data: newRow } = await db.from('manual_marca').insert(payload).select().single()
      if (newRow) setData(newRow)
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const setLogo = (key, url) => setLogos(l => ({ ...l, [key]: url }))
  const updateTemplate = (key, v) => setTemplates(t => ({ ...t, [key]: v }))

  const addColor = () => setColores(c => [...c, { hex: '#000000', nombre: '', uso: '' }])
  const updateColor = (i, v) => setColores(c => c.map((x, idx) => idx === i ? v : x))
  const removeColor = (i) => setColores(c => c.filter((_, idx) => idx !== i))

  const addTipo = () => setTipografias(t => [...t, { nombre: '', uso: '', url: '', archivo_url: '', archivo_nombre: '' }])
  const updateTipo = (i, v) => setTipografias(t => t.map((x, idx) => idx === i ? v : x))
  const removeTipo = (i) => setTipografias(t => t.filter((_, idx) => idx !== i))

  const addUso = (tipo) => {
    const item = { texto: '', imagen_url: '' }
    if (tipo === 'correcto') setUsosCorrectos(u => [...u, item])
    else setUsosIncorrectos(u => [...u, item])
  }
  const updateUso = (tipo, i, v) => {
    if (tipo === 'correcto') setUsosCorrectos(u => u.map((x, idx) => idx === i ? v : x))
    else setUsosIncorrectos(u => u.map((x, idx) => idx === i ? v : x))
  }
  const removeUso = (tipo, i) => {
    if (tipo === 'correcto') setUsosCorrectos(u => u.filter((_, idx) => idx !== i))
    else setUsosIncorrectos(u => u.filter((_, idx) => idx !== i))
  }

  const slug = proyecto.slug || proyecto.id
  const nombreMarca = proyecto.nombre?.toLowerCase().replace(/\s+/g, '-') || 'logo'

  return (
    <div className="px-8 py-6 max-w-[860px]">

      {/* Header sticky */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#f0f0f0] -mx-8 px-8 py-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-black text-[#1c1c1c]">Manual de marca</h2>
          <a href={`/marca/${slug}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#1c1c1c] no-underline transition-colors">
            <ExternalLink size={12} /> Ver manual
          </a>
        </div>
        <Button variant="primary" loading={saving} onClick={guardar}>
          {saved && !saving ? <><Check size={14} /> Guardado</> : 'Guardar'}
        </Button>
      </div>

      {/* LOGOS */}
      <Section title="Logotipo" hint="Solo SVG. El cliente puede descargar en SVG o PNG.">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6">
          {LOGO_VARIANTS.map(({ key, label, sub, dark }) => (
            <div key={key}>
              <p className="text-[11px] font-bold text-[#1c1c1c] mb-0.5">{label}</p>
              <p className="text-[10px] text-[#aaa] mb-2">{sub}</p>
              <LogoSlot url={logos[key] || ''} onUrl={url => setLogo(key, url)} proyectoId={proyecto.id} dark={dark} nombreBase={`${nombreMarca}-${key}`} />
            </div>
          ))}
        </div>
      </Section>

      {/* COLORES */}
      <Section title="Paleta de colores">
        <div className="flex flex-col gap-2">
          {colores.map((c, i) => <ColorRow key={i} color={c} onChange={v => updateColor(i, v)} onDelete={() => removeColor(i)} />)}
        </div>
        <Button variant="ghost" size="sm" onClick={addColor} className="mt-3 text-[#888]">
          <Plus size={14} /> Agregar color
        </Button>
      </Section>

      {/* TIPOGRAFÍA */}
      <Section title="Tipografía" hint="Podés subir el archivo (TTF, OTF, WOFF) para que el cliente lo descargue.">
        <div className="flex flex-col gap-3">
          {tipografias.map((t, i) => <TipoRow key={i} tipo={t} onChange={v => updateTipo(i, v)} onDelete={() => removeTipo(i)} proyectoId={proyecto.id} />)}
        </div>
        <Button variant="ghost" size="sm" onClick={addTipo} className="mt-3 text-[#888]">
          <Plus size={14} /> Agregar tipografía
        </Button>
      </Section>

      {/* MOCKUPS */}
      <Section title="Aplicaciones y mockups">
        <MockupGrid mockups={mockups} onMockups={setMockups} proyectoId={proyecto.id} />
      </Section>

      {/* USOS */}
      <Section title="Usos correctos e incorrectos">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">✓ Usos correctos</p>
            <div className="flex flex-col gap-2">
              {usosCorrectos.map((u, i) => <UsoRow key={i} uso={u} tipo="correcto" onChange={v => updateUso('correcto', i, v)} onDelete={() => removeUso('correcto', i)} proyectoId={proyecto.id} />)}
            </div>
            <Button variant="ghost" size="sm" onClick={() => addUso('correcto')} className="mt-2 text-[#888] hover:text-green-700">
              <Plus size={13} /> Agregar
            </Button>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3">✕ Usos incorrectos</p>
            <div className="flex flex-col gap-2">
              {usosIncorrectos.map((u, i) => <UsoRow key={i} uso={u} tipo="incorrecto" onChange={v => updateUso('incorrecto', i, v)} onDelete={() => removeUso('incorrecto', i)} proyectoId={proyecto.id} />)}
            </div>
            <Button variant="ghost" size="sm" onClick={() => addUso('incorrecto')} className="mt-2 text-[#888] hover:text-red-600">
              <Plus size={13} /> Agregar
            </Button>
          </div>
        </div>
      </Section>

      {/* TEMPLATES REDES */}
      <Section title="Templates para redes sociales" hint="Subí un preview de cada template y/o el link de Canva para que el cliente lo edite.">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {REDES.map(({ key, label, sub }) => (
            <div key={key} className="flex flex-col gap-1">
              <p className="text-[11px] font-bold text-[#1c1c1c]">{label}</p>
              <p className="text-[10px] text-[#aaa] mb-1">{sub}</p>
              <TemplateSlot tmpl={templates[key] || { preview_url: '', canva_url: '' }} onChange={v => updateTemplate(key, v)} proyectoId={proyecto.id} />
            </div>
          ))}
        </div>
      </Section>

    </div>
  )
}
