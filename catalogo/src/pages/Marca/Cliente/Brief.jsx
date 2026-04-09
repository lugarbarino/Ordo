import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../../../lib/supabase'
import { Plus, Trash2, Link, Send, CheckCircle2 } from 'lucide-react'

export default function ClienteBrief() {
  const { nombre } = useParams()
  const [proyecto, setProyecto] = useState(null)
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [referencias, setReferencias] = useState([])
  const [nuevoLink, setNuevoLink] = useState('')
  const [nuevaDesc, setNuevaDesc] = useState('')
  const [guardando, setGuardando] = useState({})
  const [guardado, setGuardado] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [errorRef, setErrorRef] = useState('')

  useEffect(() => { cargar() }, [nombre])

  const cargar = async () => {
    setCargando(true)
    const { data: proyectos } = await db
      .from('proyectos_marca')
      .select('*')
      .eq('slug', nombre)
      .limit(1)

    const p = proyectos?.[0]
    if (!p) { setError('Proyecto no encontrado'); setCargando(false); return }

    const { data: preg } = await db
      .from('brief_preguntas')
      .select('*')
      .eq('proyecto_id', p.id)
      .order('orden')

    const seen = new Set()
    const pregUnicas = (preg || []).filter(q => {
      if (seen.has(q.texto)) return false
      seen.add(q.texto)
      return true
    })

    const { data: resp } = await db
      .from('brief_respuestas')
      .select('*')
      .eq('proyecto_id', p.id)

    const respMap = {}
    resp?.forEach(r => { respMap[r.pregunta_id] = r })

    const { data: refs } = await db
      .from('brief_referencias')
      .select('*')
      .eq('proyecto_id', p.id)

    setProyecto(p)
    setPreguntas(pregUnicas)
    setRespuestas(respMap)
    setReferencias(refs || [])
    if (p.brief_enviado_at) setEnviado(true)
    setCargando(false)
  }

  const handleChange = (preguntaId, valor) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: { ...prev[preguntaId], respuesta: valor }
    }))
  }

  const guardar = async (preguntaId) => {
    const texto = respuestas[preguntaId]?.respuesta?.trim()
    if (!texto) return
    setGuardando(prev => ({ ...prev, [preguntaId]: true }))

    const existing = respuestas[preguntaId]?.id
    if (existing) {
      await db.from('brief_respuestas').update({ respuesta: texto, updated_at: new Date().toISOString() }).eq('id', existing)
    } else {
      const { data } = await db.from('brief_respuestas')
        .insert({ pregunta_id: preguntaId, proyecto_id: proyecto.id, respuesta: texto })
        .select().single()
      if (data) setRespuestas(prev => ({ ...prev, [preguntaId]: data }))
    }

    setGuardando(prev => ({ ...prev, [preguntaId]: false }))
    setGuardado(prev => ({ ...prev, [preguntaId]: true }))
    setTimeout(() => setGuardado(prev => ({ ...prev, [preguntaId]: false })), 2000)
  }

  const agregarRef = async () => {
    if (!nuevoLink.trim()) return
    setErrorRef('')
    const tipo = nuevoLink.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) ? 'imagen' : 'link'
    const tempId = `temp-${Date.now()}`
    const tempRef = { id: tempId, url: nuevoLink.trim(), descripcion: nuevaDesc.trim() || null, tipo }
    setReferencias(prev => [...prev, tempRef])
    setNuevoLink('')
    setNuevaDesc('')
    const { data, error: dbErr } = await db.from('brief_referencias')
      .insert({ proyecto_id: proyecto.id, url: tempRef.url, descripcion: tempRef.descripcion, tipo })
      .select().single()
    if (data) {
      setReferencias(prev => prev.map(r => r.id === tempId ? data : r))
    } else {
      console.error('brief_referencias insert error:', dbErr)
      setErrorRef('No se pudo guardar. Verificá que brief_referencias tenga RLS deshabilitado en Supabase.')
    }
  }

  const eliminarRef = async (id) => {
    await db.from('brief_referencias').delete().eq('id', id)
    setReferencias(prev => prev.filter(r => r.id !== id))
  }

  const enviar = async () => {
    setEnviando(true)
    for (const [preguntaId, resp] of Object.entries(respuestas)) {
      const texto = resp?.respuesta?.trim()
      if (texto && !resp?.id) {
        const { data } = await db.from('brief_respuestas')
          .insert({ pregunta_id: preguntaId, proyecto_id: proyecto.id, respuesta: texto })
          .select().single()
        if (data) setRespuestas(prev => ({ ...prev, [preguntaId]: data }))
      }
    }
    await db.from('proyectos_marca')
      .update({ brief_enviado_at: new Date().toISOString() })
      .eq('id', proyecto.id)
    setEnviando(false)
    setEnviado(true)
  }

  if (cargando) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#e3e3e3] border-t-[#1c1c1c] animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-[#aaa] text-sm">{error}</p>
    </div>
  )

  const reabrirBrief = async () => {
    await db.from('proyectos_marca').update({ brief_enviado_at: null }).eq('id', proyecto.id)
    setEnviado(false)
  }

  if (enviado) return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-8 py-5 border-b border-[#f0f0f0] flex items-center gap-3">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-[22px] w-auto" />
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center mb-5">
          <CheckCircle2 size={26} className="text-[#43a047]" />
        </div>
        <h1 className="text-2xl font-black text-[#1c1c1c] mb-2">¡Brief enviado!</h1>
        <p className="text-[#888] text-sm leading-relaxed max-w-[340px]">
          Ya recibimos toda tu información. Nos ponemos a trabajar y te avisamos cuando tengamos novedades.
        </p>
        <button
          onClick={reabrirBrief}
          className="mt-6 text-xs text-[#bbb] hover:text-[#888] underline bg-transparent border-none cursor-pointer transition-colors">
          Quiero agregar algo más
        </button>
      </div>
    </div>
  )

  const respuestasCount = Object.values(respuestas).filter(r => r?.respuesta?.trim()).length
  const total = preguntas.length
  const progreso = total > 0 ? Math.round((respuestasCount / total) * 100) : 0

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-[#f0f0f0] px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo-ordo.svg" alt="ORDO" className="h-[20px] w-auto" />
          <div className="w-px h-4 bg-[#e8e8e8]" />
          <p className="text-sm font-semibold text-[#1c1c1c] truncate max-w-[200px]">{proyecto.nombre}</p>
        </div>
        <span className="text-xs text-[#aaa] shrink-0">{respuestasCount}/{total} respondidas</span>
      </header>

      {/* Barra de progreso */}
      <div className="h-[3px] bg-[#f0f0f0]">
        <div
          className="h-full bg-[#1c1c1c] transition-all duration-500"
          style={{ width: `${progreso}%` }}
        />
      </div>

      {/* Content */}
      <div className="max-w-[640px] mx-auto px-5 py-12">

        {/* Intro */}
        <div className="mb-12">
          <p className="text-xs font-bold text-[#aaa] uppercase tracking-widest mb-3">Brief de marca</p>
          <h1 className="text-[32px] font-black text-[#1c1c1c] leading-tight mb-4">
            Contanos sobre tu marca
          </h1>
          <p className="text-[#888] text-[15px] leading-relaxed">
            Respondé con todo el detalle que puedas. Cuanto más sepamos, mejor vamos a poder trabajar.
          </p>
          <p className="text-xs text-[#888] mt-3">
            Las respuestas se guardan automáticamente. Podés compartir este link y completarlo entre varias personas.
          </p>
        </div>

        {/* Preguntas */}
        <div className="flex flex-col gap-10 mb-16">
          {preguntas.map((p, i) => {
            const resp = respuestas[p.id]
            const valor = resp?.respuesta || ''
            const saved = guardado[p.id]
            const saving = guardando[p.id]
            const tieneRespuesta = !!valor.trim()

            return (
              <div key={p.id}>
                <div className="flex items-start gap-4 mb-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors
                    ${tieneRespuesta ? 'bg-[#1c1c1c] text-white' : 'bg-[#f0f0f0] text-[#aaa]'}`}>
                    {i + 1}
                  </div>
                  <p className="text-[15px] font-semibold text-[#1c1c1c] leading-snug pt-0.5">{p.texto}</p>
                </div>
                <div className="pl-11">
                  <textarea
                    value={valor}
                    onChange={e => handleChange(p.id, e.target.value)}
                    onBlur={() => guardar(p.id)}
                    placeholder="Escribí tu respuesta acá…"
                    rows={3}
                    className="w-full px-4 py-3.5 border border-[#e8e8e8] rounded-[12px] text-[14px] text-[#1c1c1c] resize-none outline-none focus:border-[#1c1c1c] transition-colors leading-relaxed placeholder:text-[#ccc] bg-[#fafafa] focus:bg-white"
                  />
                  <div className="h-4 mt-1.5 flex justify-end">
                    {saving && <span className="text-[11px] text-[#ccc]">Guardando…</span>}
                    {saved && !saving && <span className="text-[11px] text-[#43a047]">✓ Guardado</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Divisor */}
        <div className="border-t border-[#f0f0f0] mb-12" />

        {/* Referencias */}
        <div className="mb-14">
          <h2 className="text-lg font-black text-[#1c1c1c] mb-1">Referencias visuales</h2>
          <p className="text-[13px] text-[#aaa] mb-6">
            Marcas, imágenes o estilos que te gusten. Pinterest, Behance, Instagram, cualquier página.
          </p>

          {/* Input */}
          <div className="border border-[#e8e8e8] rounded-[14px] p-4 mb-3 bg-[#fafafa]">
            <input
              type="text"
              value={nuevoLink}
              onChange={e => setNuevoLink(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregarRef()}
              placeholder="Pegá un link…"
              className="w-full px-3 py-2.5 border border-[#e8e8e8] rounded-[8px] text-sm outline-none focus:border-[#1c1c1c] transition-colors mb-2 bg-white"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevaDesc}
                onChange={e => setNuevaDesc(e.target.value)}
                placeholder="¿Por qué te gusta? (opcional)"
                className="flex-1 px-3 py-2 border border-[#e8e8e8] rounded-[8px] text-sm outline-none focus:border-[#1c1c1c] transition-colors bg-white"
              />
              <button
                onClick={agregarRef}
                className="flex items-center gap-1.5 bg-[#1c1c1c] text-white px-4 py-2 rounded-[8px] text-sm font-semibold cursor-pointer border-none hover:opacity-85 transition-opacity shrink-0">
                <Plus size={14} /> Agregar
              </button>
            </div>
          </div>

          {errorRef && <p className="text-xs text-red-400 mb-3">{errorRef}</p>}

          {referencias.length > 0 && (
            <div className="flex flex-col gap-2">
              {referencias.map(r => (
                <div key={r.id} className="border border-[#f0f0f0] rounded-[10px] p-3.5 flex items-center gap-3 group hover:border-[#e0e0e0] transition-colors">
                  <div className="w-7 h-7 rounded-[6px] bg-[#f5f5f5] flex items-center justify-center shrink-0">
                    <Link size={12} className="text-[#bbb]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-[13px] text-[#1c1c1c] font-medium truncate block hover:underline no-underline">
                      {r.url}
                    </a>
                    {r.descripcion && <p className="text-[11px] text-[#aaa] mt-0.5">{r.descripcion}</p>}
                  </div>
                  <button
                    onClick={() => eliminarRef(r.id)}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-[#ddd] hover:text-red-400 rounded-[6px] cursor-pointer border-none bg-transparent transition-all shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="border border-[#e8e8e8] rounded-[16px] p-6">
          <div className="mb-5">
            <p className="text-[15px] font-bold text-[#1c1c1c] mb-1">¿Está todo listo?</p>
            <p className="text-[13px] text-[#aaa]">
              {respuestasCount > 0
                ? `Respondiste ${respuestasCount} de ${total} preguntas.`
                : 'Completá al menos una respuesta antes de enviar.'}
            </p>
          </div>

          {/* Progress visual */}
          <div className="h-1.5 bg-[#f0f0f0] rounded-full mb-5 overflow-hidden">
            <div className="h-full bg-[#1c1c1c] rounded-full transition-all duration-500" style={{ width: `${progreso}%` }} />
          </div>

          <button
            onClick={enviar}
            disabled={enviando || respuestasCount === 0}
            className="w-full flex items-center justify-center gap-2 bg-[#1c1c1c] text-white py-3.5 rounded-[12px] text-sm font-bold cursor-pointer border-none hover:opacity-85 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed">
            <Send size={14} />
            {enviando ? 'Enviando…' : 'Enviar brief'}
          </button>
        </div>

        <p className="text-center text-[11px] text-[#ddd] mt-8 pb-8">
          Powered by ORDO
        </p>
      </div>
    </div>
  )
}
