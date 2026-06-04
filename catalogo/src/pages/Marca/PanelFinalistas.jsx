import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Upload, Check, X, ExternalLink } from 'lucide-react'
import { db, SUPABASE_URL } from '../../lib/supabase'
import { Button } from '../../components/admin/ui/Button'
import { Input } from '../../components/admin/ui/Input'

async function subirArchivo(proyectoId, file) {
  const ext = file.name.split('.').pop()
  const path = `manual/${proyectoId}/${Date.now()}.${ext}`
  const { error } = await db.storage.from('banners').upload(path, file, { upsert: true })
  if (error) throw error
  return `${SUPABASE_URL}/storage/v1/object/public/banners/${path}`
}

// ── ImageUploadGrid — grilla de imágenes con título ────────────
function ImageUploadGrid({ imagenes, onChange, proyectoId, placeholder = 'Título' }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)

  const subir = async (files) => {
    setUploading(true)
    try {
      const urls = await Promise.all(Array.from(files).map(f => subirArchivo(proyectoId, f)))
      onChange([...imagenes, ...urls.map(url => ({ url, titulo: '', dark: false }))])
    } catch (e) { alert('Error: ' + e.message) }
    finally { setUploading(false) }
  }

  const update = (i, data) => onChange(imagenes.map((x, idx) => idx === i ? { ...x, ...data } : x))
  const remove = (i) => onChange(imagenes.filter((_, idx) => idx !== i))

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {imagenes.map((img, i) => (
        <div key={i} className="flex flex-col gap-1 group">
          <div className="relative aspect-video rounded-xl overflow-hidden border border-[#e0e0e0]"
            style={{ backgroundColor: img.dark ? '#1c1c1c' : '#f5f5f5' }}>
            <img src={img.url} alt="" className="w-full h-full object-contain p-2" />
            <button onClick={() => remove(i)}
              className="absolute top-1 right-1 w-6 h-6 bg-white border border-[#e0e0e0] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-red-500 text-[#999]">
              <X size={10} />
            </button>
          </div>
          <Input value={img.titulo} onChange={e => update(i, { titulo: e.target.value })}
            placeholder={placeholder} className="text-[11px]" />
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={img.dark || false} onChange={e => update(i, { dark: e.target.checked })}
              className="w-3.5 h-3.5 accent-[#1c1c1c] cursor-pointer" />
            <span className="text-[10px] text-[#888]">Fondo oscuro</span>
          </label>
        </div>
      ))}
      <button onClick={() => ref.current?.click()} disabled={uploading}
        className="aspect-video rounded-xl border-2 border-dashed border-[#e0e0e0] flex flex-col items-center justify-center gap-1 hover:border-[#aaa] transition-colors cursor-pointer bg-transparent disabled:opacity-50">
        {uploading
          ? <div className="w-4 h-4 rounded-full border-2 border-[#ccc] border-t-[#666] animate-spin" />
          : <><Plus size={14} className="text-[#ccc]" /><span className="text-[10px] text-[#ccc]">Imagen</span></>
        }
      </button>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={e => subir(e.target.files)} />
    </div>
  )
}

