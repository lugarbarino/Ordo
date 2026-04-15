import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Upload, Check, ChevronRight } from 'lucide-react'
import { db, SUPABASE_URL } from '../lib/supabase'

export function ExploracionPage() {
  const { slug } = useParams()
  const [proyecto, setProyecto] = useState(null)
  const [empresa, setEmpresa] = useState(null)
  const [propuestas, setPropuestas] = useState([])
  const [seleccionadas, setSeleccionadas] = useState([])
  const [liked, setLiked] = useState('')
  const [disliked, setDisliked] = useState('')
  const [refs, setRefs] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [loading, setLoading] = useState(true)
  const refInput = useRef()

  useEffect(() => {
    cargar()
  }, [slug])

  const cargar = async () => {
    setLoading(true)
    const { data: emp } = await db.from('empresas').select('*').eq('slug', slug).single()
    if (!emp) { setLoading(false); return }
    setEmpresa(emp)

    const { data: proy } = await db
      .from('proyectos_marca')
      .select('*, opciones_marca(*), assets_marca(*)')
      .eq('empresa_id', emp.id)
      .eq('estado', 'activo')
      .single()

    if (proy) {
      setProyecto(proy)
      const props = (proy.opciones_marca || []).filter(o => o.es_propuesta)
      setPropuestas(props)

      const { data: feedback } = await db
        .from('exploracion_feedback')
        .select('*')
        .eq('proyecto_id', proy.id)
        .single()
      if (feedback) {
        setSeleccionadas(feedback.propuestas_seleccionadas || [])
        setLiked(feedback.liked || '')
        setDisliked(feedback.disliked || '')
        setRefs(feedback.referencias_urls || [])
      }
    }
    setLoading(false)
  }

  const toggleSeleccion = (id) => {
    setSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const subirReferencia = async (file) => {
    if (!file || !proyecto) return
    setSubiendo(true)
    const ext = file.name.split('.').pop()
    const path = `${proyecto.id}/${Date.now()}.${ext}`
    const { error } = await db.storage.from('marca-refs').upload(path, file, { upsert: true })
    if (!error) {
      const url = `${SUPABASE_URL}/storage/v1/object/public/marca-refs/${path}`
      setRefs(prev => [...prev, url])
    }
    setSubiendo(false)
  }

  const guardar = async () => {
    if (!proyecto) return
    setGuardando(true)
    await db.from('exploracion_feedback').upsert({
      proyecto_id: proyecto.id,
      propuestas_seleccionadas: seleccionadas,
      liked,
      disliked,
      referencias_urls: refs,
    }, { onConflict: 'proyecto_id' })
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-[#888] text-sm">Cargando…</div>
  )
  if (!proyecto) return (
    <div className="min-h-screen flex items-center justify-center text-[#888] text-sm">Proyecto no encontrado</div>
  )

  const logoActual = (proyecto.assets_marca || []).find(a => a.tipo === 'logo_actual')

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="bg-white border-b border-[#e3e3e3] px-6 py-4 flex items-center gap-4">
        {empresa?.logo_url
          ? <img src={empresa.logo_url} alt={empresa.nombre} className="h-8 w-auto object-contain" />
          : <span className="font-bold text-lg">{empresa?.nombre}</span>
        }
        <span className="text-[#ccc]">·</span>
        <span className="text-sm text-[#666]">Exploración de marca</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-12">

        {/* 1 — Logo actual */}
        {logoActual && (
          <section>
            <div className="text-xs font-bold text-[#aaa] uppercase tracking-widest mb-4">Tu logo actual</div>
            <div className="bg-white rounded-xl border border-[#e3e3e3] p-8 flex flex-col items-center gap-4">
              <img src={logoActual.url} alt="Logo actual" className="max-h-24 max-w-full object-contain" />
              {logoActual.label && <p className="text-sm text-[#666] text-center">{logoActual.label}</p>}
            </div>
          </section>
        )}

        {/* 2 — Propuestas */}
        {propuestas.length > 0 && (
          <section>
            <div className="text-xs font-bold text-[#aaa] uppercase tracking-widest mb-2">Propuestas</div>
            <p className="text-sm text-[#666] mb-5">Seleccioná las que más te gusten para seguir explorando.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {propuestas.map(p => {
                const thumb = (proyecto.assets_marca || []).find(a => a.opcion_id === p.id && a.tipo === 'thumbnail')
                const activa = seleccionadas.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleSeleccion(p.id)}
                    className={`relative rounded-xl border-2 overflow-hidden cursor-pointer text-left transition-all bg-transparent p-0 ${
                      activa ? 'border-[#191A23]' : 'border-[#e3e3e3] hover:border-[#bbb]'
                    }`}
                  >
                    <div className="aspect-square bg-[#f1f1f1] flex items-center justify-center">
                      {thumb
                        ? <img src={thumb.url} alt={p.nombre} className="w-full h-full object-cover" />
                        : <span className="text-xs text-[#aaa]">{p.nombre}</span>
                      }
                    </div>
                    <div className="p-3">
                      <div className="font-semibold text-sm">{p.nombre}</div>
                      {p.tagline && <div className="text-xs text-[#888] mt-0.5">{p.tagline}</div>}
                    </div>
                    {activa && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#191A23] flex items-center justify-center">
                        <Check size={13} className="text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* 3 — Feedback */}
        <section>
          <div className="text-xs font-bold text-[#aaa] uppercase tracking-widest mb-5">Tu feedback</div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#333] mb-1.5">¿Qué te gustó?</label>
              <textarea
                value={liked}
                onChange={e => setLiked(e.target.value)}
                placeholder="Contanos qué elementos, colores o estilos te llamaron la atención…"
                rows={3}
                className="w-full px-4 py-3 text-sm border border-[#e3e3e3] rounded-xl outline-none focus:border-[#aaa] resize-none bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#333] mb-1.5">¿Qué cambiarías?</label>
              <textarea
                value={disliked}
                onChange={e => setDisliked(e.target.value)}
                placeholder="¿Algo que no terminó de convencerte? Cualquier detalle suma…"
                rows={3}
                className="w-full px-4 py-3 text-sm border border-[#e3e3e3] rounded-xl outline-none focus:border-[#aaa] resize-none bg-white"
              />
            </div>
          </div>
        </section>

        {/* 4 — Referencias */}
        <section>
          <div className="text-xs font-bold text-[#aaa] uppercase tracking-widest mb-2">Referencias</div>
          <p className="text-sm text-[#666] mb-5">Subí logos, imágenes o marcas que te inspiren o que quieras que tengamos en cuenta.</p>

          {refs.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
              {refs.map((url, i) => (
                <div key={i} className="aspect-square rounded-xl border border-[#e3e3e3] bg-white overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-contain p-2" />
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => refInput.current?.click()}
            disabled={subiendo}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-dashed border-[#ccc] rounded-xl text-[#666] hover:border-[#aaa] hover:text-[#333] transition-colors cursor-pointer bg-white disabled:opacity-50"
          >
            <Upload size={15} />
            {subiendo ? 'Subiendo…' : 'Agregar imagen'}
          </button>
          <input
            ref={refInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => subirReferencia(e.target.files[0])}
          />
        </section>

        {/* Guardar */}
        <div className="flex justify-end pb-8">
          <button
            onClick={guardar}
            disabled={guardando}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#191A23] text-white text-sm font-semibold cursor-pointer disabled:opacity-50 border-none transition-opacity"
          >
            {guardado ? <><Check size={15} /> Guardado</> : guardando ? 'Guardando…' : <><span>Enviar feedback</span><ChevronRight size={15} /></>}
          </button>
        </div>
      </main>

      <footer className="bg-[#191A23] text-white/50 text-xs text-center py-6 rounded-t-3xl">
        {empresa?.nombre} · Ordo
      </footer>
    </div>
  )
}
