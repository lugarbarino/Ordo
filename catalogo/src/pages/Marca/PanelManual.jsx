import { useState, useEffect, useRef } from 'react'
import { Upload, Plus, Trash2, Check, X, Image, ExternalLink, Download, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { db, SUPABASE_URL } from '../../lib/supabase'
import { Button } from '../../components/admin/ui/Button'
import { Input } from '../../components/admin/ui/Input'
import { Card } from '../../components/admin/ui/Card'
import { PexelsPicker } from '../../components/PexelsPicker'

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
function LogoSlot({ url, onUrl, proyectoId, dark, darkBg = '#1a1a1a', nombreBase }) {
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
          ${dark ? 'border-transparent' : 'bg-[#f5f5f5] border-[#e0e0e0]'}`}
          style={dark ? { backgroundColor: darkBg } : {}}
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
            <Upload size={15} className={dark ? 'text-white/20' : 'text-[#ccc]'} />
            <p className={`text-[10px] ${dark ? 'text-white/20' : 'text-[#ccc]'}`}>SVG</p>
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

// ── Reorder buttons ───────────────────────────────────────────
function ReorderBtns({ onUp, onDown, disableUp, disableDown }) {
  return (
    <div className="flex flex-col gap-0.5 shrink-0">
      <button onClick={onUp} disabled={disableUp}
        className="p-0.5 rounded text-[#ccc] hover:text-[#555] disabled:opacity-20 cursor-pointer disabled:cursor-default bg-transparent border-none">
        <ChevronUp size={14} />
      </button>
      <button onClick={onDown} disabled={disableDown}
        className="p-0.5 rounded text-[#ccc] hover:text-[#555] disabled:opacity-20 cursor-pointer disabled:cursor-default bg-transparent border-none">
        <ChevronDown size={14} />
      </button>
    </div>
  )
}

// ── ColorRow ──────────────────────────────────────────────────
function ColorRow({ color, onChange, onDelete, onUp, onDown, isFirst, isLast, onSetAcento, onSetDark, onSetLight }) {
  return (
    <Card className="flex items-center gap-3 p-3">
      <ReorderBtns onUp={onUp} onDown={onDown} disableUp={isFirst} disableDown={isLast} />
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
      <button
        onClick={() => onSetAcento(!color.esAcento)}
        title="Marcar como color de acento"
        className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors cursor-pointer
          ${color.esAcento ? 'bg-[#1c1c1c] text-white border-[#1c1c1c]' : 'bg-transparent text-[#bbb] border-[#e3e3e3] hover:border-[#999] hover:text-[#555]'}`}>
        Acento
      </button>
      <button
        onClick={() => onSetDark(!color.esDark)}
        title="Marcar como color oscuro de fondo"
        className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors cursor-pointer
          ${color.esDark ? 'bg-[#363645] text-white border-[#363645]' : 'bg-transparent text-[#bbb] border-[#e3e3e3] hover:border-[#999] hover:text-[#555]'}`}>
        Dark
      </button>
      <button
        onClick={() => onSetLight(!color.esLight)}
        title="Marcar como color claro de fondo"
        className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors cursor-pointer
          ${color.esLight ? 'bg-[#ececf0] text-[#363645] border-[#ececf0]' : 'bg-transparent text-[#bbb] border-[#e3e3e3] hover:border-[#999] hover:text-[#555]'}`}>
        Light
      </button>
      <Button variant="ghost" size="sm" onClick={onDelete} className="text-[#ccc] hover:text-red-500 shrink-0">
        <Trash2 size={14} />
      </Button>
    </Card>
  )
}