// ── FinalistaItem — un finalista completo ─────────────────────
function FinalistaItem({ fin, numero, onChange, onDelete, proyectoId }) {
  const mockupRef = useRef()
  const respRef = useRef()
  const [uploadingMockup, setUploadingMockup] = useState(false)
  const [uploadingResp, setUploadingResp] = useState(false)

  const subirMockups = async (files) => {
    setUploadingMockup(true)
    try {
      const urls = await Promise.all(Array.from(files).map(f => subirArchivo(proyectoId, f)))
      onChange({ mockups: [...(fin.mockups || []), ...urls.map(url => ({ url }))] })
    } catch (e) { alert('Error: ' + e.message) }
    finally { setUploadingMockup(false) }
  }

  const subirResponsivos = async (files) => {
    setUploadingResp(true)
    try {
      const urls = await Promise.all(Array.from(files).map(f => subirArchivo(proyectoId, f)))
      onChange({ logo_responsivo: [...(fin.logo_responsivo || []), ...urls.map(url => ({ url, titulo: '', subtitulo: '' }))] })
    } catch (e) { alert('Error: ' + e.message) }
    finally { setUploadingResp(false) }
  }

  const updateResp = (i, data) => {
    const next = [...(fin.logo_responsivo || [])]
    next[i] = { ...next[i], ...data }
    onChange({ logo_responsivo: next })
  }

  const addColor = () => onChange({ colores: [...(fin.colores || []), '#000000'] })
  const updateColor = (i, hex) => onChange({ colores: (fin.colores || []).map((c, idx) => idx === i ? hex : c) })
  const removeColor = (i) => onChange({ colores: (fin.colores || []).filter((_, idx) => idx !== i) })

  return (
    <div className="flex flex-col gap-6">
      {/* Nombre del tab */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-[#1c1c1c] shrink-0">Finalista #{numero}</span>
        <Input value={fin.nombre || ''} onChange={e => onChange({ nombre: e.target.value })}
          placeholder="Nombre del tab (ej: Opción A)" className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-[#ccc] hover:text-red-500 shrink-0">
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Concepto */}
      <div className="bg-[#fafafa] rounded-xl p-4 flex flex-col gap-3 border border-[#f0f0f0]">
        <p className="text-xs font-bold text-[#555] uppercase tracking-wide">Concepto</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#999] block mb-1">Atributo <span className="text-[#bbb]">(etiqueta pequeña)</span></label>
            <Input value={fin.atributo || ''} onChange={e => onChange({ atributo: e.target.value })} placeholder="Ej: Sociedad" />
          </div>
          <div>
            <label className="text-xs text-[#999] block mb-1">Tagline <span className="text-[#bbb]">(título grande)</span></label>
            <Input value={fin.tagline || ''} onChange={e => onChange({ tagline: e.target.value })} placeholder="Ej: Conexión moderna" />
          </div>
        </div>
        <div>
          <label className="text-xs text-[#999] block mb-1">Frase destacada</label>
          <Input value={fin.concepto || ''} onChange={e => onChange({ concepto: e.target.value })} placeholder="Ej: que impulsa el avance." />
        </div>
        <div>
          <label className="text-xs text-[#999] block mb-1">Descripción</label>
          <textarea value={fin.descripcion || ''} onChange={e => onChange({ descripcion: e.target.value })}
            rows={3} placeholder="Describí el concepto del logo..."
            className="w-full border border-[#e3e3e3] rounded-xl px-3 py-2 text-sm text-[#1c1c1c] resize-none focus:outline-none focus:border-[#1c1c1c]" />
        </div>
      </div>

      {/* Logos */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-[#555] uppercase tracking-wide">Logos</p>
        <p className="text-xs text-[#aaa]">Activá "Fondo oscuro" para las versiones sobre negro.</p>
        <ImageUploadGrid
          imagenes={fin.logos || []}
          onChange={v => onChange({ logos: v })}
          proyectoId={proyectoId}
          placeholder="Ej: Logo claro, Logo oscuro"
        />
      </div>

      {/* Colores */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-[#555] uppercase tracking-wide">Paleta de colores</p>
        <div className="flex items-center gap-2 flex-wrap">
          {(fin.colores || []).map((hex, i) => (
            <div key={i} className="flex flex-col items-center gap-1 group">
              <div className="relative w-10 h-10 rounded-full border border-[#e0e0e0] overflow-hidden cursor-pointer" style={{ background: hex }}>
                <input type="color" value={hex} onChange={e => updateColor(i, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </div>
              <button onClick={() => removeColor(i)}
                className="text-[10px] text-[#ccc] hover:text-red-400 bg-transparent border-none cursor-pointer p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={10} />
              </button>
            </div>
          ))}
          <button onClick={addColor}
            className="w-10 h-10 rounded-full border-2 border-dashed border-[#e0e0e0] flex items-center justify-center hover:border-[#aaa] transition-colors cursor-pointer bg-transparent">
            <Plus size={14} className="text-[#ccc]" />
          </button>
        </div>
      </div>

      {/* Tipografía */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-[#555] uppercase tracking-wide">Tipografía</p>
        <Input value={fin.tipografia || ''} onChange={e => onChange({ tipografia: e.target.value })}
          placeholder="Nombre de la fuente (ej: Chivo, Playfair Display...)" />
      </div>

      {/* Mockups */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-[#555] uppercase tracking-wide">Mockups / contexto</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {(fin.mockups || []).map((m, i) => (
            <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-[#e0e0e0] bg-[#f5f5f5]">
              <img src={m.url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => onChange({ mockups: fin.mockups.filter((_, idx) => idx !== i) })}
                className="absolute top-1 right-1 w-6 h-6 bg-white border border-[#e0e0e0] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-red-500 text-[#999]">
                <X size={10} />
              </button>
            </div>
          ))}
          <button onClick={() => mockupRef.current?.click()} disabled={uploadingMockup}
            className="aspect-video rounded-xl border-2 border-dashed border-[#e0e0e0] flex flex-col items-center justify-center gap-1 hover:border-[#aaa] transition-colors cursor-pointer bg-transparent disabled:opacity-50">
            {uploadingMockup
              ? <div className="w-4 h-4 rounded-full border-2 border-[#ccc] border-t-[#666] animate-spin" />
              : <><Plus size={14} className="text-[#ccc]" /><span className="text-[10px] text-[#ccc]">Mockup</span></>
            }
          </button>
          <input ref={mockupRef} type="file" accept="image/*" multiple className="hidden" onChange={e => subirMockups(e.target.files)} />
        </div>
      </div>

      {/* Logo responsivo */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-[#555] uppercase tracking-wide">Logo responsivo</p>
        <p className="text-xs text-[#aaa]">Versiones del logo (isotipo, logotipo, imagotipo h, imagotipo v).</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {(fin.logo_responsivo || []).map((lr, i) => (
            <div key={i} className="flex flex-col gap-1 group">
              <div className="relative aspect-square rounded-xl overflow-hidden border border-[#e0e0e0] bg-[#f5f5f5] flex items-center justify-center p-3">
                <img src={lr.url} alt="" className="max-w-full max-h-full object-contain" />
                <button onClick={() => onChange({ logo_responsivo: (fin.logo_responsivo || []).filter((_, idx) => idx !== i) })}
                  className="absolute top-1 right-1 w-6 h-6 bg-white border border-[#e0e0e0] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-red-500 text-[#999]">
                  <X size={10} />
                </button>
              </div>
              <Input value={lr.titulo} onChange={e => updateResp(i, { titulo: e.target.value })} placeholder="Ej: Isotipo" className="text-[11px]" />
              <Input value={lr.subtitulo} onChange={e => updateResp(i, { subtitulo: e.target.value })} placeholder="Ej: Sólo símbolo" className="text-[10px]" />
            </div>
          ))}
          <button onClick={() => respRef.current?.click()} disabled={uploadingResp}
            className="aspect-square rounded-xl border-2 border-dashed border-[#e0e0e0] flex flex-col items-center justify-center gap-1 hover:border-[#aaa] transition-colors cursor-pointer bg-transparent disabled:opacity-50">
            {uploadingResp
              ? <div className="w-4 h-4 rounded-full border-2 border-[#ccc] border-t-[#666] animate-spin" />
              : <><Plus size={14} className="text-[#ccc]" /><span className="text-[10px] text-[#ccc]">Variante</span></>
            }
          </button>
          <input ref={respRef} type="file" accept="image/*" multiple className="hidden" onChange={e => subirResponsivos(e.target.files)} />
        </div>
      </div>
    </div>
  )
}

// ── PanelFinalistas ───────────────────────────────────────────
export function PanelFinalistas({ proyecto }) {
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [finalistas, setFinalistas] = useState([])
  const [tab, setTab]           = useState(0)

  useEffect(() => { cargar() }, [proyecto.id])

  const cargar = async () => {
    const { data } = await db.from('proyectos_marca').select('finalistas').eq('id', proyecto.id).single()
    setFinalistas(data?.finalistas || [])
    setLoading(false)
  }

  const guardar = async () => {
    setSaving(true)
    await db.from('proyectos_marca').update({ finalistas }).eq('id', proyecto.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const add = () => {
    const nuevo = { id: Date.now().toString(), nombre: '', atributo: '', tagline: '', concepto: '', descripcion: '', logos: [], colores: [], tipografia: '', mockups: [], logo_responsivo: [] }
    setFinalistas(prev => [...prev, nuevo])
    setTab(finalistas.length)
  }

  const update = (id, data) => setFinalistas(prev => prev.map(f => f.id === id ? { ...f, ...data } : f))
  const remove = (id) => {
    setFinalistas(prev => prev.filter(f => f.id !== id))
    setTab(t => Math.max(0, t - 1))
  }

  if (loading) return (
    <div className="p-8 flex justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[#e3e3e3] border-t-[#1c1c1c] animate-spin" />
    </div>
  )

  const fin = finalistas[tab]

  return (
    <div className="max-w-[860px] px-8 py-8">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1c1c1c] mb-1">Finalistas</h2>
          <p className="text-sm text-[#888]">Presentá las propuestas finalistas al cliente.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a href={`/marca/${proyecto.slug || proyecto.id}/finalista`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1c1c1c] border border-[#e8e8e8] bg-white px-3 py-2 rounded-[8px] no-underline hover:border-[#ccc] transition-colors">
            <ExternalLink size={13} /> Ver link del cliente
          </a>
          <Button variant="dark" loading={saving} onClick={guardar}>
            {saved && !saving ? <><Check size={14} /> Guardado</> : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      {finalistas.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {finalistas.map((f, i) => (
            <button key={f.id} onClick={() => setTab(i)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer
                ${tab === i ? 'bg-[#1c1c1c] text-white border-[#1c1c1c]' : 'bg-white text-[#666] border-[#e8e8e8] hover:border-[#1c1c1c]'}`}>
              {f.nombre || `Finalista #${i + 1}`}
            </button>
          ))}
          <Button variant="secondary" size="sm" onClick={add} className="gap-1">
            <Plus size={12} /> Agregar
          </Button>
        </div>
      )}

      {/* Contenido */}
      <div className="bg-white border border-[#ececec] rounded-2xl p-6">
        {finalistas.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-sm text-[#bbb]">Todavía no hay finalistas.</p>
            <Button variant="secondary" onClick={add} className="gap-2 text-xs">
              <Plus size={14} /> Agregar finalista
            </Button>
          </div>
        ) : fin ? (
          <FinalistaItem
            key={fin.id}
            fin={fin}
            numero={tab + 1}
            proyectoId={proyecto.id}
            onChange={data => update(fin.id, data)}
            onDelete={() => remove(fin.id)}
          />
        ) : null}
      </div>
    </div>
  )
}
