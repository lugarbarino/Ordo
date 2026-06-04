import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Upload, Check, X, Image, ExternalLink } from 'lucide-react'
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

// ── OpcionItem ────────────────────────────────────────────────
function OpcionItem({ opcion, numero, onChange, onDelete, proyectoId }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)

  const subirImagenes = async (files) => {
    setUploading(true)
    try {
      const urls = await Promise.all(Array.from(files).map(f => subirArchivo(proyectoId, f)))
      onChange({ imagenes: [...(opcion.imagenes || []), ...urls.map(url => ({ url, titulo: '' }))] })
    } catch (e) { alert('Error al subir: ' + e.message) }
    finally { setUploading(false) }
  }

  const updateImg = (i, data) => {
    const next = [...(opcion.imagenes || [])]
    next[i] = { ...next[i], ...data }
    onChange({ imagenes: next })
  }
  const removeImg = (i) => onChange({ imagenes: opcion.imagenes.filter((_, idx) => idx !== i) })

  return (
    <div className="flex flex-col gap-3 pb-6 border-b border-[#f0f0f0] last:border-0 last:pb-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-[#1c1c1c] shrink-0">Opción #{numero}</span>
        <Input value={opcion.titulo} onChange={e => onChange({ titulo: e.target.value })}
          placeholder="Título (ej: Minimalista, Bold, Clásica...)" className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-[#ccc] hover:text-red-500 shrink-0">
          <Trash2 size={14} />
        </Button>
      </div>

      <textarea
        value={opcion.descripcion}
        onChange={e => onChange({ descripcion: e.target.value })}
        placeholder="Descripción breve de esta propuesta (enfoque, estilo, sensación...)."
        rows={2}
        className="w-full border border-[#e3e3e3] rounded-xl px-3 py-2 text-sm text-[#1c1c1c] resize-none focus:outline-none focus:border-[#1c1c1c]"
      />

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {(opcion.imagenes || []).map((img, i) => (
          <div key={i} className="flex flex-col gap-1 group">
            <div className="relative aspect-square bg-[#f5f5f5] rounded-xl overflow-hidden border border-[#e0e0e0]">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImg(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-white border border-[#e0e0e0] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-[#999]">
                <X size={11} />
              </button>
            </div>
            <Input value={img.titulo} onChange={e => updateImg(i, { titulo: e.target.value })}
              placeholder="Ej: Variante A" className="text-[11px]" />
          </div>
        ))}

        <button onClick={() => ref.current?.click()} disabled={uploading}
          className="aspect-square rounded-xl border-2 border-dashed border-[#e0e0e0] flex flex-col items-center justify-center gap-1.5 hover:border-[#aaa] transition-colors cursor-pointer bg-transparent disabled:opacity-50">
          {uploading
            ? <div className="w-4 h-4 rounded-full border-2 border-[#ccc] border-t-[#666] animate-spin" />
            : <><Plus size={16} className="text-[#ccc]" /><span className="text-[10px] text-[#ccc]">Imagen</span></>
          }
        </button>
        <input ref={ref} type="file" accept="image/*" multiple className="hidden"
          onChange={e => subirImagenes(e.target.files)} />
      </div>
    </div>
  )
}

// ── PanelExploracion ──────────────────────────────────────────
export function PanelExploracion({ proyecto }) {
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [esRebranding, setEsRebranding] = useState(false)
  const [logoActual, setLogoActual] = useState({ url: '', descripcion: '' })
  const [opciones, setOpciones]     = useState([])
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoRef = useRef()

  useEffect(() => { cargar() }, [proyecto.id])

  const cargar = async () => {
    const { data } = await db.from('proyectos_marca').select('exploracion').eq('id', proyecto.id).single()
    const exp = data?.exploracion
    if (exp) {
      setEsRebranding(exp.es_rebranding || false)
      setLogoActual(exp.logo_actual || { url: '', descripcion: '' })
      setOpciones(exp.opciones || [])
    }
    setLoading(false)
  }

  const guardar = async () => {
    setSaving(true)
    await db.from('proyectos_marca')
      .update({ exploracion: { es_rebranding: esRebranding, logo_actual: logoActual, opciones } })
      .eq('id', proyecto.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const subirLogoActual = async (file) => {
    if (!file) return
    setUploadingLogo(true)
    try {
      const url = await subirArchivo(proyecto.id, file)
      setLogoActual(prev => ({ ...prev, url }))
    } catch (e) { alert('Error: ' + e.message) }
    finally { setUploadingLogo(false) }
  }

  const addOpcion = () => setOpciones(prev => [
    ...prev, { id: Date.now().toString(), titulo: '', descripcion: '', imagenes: [] }
  ])
  const updateOpcion = (id, data) => setOpciones(prev => prev.map(o => o.id === id ? { ...o, ...data } : o))
  const removeOpcion = (id) => setOpciones(prev => prev.filter(o => o.id !== id))

  if (loading) return (
    <div className="p-8 flex justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[#e3e3e3] border-t-[#1c1c1c] animate-spin" />
    </div>
  )

  return (
    <div className="max-w-[860px] px-8 py-8">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1c1c1c] mb-1">Exploración</h2>
          <p className="text-sm text-[#888]">Presentá las propuestas al cliente para que vote y dé feedback.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a href={`/marca/${proyecto.slug || proyecto.id}/exploracion`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1c1c1c] border border-[#e8e8e8] bg-white px-3 py-2 rounded-[8px] no-underline hover:border-[#ccc] transition-colors">
            <ExternalLink size={13} /> Ver link del cliente
          </a>
          <Button variant="dark" loading={saving} onClick={guardar}>
            {saved && !saving ? <><Check size={14} /> Guardado</> : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Rebranding */}
      <div className="mb-6 bg-white border border-[#ececec] rounded-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f0] mb-5">
          <div>
            <h3 className="text-base font-black text-[#1c1c1c]">¿Es un rebranding?</h3>
            <p className="text-xs text-[#999] mt-0.5">Activá si el cliente ya tiene un logo existente.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input type="checkbox" className="sr-only peer" checked={esRebranding} onChange={e => setEsRebranding(e.target.checked)} />
            <div className="w-11 h-6 bg-[#e0e0e0] rounded-full peer peer-checked:bg-[#1c1c1c] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>

        {esRebranding && (
          <div className="flex items-start gap-4">
            <label className="cursor-pointer shrink-0 group">
              <div className="w-36 h-24 rounded-xl border-2 border-dashed border-[#e0e0e0] bg-[#fafafa] flex items-center justify-center overflow-hidden hover:border-[#aaa] transition-colors relative">
                {uploadingLogo ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#ccc] border-t-[#666] animate-spin" />
                ) : logoActual.url ? (
                  <>
                    <img src={logoActual.url} alt="logo actual" className="max-h-full max-w-full object-contain p-3" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                      <Upload size={14} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <Image size={16} className="text-[#ccc]" />
                    <span className="text-[10px] text-[#ccc]">Logo actual</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => subirLogoActual(e.target.files[0])} />
            </label>

            <div className="flex flex-col gap-2 flex-1">
              <Input
                value={logoActual.descripcion}
                onChange={e => setLogoActual(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="¿Por qué se hace el rebranding? Ej: No transmite el potencial del estudio."
              />
              {logoActual.url && (
                <Button variant="ghost" size="sm" onClick={() => setLogoActual(prev => ({ ...prev, url: '' }))} className="text-[#ccc] hover:text-red-500 self-start">
                  <Trash2 size={12} /> Eliminar imagen
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Opciones */}
      <div className="mb-6 bg-white border border-[#ececec] rounded-2xl p-6">
        <div className="pb-4 border-b border-[#f0f0f0] mb-5">
          <h3 className="text-base font-black text-[#1c1c1c]">Opciones de logo</h3>
          <p className="text-xs text-[#999] mt-0.5">Cada opción puede tener varias imágenes (variantes A, B, C...).</p>
        </div>

        <div className="flex flex-col gap-6">
          {opciones.length === 0 && (
            <p className="text-sm text-[#bbb]">Todavía no hay opciones. Agregá la primera.</p>
          )}
          {opciones.map((op, i) => (
            <OpcionItem
              key={op.id}
              opcion={op}
              numero={i + 1}
              proyectoId={proyecto.id}
              onChange={data => updateOpcion(op.id, data)}
              onDelete={() => removeOpcion(op.id)}
            />
          ))}
          <Button variant="secondary" onClick={addOpcion} className="self-start gap-2 text-xs">
            <Plus size={14} /> Agregar opción
          </Button>
        </div>
      </div>

    </div>
  )
}