// Extrae nombre de fuente desde URL de Google Fonts
// https://fonts.google.com/specimen/Playfair+Display → "Playfair Display"
function extractGoogleFontName(url) {
  if (!url) return ''
  try {
    const match = url.match(/specimen\/([^/?#]+)/) || url.match(/family=([^:&]+)/)
    if (match) return decodeURIComponent(match[1].replace(/\+/g, ' '))
  } catch {}
  return ''
}

// Inyecta link de Google Fonts en el <head> si no existe ya
function loadGoogleFont(nombre) {
  if (!nombre) return
  const id = `gfont-${nombre.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(nombre)}:wght@400;700&display=swap`
  document.head.appendChild(link)
}

// ── TipoRow ───────────────────────────────────────────────────
function TipoRow({ tipo, onChange, onDelete, onUp, onDown, isFirst, isLast, proyectoId }) {
  const fontRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [dlLoading, setDlLoading] = useState(false)

  // Auto-carga la fuente de Google Fonts cuando hay nombre
  useEffect(() => {
    if (tipo.nombre) loadGoogleFont(tipo.nombre)
  }, [tipo.nombre])

  const handleFontFile = async (file) => {
    setUploading(true)
    try { onChange({ ...tipo, archivo_url: await subirArchivo(proyectoId, file), archivo_nombre: file.name }) }
    catch (e) { alert('Error: ' + e.message) }
    finally { setUploading(false) }
  }

  const handleUrlChange = (url) => {
    const nombre = extractGoogleFontName(url)
    onChange({ ...tipo, url, ...(nombre ? { nombre } : {}) })
    if (nombre) loadGoogleFont(nombre)
  }

  return (
    <Card className="flex items-start gap-3 p-4">
      <ReorderBtns onUp={onUp} onDown={onDown} disableUp={isFirst} disableDown={isLast} />
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex gap-2">
          <Input value={tipo.nombre} onChange={e => { onChange({ ...tipo, nombre: e.target.value }); loadGoogleFont(e.target.value) }}
            className="flex-1 font-semibold" placeholder="Nombre (ej: Inter)" />
          <Input value={tipo.uso} onChange={e => onChange({ ...tipo, uso: e.target.value })}
            className="flex-1 text-[#888]" placeholder="Uso (ej: Títulos)" />
        </div>
        <div className="flex gap-2">
          <Input value={tipo.url} onChange={e => handleUrlChange(e.target.value)}
            className="flex-1 text-[#888] text-xs" placeholder="Pegá el link de Google Fonts (se autodetecta el nombre)" />
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
        <textarea
          value={tipo.frase || ''}
          onChange={e => onChange({ ...tipo, frase: e.target.value })}
          placeholder="Frase para mostrar en el manual (opcional). Ej: una frase del rubro de la marca."
          rows={2}
          className="w-full border border-[#e3e3e3] rounded-xl px-3 py-2 text-sm text-[#1c1c1c] resize-none focus:outline-none focus:border-[#1c1c1c]"
        />
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

// ── TemplateItem — una imagen + link Canva ────────────────────
function TemplateItem({ item, onChange, onDelete, proyectoId }) {
  const ref = useRef()
  const [loading, setLoading] = useState(false)

  const handleFile = async (file) => {
    setLoading(true)
    try { onChange({ ...item, preview_url: await subirArchivo(proyectoId, file) }) }
    catch (e) { alert('Error: ' + e.message) }
    finally { setLoading(false) }
  }

  return (
    <Card className="flex flex-col gap-2 p-3">
      {item.preview_url ? (
        <div className="relative aspect-video rounded-lg overflow-hidden border border-[#e0e0e0] group cursor-pointer" onClick={() => ref.current?.click()}>
          <img src={item.preview_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload size={14} className="text-white" />
          </div>
        </div>
      ) : (
        <Button variant="secondary" loading={loading} onClick={() => ref.current?.click()}
          className="aspect-video flex-col gap-1 border-dashed !border-2 w-full">
          <Upload size={14} className="text-[#ccc]" />
          <span className="text-[10px] text-[#ccc]">Preview</span>
        </Button>
      )}
      <Input value={item.canva_url || ''} onChange={e => onChange({ ...item, canva_url: e.target.value })}
        className="text-xs text-[#888]" placeholder="Link de Canva (opcional)" />
      <Button variant="ghost" size="sm" onClick={onDelete} className="text-[#ccc] hover:text-red-500 self-end -mt-1">
        <Trash2 size={12} /> Eliminar
      </Button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
    </Card>
  )
}

// ── TemplateCategoria ─────────────────────────────────────────
function TemplateCategoria({ label, items, onChange, proyectoId }) {
  const addItem = () => onChange([...items, { preview_url: '', canva_url: '' }])
  const updateItem = (i, v) => onChange(items.map((x, idx) => idx === i ? v : x))
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i))

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-[#666] uppercase tracking-wide">{label}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <TemplateItem key={i} item={item} onChange={v => updateItem(i, v)} onDelete={() => removeItem(i)} proyectoId={proyectoId} />
        ))}
        <Button variant="secondary" onClick={addItem}
          className="aspect-video flex-col gap-1.5 border-dashed !border-2">
          <Plus size={16} className="text-[#ccc]" />
          <span className="text-xs text-[#ccc]">Agregar</span>
        </Button>
      </div>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────
function Section({ title, hint, children }) {
  return (
    <div className="mb-6 bg-white border border-[#ececec] rounded-2xl p-6">
      <div className="pb-4 border-b border-[#f0f0f0] mb-5">
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

const TEMPLATE_CATS = [
  { key: 'foto',      label: 'Foto de perfil' },
  { key: 'portada',   label: 'Portada'        },
  { key: 'posts',     label: 'Posts'          },
  { key: 'brochure',  label: 'Brochure / Impreso' },
  { key: 'otro',      label: 'Otro'           },
]

// ── Main ──────────────────────────────────────────────────────
export function PanelManual({ proyecto }) {
  const [data, setData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pexelsOpen, setPexelsOpen] = useState(false)
  const [logos, setLogos] = useState({})
  const [tematica, setTematica] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [atributo, setAtributo] = useState('')
  const [tagline, setTagline] = useState('')
  const [concepto, setConcepto] = useState('')
  const [descripcion, setDescripcion] = useState('')
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
    setTematica(row.tematica || '')
    setVideoUrl(row.video_url || '')
    setAtributo(row.atributo || '')
    setTagline(row.tagline || '')
    setConcepto(row.concepto || '')
    setDescripcion(row.descripcion || '')
    setColores(row.colores || [])
    setTipografias(row.tipografias || [])
    setMockups(row.mockups || [])
    setUsosCorrectos(row.usos_correctos || [])
    setUsosIncorrectos(row.usos_incorrectos || [])
    setTemplates(row.templates || { foto: [], portada: [], posts: [] })
  }

  const guardar = async () => {
    setSaving(true)
    const payload = { proyecto_id: proyecto.id, logos, tematica, video_url: videoUrl, atributo, tagline, concepto, descripcion, colores, tipografias, mockups, usos_correctos: usosCorrectos, usos_incorrectos: usosIncorrectos, templates }
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
  const updateTemplatesCat = (key, items) => setTemplates(t => ({ ...t, [key]: items }))

  const move = (setter, i, dir) => setter(arr => {
    const next = [...arr]
    const j = i + dir
    if (j < 0 || j >= next.length) return arr
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
  })

  const addColor = () => setColores(c => [...c, { hex: '#000000', nombre: '', uso: '' }])
  const updateColor = (i, v) => setColores(c => c.map((x, idx) => idx === i ? v : x))
  const removeColor = (i) => setColores(c => c.filter((_, idx) => idx !== i))
  const moveColor = (i, dir) => move(setColores, i, dir)

  const addTipo = () => setTipografias(t => [...t, { nombre: '', uso: '', url: '', archivo_url: '', archivo_nombre: '', frase: '' }])
  const updateTipo = (i, v) => setTipografias(t => t.map((x, idx) => idx === i ? v : x))
  const removeTipo = (i) => setTipografias(t => t.filter((_, idx) => idx !== i))
  const moveTipo = (i, dir) => move(setTipografias, i, dir)

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
  const darkColor = colores.find(c => c.esDark)
  const darkBg = darkColor?.hex ? (darkColor.hex.startsWith('#') ? darkColor.hex : `#${darkColor.hex}`) : '#1a1a1a'

  return (
    <div className="max-w-[860px] px-8 py-8">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1c1c1c] mb-1">Manual de marca</h2>
          <p className="text-sm text-[#888]">Logos, colores, tipografía y más para entregar al cliente.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a href={`/marca/${slug}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1c1c1c] border border-[#e8e8e8] bg-white px-3 py-2 rounded-[8px] no-underline hover:border-[#ccc] transition-colors">
            <ExternalLink size={13} /> Ver link del cliente
          </a>
          <Button variant="dark" loading={saving} onClick={guardar}>
            {saved && !saving ? <><Check size={14} /> Guardado</> : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* HERO */}
      <Section title="Hero del manual" hint="Temática y video de fondo para la portada pública.">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-[#555] mb-1">Temática de la marca</p>
            <p className="text-[11px] text-[#aaa] mb-2">Describí el rubro, estilo y valores. Ej: "estudio jurídico, profesional, confianza, modernidad".</p>
            <textarea
              value={tematica}
              onChange={e => setTematica(e.target.value)}
              placeholder="Ej: agencia de diseño, creativa, joven, minimalista..."
              rows={3}
              className="w-full border border-[#e3e3e3] rounded-xl px-3 py-2 text-sm text-[#1c1c1c] resize-none focus:outline-none focus:border-[#1c1c1c]"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#555] mb-1">Video de fondo</p>
            <div className="flex gap-2 items-start">
              <Input
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://videos.pexels.com/video-files/..."
                className="flex-1"
              />
              <Button size="sm" variant="secondary" onClick={() => setPexelsOpen(true)}>
                <Search size={13} /> Pexels
              </Button>
            </div>
            {videoUrl && (
              <video src={videoUrl} muted className="mt-2 w-full max-h-[100px] object-cover rounded-xl" />
            )}
          </div>
        </div>
      </Section>

      {/* CONCEPTO */}
      <Section title="Concepto de la marca" hint="Intro que aparece debajo del hero junto al logo.">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#555] mb-1">Tag / etiqueta <span className="font-normal text-[#aaa]">(texto rojo pequeño arriba)</span></p>
              <Input value={atributo} onChange={e => setAtributo(e.target.value)} placeholder="Ej: ATRIBUTO, CONCEPTO, ESENCIA..." />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#555] mb-1">Palabra principal <span className="font-normal text-[#aaa]">(título grande)</span></p>
              <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Ej: Sociedad, Confianza, Innovación..." />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#555] mb-1">Frase destacada <span className="font-normal text-[#aaa]">(subtítulo en negrita)</span></p>
            <Input value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej: Conexión moderna que impulsa el avance." />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#555] mb-1">Descripción del concepto <span className="font-normal text-[#aaa]">(párrafo)</span></p>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Describí el concepto detrás del logo: qué representa, sus formas, valores que transmite..."
              rows={4}
              className="w-full border border-[#e3e3e3] rounded-xl px-3 py-2 text-sm text-[#1c1c1c] resize-none focus:outline-none focus:border-[#1c1c1c]"
            />
          </div>
        </div>
      </Section>

      {/* LOGOS */}
      <Section title="Logotipo" hint="Solo SVG. El cliente puede descargar en SVG o PNG.">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6">
          {LOGO_VARIANTS.map(({ key, label, sub, dark }) => (
            <div key={key}>
              <p className="text-[11px] font-bold text-[#1c1c1c] mb-0.5">{label}</p>
              <p className="text-[10px] text-[#aaa] mb-2">{sub}</p>
              <LogoSlot url={logos[key] || ''} onUrl={url => setLogo(key, url)} proyectoId={proyecto.id} dark={dark} darkBg={darkBg} nombreBase={`${nombreMarca}-${key}`} />
            </div>
          ))}
        </div>
      </Section>

      {/* COLORES */}
      <Section title="Paleta de colores">
        <div className="flex flex-col gap-2">
          {colores.map((c, i) => <ColorRow key={i} color={c} onChange={v => updateColor(i, v)} onDelete={() => removeColor(i)} onUp={() => moveColor(i, -1)} onDown={() => moveColor(i, 1)} isFirst={i === 0} isLast={i === colores.length - 1} onSetAcento={v => setColores(cs => cs.map((x, idx) => ({ ...x, esAcento: v ? idx === i : false })))} onSetDark={v => setColores(cs => cs.map((x, idx) => ({ ...x, esDark: v ? idx === i : false })))} onSetLight={v => setColores(cs => cs.map((x, idx) => ({ ...x, esLight: v ? idx === i : false })))} />)}
        </div>
        <Button variant="ghost" size="sm" onClick={addColor} className="mt-3 text-[#888]">
          <Plus size={14} /> Agregar color
        </Button>
      </Section>

      {/* TIPOGRAFÍA */}
      <Section title="Tipografía" hint="Podés subir el archivo (TTF, OTF, WOFF) para que el cliente lo descargue.">
        <div className="flex flex-col gap-3">
          {tipografias.map((t, i) => <TipoRow key={i} tipo={t} onChange={v => updateTipo(i, v)} onDelete={() => removeTipo(i)} onUp={() => moveTipo(i, -1)} onDown={() => moveTipo(i, 1)} isFirst={i === 0} isLast={i === tipografias.length - 1} proyectoId={proyecto.id} />)}
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

      {/* DIFUSIÓN */}
      <Section title="Difusión" hint="Redes sociales, brochures, impreso y cualquier pieza de comunicación. Preview + link de Canva.">
        <div className="flex flex-col gap-8">
          {TEMPLATE_CATS.map(({ key, label }) => (
            <TemplateCategoria
              key={key}
              label={label}
              items={templates[key] || []}
              onChange={items => updateTemplatesCat(key, items)}
              proyectoId={proyecto.id}
            />
          ))}
        </div>
      </Section>

      <PexelsPicker
        open={pexelsOpen}
        onClose={() => setPexelsOpen(false)}
        onSelect={({ url }) => setVideoUrl(url)}
      />

    </div>
  )
}
