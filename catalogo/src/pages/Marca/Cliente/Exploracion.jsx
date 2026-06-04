import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { db, SUPABASE_URL } from '../../../lib/supabase'
import { Check, Upload, X, ZoomIn } from 'lucide-react'

function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
      onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border-none cursor-pointer">
        <X size={18} />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl cursor-default"
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}

async function subirArchivo(proyectoId, file) {
  const ext = file.name.split('.').pop()
  const path = `exploracion/${proyectoId}/${Date.now()}.${ext}`
  const { error } = await db.storage.from('banners').upload(path, file, { upsert: true })
  if (error) throw error
  return `${SUPABASE_URL}/storage/v1/object/public/banners/${path}`
}

export default function ClienteExploracion() {
  const { nombre } = useParams()
  const [proyecto, setProyecto]       = useState(null)
  const [exp, setExp]                 = useState(null)
  const [feedbackId, setFeedbackId]   = useState(null)
  const [votos, setVotos]             = useState([])
  const [comentario, setComentario]   = useState('')
  const [referencias, setReferencias] = useState([])
  const [cargando, setCargando]       = useState(true)
  const [guardando, setGuardando]     = useState(false)
  const [guardado, setGuardado]       = useState(false)
  const [uploadingRef, setUploadingRef] = useState(false)
  const [error, setError]             = useState('')
  const [acento, setAcento]   = useState('#c63f3f')
  const [darkBg, setDarkBg]   = useState('#363645')
  const [lightBg, setLightBg] = useState('#f3f4f5')
  const [lightbox, setLightbox] = useState(null) // { src, alt }
  const refInput = useRef()

  useEffect(() => { cargar() }, [nombre])

  const cargar = async () => {
    setCargando(true)
    const { data: rows } = await db.from('proyectos_marca').select('id, nombre, exploracion').eq('slug', nombre).limit(1)
    const p = rows?.[0]
    if (!p || !p.exploracion) { setError('No hay exploración disponible aún.'); setCargando(false); return }
    setProyecto(p)
    setExp(p.exploracion)
    document.title = `${p.nombre} — Exploración`

    const { data: manualRows } = await db.from('manual_marca').select('colores').eq('proyecto_id', p.id).limit(1)
    const colores = manualRows?.[0]?.colores || []
    const colorAcento = colores.find(c => c.esAcento) || colores[0]
    const colorDark   = colores.find(c => c.esDark)
    const colorLight  = colores.find(c => c.esLight)
    if (colorAcento?.hex) setAcento(colorAcento.hex.startsWith('#') ? colorAcento.hex : `#${colorAcento.hex}`)
    if (colorDark?.hex)   setDarkBg(colorDark.hex.startsWith('#') ? colorDark.hex : `#${colorDark.hex}`)
    if (colorLight?.hex)  setLightBg(colorLight.hex.startsWith('#') ? colorLight.hex : `#${colorLight.hex}`)

    const { data: fb } = await db.from('exploracion_feedback').select('*').eq('proyecto_id', p.id).order('created_at', { ascending: false }).limit(1)
    if (fb?.[0]) {
      setFeedbackId(fb[0].id)
      setVotos(fb[0].votos || [])
      setComentario(fb[0].comentario || '')
      setReferencias(fb[0].referencias || [])
    }
    setCargando(false)
  }

  const toggleVoto = (id) => setVotos(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id])

  const subirReferencia = async (file) => {
    if (!file) return
    setUploadingRef(true)
    try {
      const url = await subirArchivo(proyecto.id, file)
      setReferencias(prev => [...prev, { url }])
    } catch (e) { alert('Error al subir: ' + e.message) }
    finally { setUploadingRef(false) }
  }

  const guardar = async () => {
    setGuardando(true)
    const payload = { proyecto_id: proyecto.id, votos, comentario, referencias }
    if (feedbackId) {
      await db.from('exploracion_feedback').update(payload).eq('id', feedbackId)
    } else {
      const { data } = await db.from('exploracion_feedback').insert(payload).select().single()
      if (data) setFeedbackId(data.id)
    }
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  if (cargando) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-[#e3e3e3] border-t-[#363645] animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 p-8">
      <p className="text-[#888] text-sm">{error}</p>
    </div>
  )

  const opciones = exp?.opciones || []

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-[#f0f0f0]">
        <p className="text-sm font-semibold tracking-wide" style={{ color: darkBg }}>{proyecto?.nombre}</p>
        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ backgroundColor: acento + '18', color: acento }}>
          Exploración
        </span>
      </header>

      {/* ── Rebranding ── */}
      {exp?.es_rebranding && (
        <section className="py-20 px-6 md:px-16 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-[3px] mb-4" style={{ color: acento }}>Re Branding</p>
              <h2 className="text-5xl font-light mb-5 leading-tight" style={{ color: darkBg }}>Logo actual</h2>
              {exp.logo_actual?.descripcion && (
                <p className="text-base leading-relaxed opacity-60" style={{ color: darkBg }}>{exp.logo_actual.descripcion}</p>
              )}
            </div>
            {exp.logo_actual?.url && (
              <div className="rounded-3xl p-10 flex items-center justify-center w-full md:w-96 shrink-0 border border-[#e8e8e8]">
                <img src={exp.logo_actual.url} alt="Logo actual" className="max-h-44 max-w-full object-contain" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Propuestas ── */}
      <section className="py-20 px-6 md:px-16" style={{ backgroundColor: lightBg }}>
        <div className="max-w-6xl mx-auto">

          {/* título sección */}
          <div className="mb-16 text-center">
            <p className="text-xs font-bold uppercase tracking-[3px] mb-3 opacity-50" style={{ color: darkBg }}>Propuestas</p>
            <h2 className="text-5xl font-light mb-4" style={{ color: darkBg }}>Opciones de diseño</h2>
            <p className="text-sm opacity-60 max-w-md mx-auto leading-relaxed" style={{ color: darkBg }}>
              Distintas direcciones creativas para explorar. En esta etapa nos enfocamos en el estilo, no en el color final.
            </p>
          </div>

          {/* lista de opciones */}
          <div className="flex flex-col gap-20">
            {opciones.map((op, i) => (
              <div key={op.id}>
                {/* encabezado opción */}
                <div className="flex items-start gap-6 mb-8">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black shrink-0"
                    style={{ backgroundColor: darkBg + '12', color: darkBg }}>
                    #{i + 1}
                  </div>
                  <div>
                    {op.titulo && (
                      <h3 className="text-2xl font-semibold mb-1" style={{ color: darkBg }}>{op.titulo}</h3>
                    )}
                    {op.descripcion && (
                      <p className="text-sm leading-relaxed opacity-60" style={{ color: darkBg }}>{op.descripcion}</p>
                    )}
                  </div>
                </div>

                {/* imágenes */}
                {op.imagenes?.length > 0 && (
                  <div className={`grid gap-4 ${op.imagenes.length === 1 ? 'grid-cols-1 max-w-2xl' : op.imagenes.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
                    {op.imagenes.map((img, j) => (
                      <div key={j} className="flex flex-col gap-2">
                        <div
                          className="rounded-2xl overflow-hidden bg-white border border-black/5 aspect-video shadow-sm cursor-zoom-in relative group"
                          onClick={() => setLightbox({ src: img.url, alt: img.titulo || `Variante ${j + 1}` })}>
                          <img src={img.url} alt={img.titulo || `Variante ${j + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                          </div>
                        </div>
                        {img.titulo && (
                          <p className="text-xs text-center font-medium opacity-40" style={{ color: darkBg }}>{img.titulo}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feedback ── */}
      <section className="py-20 px-6 md:px-16 bg-white">
        <div className="max-w-3xl mx-auto">

          {/* título */}
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-[3px] mb-3 opacity-50" style={{ color: darkBg }}>Tu opinión</p>
            <h2 className="text-5xl font-light mb-4" style={{ color: darkBg }}>Feedback</h2>
            <p className="text-sm opacity-60 leading-relaxed" style={{ color: darkBg }}>
              Tu feedback nos ayuda a definir el rumbo para la siguiente etapa.
            </p>
          </div>

          {/* Votos */}
          {(() => {
            // armar lista de imágenes para votación
            const items = []
            opciones.forEach((op, oi) => {
              (op.imagenes || []).forEach((img, ii) => {
                if (img.paraVotacion) {
                  items.push({ id: `${op.id}_${ii}`, url: img.url, titulo: img.titulo, opcionNum: oi + 1, opcionTitulo: op.titulo })
                }
              })
            })
            if (items.length === 0) return null
            return (
              <div className="mb-14">
                <p className="text-lg font-semibold mb-1" style={{ color: darkBg }}>¿Qué opciones te gustan más?</p>
                <p className="text-sm opacity-50 mb-6" style={{ color: darkBg }}>Podés elegir más de una</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {items.map(item => {
                    const sel = votos.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleVoto(item.id)}
                        className="flex flex-col gap-2 p-3 rounded-2xl border-2 transition-all cursor-pointer text-left w-full"
                        style={{ borderColor: sel ? acento : '#e8e8e8', backgroundColor: sel ? acento + '08' : 'white' }}>
                        {/* imagen */}
                        <div className="w-full aspect-video rounded-xl overflow-hidden bg-[#f5f5f5] relative">
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all"
                            style={{ backgroundColor: sel ? acento : 'white', borderColor: sel ? acento : '#d0d0d0' }}>
                            {sel && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                        </div>
                        {/* label */}
                        <div>
                          <p className="text-xs font-semibold opacity-40" style={{ color: darkBg }}>Opción #{item.opcionNum}</p>
                          {item.titulo && <p className="text-sm font-medium leading-tight" style={{ color: darkBg }}>{item.titulo}</p>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Comentario */}
          <div className="mb-14">
            <p className="text-lg font-semibold mb-1" style={{ color: darkBg }}>¿Qué funcionó y qué no?</p>
            <p className="text-sm opacity-50 mb-2" style={{ color: darkBg }}>Contanos sobre las opciones que elegiste:</p>
            <ul className="text-sm opacity-50 list-disc list-inside space-y-1 mb-5" style={{ color: darkBg }}>
              <li>Qué elementos funcionan (símbolo, tipografía, composición, estilo)</li>
              <li>Si querés combinar elementos de distintas opciones</li>
              <li>Preferencias de color o dirección que querés explorar</li>
            </ul>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              placeholder="Te leemos..."
              rows={5}
              className="w-full border-2 border-[#e8e8e8] rounded-2xl px-5 py-4 text-sm resize-none outline-none transition-colors leading-relaxed"
              style={{ color: darkBg }}
              onFocus={e => e.target.style.borderColor = acento}
              onBlur={e => e.target.style.borderColor = '#e8e8e8'}
            />
          </div>

          {/* Referencias */}
          <div className="mb-14">
            <p className="text-lg font-semibold mb-1" style={{ color: darkBg }}>Logos de referencia</p>
            <p className="text-sm opacity-50 mb-6" style={{ color: darkBg }}>Si hay algún logo que te guste y quieras compartir como referencia</p>

            {referencias.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                {referencias.map((r, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={r.url} alt="" className="w-full h-full object-cover rounded-2xl border border-[#e8e8e8]" />
                    <button
                      onClick={() => setReferencias(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer"
                      style={{ backgroundColor: acento }}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="cursor-pointer block">
              <div className="border-2 border-dashed border-[#e0e0e0] rounded-2xl p-10 flex flex-col items-center gap-3 transition-colors bg-white hover:border-[#bbb]">
                {uploadingRef
                  ? <div className="w-6 h-6 rounded-full border-2 border-[#ccc] border-t-[#666] animate-spin" />
                  : <>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: acento + '15' }}>
                        <Upload size={20} style={{ color: acento }} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold" style={{ color: darkBg }}>Subí tu referencia</p>
                        <p className="text-xs opacity-40 mt-0.5" style={{ color: darkBg }}>PNG, JPG — máx. 10 MB</p>
                      </div>
                    </>
                }
              </div>
              <input ref={refInput} type="file" accept="image/*" multiple className="hidden"
                onChange={e => Array.from(e.target.files).forEach(f => subirReferencia(f))} />
            </label>
          </div>

          {/* Guardar */}
          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full py-4 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-opacity cursor-pointer border-none disabled:opacity-50 hover:opacity-90 text-base"
            style={{ backgroundColor: darkBg }}>
            {guardando
              ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : guardado
                ? <><Check size={18} strokeWidth={3} /> Feedback guardado</>
                : 'Enviar feedback'
            }
          </button>

        </div>
      </section>

      {/* ── Lightbox ── */}
      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}

      {/* ── Footer ── */}
      <footer className="py-8 px-8" style={{ backgroundColor: darkBg }}>
        <p className="text-center text-[11px] text-white/40 tracking-wide">
          © {new Date().getFullYear()} {proyecto?.nombre} — Propuesta de marca
        </p>
      </footer>

    </div>
  )
}
