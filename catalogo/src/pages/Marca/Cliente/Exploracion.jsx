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
  const [proyecto, setProyecto]     = useState(null)
  const [exp, setExp]               = useState(null)
  const [feedbackId, setFeedbackId] = useState(null)
  const [votos, setVotos]           = useState([])       // array de opcion.id
  const [comentario, setComentario] = useState('')
  const [referencias, setReferencias] = useState([])    // array de {url}
  const [cargando, setCargando]     = useState(true)
  const [guardando, setGuardando]   = useState(false)
  const [guardado, setGuardado]     = useState(false)
  const [uploadingRef, setUploadingRef] = useState(false)
  const [error, setError]           = useState('')
  const refInput = useRef()

  useEffect(() => { cargar() }, [nombre])

  const cargar = async () => {
    setCargando(true)
    const { data: rows } = await db.from('proyectos_marca').select('id, nombre, exploracion').eq('slug', nombre).limit(1)
    const p = rows?.[0]
    if (!p || !p.exploracion) { setError('No hay exploración disponible aún.'); setCargando(false); return }
    setProyecto(p)
    setExp(p.exploracion)

    // cargar feedback existente
    const { data: fb } = await db.from('exploracion_feedback').select('*').eq('proyecto_id', p.id).order('created_at', { ascending: false }).limit(1)
    if (fb?.[0]) {
      setFeedbackId(fb[0].id)
      setVotos(fb[0].votos || [])
      setComentario(fb[0].comentario || '')
      setReferencias(fb[0].referencias || [])
    }
    setCargando(false)
  }

  const toggleVoto = (id) => {
    setVotos(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id])
  }

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
      <div className="w-8 h-8 rounded-full border-4 border-[#e3e3e3] border-t-[#1c1c1c] animate-spin" />
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
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Re Branding</p>
              <h2 className="text-4xl font-light text-[#363645] mb-4">Logo actual</h2>
              {exp.logo_actual?.descripcion && (
                <p className="text-sm text-[#52586f] leading-relaxed max-w-sm">{exp.logo_actual.descripcion}</p>
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
      <section className="py-16 px-6 bg-[#f3f4f5]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-light text-[#363645] mb-3">Propuestas</h2>
            <p className="text-sm text-[#363645] max-w-sm mx-auto">
              Distintas opciones a profundizar — en este paso nos enfocamos en el estilo.
            </p>
          </div>

          <div className="flex flex-col gap-16">
            {opciones.map((op, i) => (
              <div key={op.id} className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <span className="text-2xl font-semibold text-[#363645] shrink-0">Opción #{i + 1}</span>
                  <div>
                    {op.titulo && <p className="text-sm font-medium text-[#363645] mb-1">{op.titulo}</p>}
                    {op.descripcion && <p className="text-xs text-[#52586f] leading-relaxed">{op.descripcion}</p>}
                  </div>
                </div>
                {op.imagenes?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {op.imagenes.map((img, j) => (
                      <div key={j} className="flex flex-col gap-2">
                        <div className="rounded-2xl overflow-hidden bg-white border border-[#e8e8e8] aspect-video">
                          <img src={img.url} alt={img.titulo || `Variante ${j + 1}`} className="w-full h-full object-cover" />
                        </div>
                        {img.titulo && <p className="text-xs text-[#888] text-center">{img.titulo}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feedback: votos ── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-light text-[#363645] mb-2">Feedback</h2>
            <p className="text-sm text-[#363645]">Vamos a recolectar información para el siguiente paso.</p>
          </div>

          {/* Votos */}
          <div className="mb-10">
            <p className="text-xl text-[#363645] mb-1">Seleccioná las opciones que más te gustan</p>
            <p className="text-sm text-[#707084] mb-6">Puede ser más de una opción</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {opciones.map((op, i) => {
                const seleccionada = votos.includes(op.id)
                const primeraImg = op.imagenes?.[0]?.url
                return (
                  <button
                    key={op.id}
                    onClick={() => toggleVoto(op.id)}
                    className={`flex flex-col gap-2 p-3 rounded-2xl border-2 transition-all cursor-pointer bg-transparent text-left
                      ${seleccionada ? 'border-[#1c1c1c] bg-[#f8f8f8]' : 'border-[#e8e8e8] hover:border-[#ccc]'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                        ${seleccionada ? 'bg-[#1c1c1c] border-[#1c1c1c]' : 'border-[#ccc]'}`}>
                        {seleccionada && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-sm text-[#363645] font-medium">Opción #{i + 1}</span>
                    </div>
                    {primeraImg ? (
                      <div className="rounded-xl overflow-hidden aspect-video bg-[#f5f5f5]">
                        <img src={primeraImg} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="rounded-xl aspect-video bg-[#f5f5f5]" />
                    )}
                    {op.titulo && <p className="text-xs text-[#888]">{op.titulo}</p>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Comentario */}
          <div className="mb-10">
            <p className="text-xl text-[#363645] mb-1">Qué funcionó y qué no en las propuestas que elegiste</p>
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
              className="w-full border border-[#e0e0e0] rounded-2xl px-5 py-4 text-sm text-[#363645] resize-none focus:outline-none focus:border-[#1c1c1c] transition-colors"
            />
          </div>

          {/* Referencias */}
          <div className="mb-10">
            <p className="text-xl text-[#363645] mb-1">Podés agregar algún logo de referencia que te guste</p>
            <p className="text-sm text-[#707084] mb-4">y una descripción</p>

            {referencias.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {referencias.map((r, i) => (
                  <div key={i} className="relative group">
                    <img src={r.url} alt="" className="w-full aspect-square object-cover rounded-2xl border border-[#e8e8e8]" />
                    <button
                      onClick={() => setReferencias(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-[#e0e0e0] rounded-2xl p-8 flex flex-col items-center gap-2 hover:border-[#aaa] transition-colors bg-[#fafafa]">
                {uploadingRef
                  ? <div className="w-5 h-5 rounded-full border-2 border-[#ccc] border-t-[#666] animate-spin" />
                  : <>
                      <Upload size={20} className="text-[#ccc]" />
                      <p className="text-sm font-medium text-[#1e1e1e]">Subí tu referencia</p>
                      <p className="text-xs text-[#9a9ab3]">Límite de peso: 10 MB</p>
                    </>
                }
              </div>
              <input ref={refInput} type="file" accept="image/*" multiple className="hidden"
                onChange={e => Array.from(e.target.files).forEach(f => subirReferencia(f))} />
            </label>
          </div>

          {/* Botón guardar */}
          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#32323e] text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-[#1c1c1c] transition-colors cursor-pointer border-none disabled:opacity-50">
            {guardando
              ? <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              : guardado
                ? <><Check size={16} /> Guardado</>
                : 'Guardar feedback'
            }
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#191a23] py-6 px-6">
        <p className="text-center text-[10px] text-white/60">
          © {new Date().getFullYear()} {proyecto?.nombre} — Propuesta de marca
        </p>
      </footer>

    </div>
  )
}
