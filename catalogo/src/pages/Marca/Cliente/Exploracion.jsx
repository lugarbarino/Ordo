import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { db, SUPABASE_URL } from '../../../lib/supabase'
import { Check, Upload, X } from 'lucide-react'

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
  // colores de marca
  const [acento, setAcento]   = useState('#c63f3f')
  const [darkBg, setDarkBg]   = useState('#363645')
  const [lightBg, setLightBg] = useState('#f3f4f5')
  const refInput = useRef()

  useEffect(() => { cargar() }, [nombre])

  const cargar = async () => {
    setCargando(true)
    const { data: rows } = await db.from('proyectos_marca').select('id, nombre, exploracion').eq('slug', nombre).limit(1)
    const p = rows?.[0]
    if (!p || !p.exploracion) { setError('No hay exploración disponible aún.'); setCargando(false); return }
    setProyecto(p)
    setExp(p.exploracion)

    // colores de marca
    const { data: manualRows } = await db.from('manual_marca').select('colores').eq('proyecto_id', p.id).limit(1)
    const colores = manualRows?.[0]?.colores || []
    const colorAcento = colores.find(c => c.esAcento) || colores[0]
    const colorDark   = colores.find(c => c.esDark)
    const colorLight  = colores.find(c => c.esLight)
    if (colorAcento?.hex) setAcento(colorAcento.hex.startsWith('#') ? colorAcento.hex : `#${colorAcento.hex}`)
    if (colorDark?.hex)   setDarkBg(colorDark.hex.startsWith('#') ? colorDark.hex : `#${colorDark.hex}`)
    if (colorLight?.hex)  setLightBg(colorLight.hex.startsWith('#') ? colorLight.hex : `#${colorLight.hex}`)

    // feedback existente
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
    <div className="min-h-screen bg-white font-sans">

      {/* ── Logo actual (rebranding) ── */}
      {exp?.es_rebranding && (
        <section className="py-16 px-6 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start gap-12">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: acento }}>Re Branding</p>
              <h2 className="text-4xl font-light mb-4" style={{ color: darkBg }}>Logo actual</h2>
              {exp.logo_actual?.descripcion && (
                <p className="text-sm leading-relaxed max-w-sm" style={{ color: darkBg + 'aa' }}>{exp.logo_actual.descripcion}</p>
              )}
            </div>
            {exp.logo_actual?.url && (
              <div className="border border-[#ececf0] rounded-2xl p-8 flex items-center justify-center w-full md:w-[360px] shrink-0 bg-white">
                <img src={exp.logo_actual.url} alt="Logo actual" className="max-h-40 max-w-full object-contain" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Propuestas ── */}
      <section className="py-16 px-6" style={{ backgroundColor: lightBg }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-light mb-3" style={{ color: darkBg }}>Propuestas</h2>
            <p className="text-sm max-w-sm mx-auto" style={{ color: darkBg }}>
              Distintas opciones a profundizar — en este paso nos enfocamos en el estilo.
            </p>
          </div>

          <div className="flex flex-col gap-16">
            {opciones.map((op, i) => (
              <div key={op.id} className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <span className="text-2xl font-semibold shrink-0" style={{ color: darkBg }}>Opción #{i + 1}</span>
                  <div>
                    {op.titulo && <p className="text-sm font-medium mb-1" style={{ color: darkBg }}>{op.titulo}</p>}
                    {op.descripcion && <p className="text-xs leading-relaxed" style={{ color: darkBg + '99' }}>{op.descripcion}</p>}
                  </div>
                </div>
                {op.imagenes?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {op.imagenes.map((img, j) => (
                      <div key={j} className="flex flex-col gap-2">
                        <div className="rounded-2xl overflow-hidden bg-white border border-[#e8e8e8] aspect-video">
                          <img src={img.url} alt={img.titulo || `Variante ${j + 1}`} className="w-full h-full object-cover" />
                        </div>
                        {img.titulo && <p className="text-xs text-center" style={{ color: darkBg + '88' }}>{img.titulo}</p>}
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
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-light mb-2" style={{ color: darkBg }}>Feedback</h2>
            <p className="text-sm" style={{ color: darkBg }}>Vamos a recolectar información para el siguiente paso.</p>
          </div>

          {/* Votos */}
          <div className="mb-10">
            <p className="text-xl mb-1" style={{ color: darkBg }}>Seleccioná las opciones que más te gustan</p>
            <p className="text-sm text-[#707084] mb-6">Puede ser más de una opción</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {opciones.map((op, i) => {
                const seleccionada = votos.includes(op.id)
                const primeraImg = op.imagenes?.[0]?.url
                return (
                  <button
                    key={op.id}
                    onClick={() => toggleVoto(op.id)}
                    className="flex flex-col gap-2 p-3 rounded-2xl border-2 transition-all cursor-pointer bg-transparent text-left"
                    style={{
                      borderColor: seleccionada ? acento : '#e8e8e8',
                      backgroundColor: seleccionada ? acento + '10' : 'transparent',
                    }}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                        style={{ backgroundColor: seleccionada ? acento : 'transparent', borderColor: seleccionada ? acento : '#ccc' }}>
                        {seleccionada && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium" style={{ color: darkBg }}>Opción #{i + 1}</span>
                    </div>
                    {primeraImg
                      ? <div className="rounded-xl overflow-hidden aspect-video bg-[#f5f5f5]">
                          <img src={primeraImg} alt="" className="w-full h-full object-cover" />
                        </div>
                      : <div className="rounded-xl aspect-video" style={{ backgroundColor: lightBg }} />
                    }
                    {op.titulo && <p className="text-xs" style={{ color: darkBg + '88' }}>{op.titulo}</p>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Comentario */}
          <div className="mb-10">
            <p className="text-xl mb-1" style={{ color: darkBg }}>Qué funcionó y qué no en las propuestas que elegiste</p>
            <p className="text-sm text-[#707084] mb-2">Contanos:</p>
            <ul className="text-sm text-[#707084] list-disc list-inside space-y-1 mb-4">
              <li>Qué elementos funcionan bien y cuáles no (símbolo, tipografía, composición, estilo).</li>
              <li>Si te gustaría combinar elementos de distintas propuestas.</li>
              <li>Si hay algo que no va en la dirección que imaginan.</li>
              <li>Si tenés alguna preferencia en cuanto a colores.</li>
            </ul>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              placeholder="Te leemos."
              rows={5}
              className="w-full border border-[#e0e0e0] rounded-2xl px-5 py-4 text-sm resize-none outline-none transition-colors"
              style={{ color: darkBg }}
              onFocus={e => e.target.style.borderColor = acento}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Referencias */}
          <div className="mb-10">
            <p className="text-xl mb-1" style={{ color: darkBg }}>Podés agregar algún logo de referencia que te guste</p>
            <p className="text-sm text-[#707084] mb-4">y una descripción</p>
            {referencias.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {referencias.map((r, i) => (
                  <div key={i} className="relative group">
                    <img src={r.url} alt="" className="w-full aspect-square object-cover rounded-2xl border border-[#e8e8e8]" />
                    <button
                      onClick={() => setReferencias(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-2 right-2 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer"
                      style={{ backgroundColor: acento }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-[#e0e0e0] rounded-2xl p-8 flex flex-col items-center gap-2 hover:border-[#aaa] transition-colors" style={{ backgroundColor: lightBg }}>
                {uploadingRef
                  ? <div className="w-5 h-5 rounded-full border-2 border-[#ccc] border-t-[#666] animate-spin" />
                  : <>
                      <Upload size={20} className="text-[#ccc]" />
                      <p className="text-sm font-medium" style={{ color: darkBg }}>Subí tu referencia</p>
                      <p className="text-xs text-[#9a9ab3]">Límite de peso: 10 MB</p>
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
            className="w-full sm:w-auto px-8 py-3.5 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity cursor-pointer border-none disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: darkBg }}>
            {guardando
              ? <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              : guardado ? <><Check size={16} /> Guardado</> : 'Guardar feedback'
            }
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-6 px-6" style={{ backgroundColor: darkBg }}>
        <p className="text-center text-[10px] text-white/60">
          © {new Date().getFullYear()} {proyecto?.nombre} — Propuesta de marca
        </p>
      </footer>

    </div>
  )
}
