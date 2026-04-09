import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../../../lib/supabase'
import { Plus, Trash2, Link, Send } from 'lucide-react'

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

    // Deduplicar por texto
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
    // Si ya fue enviado, mostrar pantalla de confirmación
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
    const tipo = nuevoLink.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) ? 'imagen' : 'link'
    const { data } = await db.from('brief_referencias')
      .insert({ proyecto_id: proyecto.id, url: nuevoLink.trim(), descripcion: nuevaDesc.trim() || null, tipo })
      .select().single()
    if (data) { setReferencias(prev => [...prev, data]); setNuevoLink(''); setNuevaDesc('') }
  }

  const eliminarRef = async (id) => {
    await db.from('brief_referencias').delete().eq('id', id)
    setReferencias(prev => prev.filter(r => r.id !== id))
  }

  const enviar = async () => {
    setEnviando(true)
    // Guardar cualquier respuesta pendiente sin id todavía (que no se guardó en blur)
    for (const [preguntaId, resp] of Object.entries(respuestas)) {
      const texto = resp?.respuesta?.trim()
      if (texto && !resp?.id) {
        const { data } = await db.from('brief_respuestas')
          .insert({ pregunta_id: preguntaId, proyecto_id: proyecto.id, respuesta: texto })
          .select().single()
        if (data) setRespuestas(prev => ({ ...prev, [preguntaId]: data }))
      }
    }
    // Marcar como enviado en el proyecto
    await db.from('proyectos_marca')
      .update({ brief_enviado_at: new Date().toISOString() })
      .eq('id', proyecto.id)
    setEnviando(false)
    setEnviado(true)
  }

  if (cargando) return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-[#e3e3e3] border-t-[#1c1c1c] animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
      <p className="text-[#888] text-sm">{error}</p>
    </div>
  )

  if (enviado) return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <div className="bg-white border-b border-[#e8e8e8] px-6 py-5 flex items-center gap-4">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-5 w-auto" />
        <div className="w-px h-5 bg-[#e0e0e0]" />
        <div>
          <p className="text-xs text-[#888]">Brief de marca</p>
          <p className="text-sm font-bold text-[#1c1c1c]">{proyecto.nombre}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1c1c1c] flex items-center justify-center mb-6">
          <Send size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-[#1c1c1c] mb-3">¡Brief enviado!</h1>
        <p className="text-[#888] text-sm leading-relaxed max-w-[380px]">
          Ya recibimos toda tu información. Nos ponemos a trabajar y te avisamos cuando tengamos novedades.
        </p>
      </div>
    </div>
  )

  const respuestasCount = Object.values(respuestas).filter(r => r?.respuesta?.trim()).length

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e8] px-6 py-5 flex items-center gap-4">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-5 w-auto" />
        <div className="w-px h-5 bg-[#e0e0e0]" />
        <div>
          <p className="text-xs text-[#888]">Brief de marca</p>
          <p className="text-sm font-bold text-[#1c1c1c]">{proyecto.nombre}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[680px] mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#1c1c1c] mb-2">Contanos sobre tu marca</h1>
          <p className="text-[#888] text-sm leading-relaxed">
            Respondé las preguntas con todo el detalle que puedas. Cuanto más sepamos, mejor vamos a poder trabajar juntos.
          </p>
        </div>

        {/* Preguntas */}
        <div className="flex flex-col gap-6 mb-12">
          {preguntas.map((p, i) => {
            const resp = respuestas[p.id]
            const valor = resp?.respuesta || ''
            const saved = guardado[p.id]
            const saving = guardando[p.id]

            return (
              <div key={p.id} className="bg-white rounded-[18px] border border-[#e8e8e8] p-6">
                <label className="block mb-3">
                  <span className="text-[10px] font-bold text-[#bbb] uppercase tracking-widest">{i + 1} de {preguntas.length}</span>
                  <p className="text-base font-bold text-[#1c1c1c] mt-1 leading-snug">{p.texto}</p>
                </label>
                <textarea
                  value={valor}
                  onChange={e => handleChange(p.id, e.target.value)}
                  onBlur={() => guardar(p.id)}
                  placeholder="Escribí tu respuesta acá…"
                  rows={3}
                  className="w-full px-4 py-3 border border-[#e0e0e0] rounded-[10px] text-sm text-[#1c1c1c] resize-none outline-none focus:border-[#1c1c1c] transition-colors leading-relaxed"
                />
                <div className="flex justify-end mt-2 h-5">
                  {saving && <span className="text-xs text-[#aaa]">Guardando…</span>}
                  {saved && !saving && <span className="text-xs text-green-500">✓ Guardado</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Referencias */}
        <div className="mb-12">
          <h2 className="text-lg font-black text-[#1c1c1c] mb-1">Referencias visuales</h2>
          <p className="text-sm text-[#888] mb-5">
            Pegá links de marcas, imágenes o estilos que te gusten. Pueden ser de Pinterest, Behance, Instagram o cualquier página.
          </p>

          {/* Input */}
          <div className="bg-white border border-[#e8e8e8] rounded-[18px] p-5 mb-4">
            <div className="flex flex-col gap-2">
              <input
                type="url"
                value={nuevoLink}
                onChange={e => setNuevoLink(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && agregarRef()}
                placeholder="Pegá un link (Pinterest, Behance, Instagram…)"
                className="w-full px-4 py-3 border border-[#e0e0e0] rounded-[10px] text-sm outline-none focus:border-[#1c1c1c] transition-colors"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevaDesc}
                  onChange={e => setNuevaDesc(e.target.value)}
                  placeholder="¿Por qué te gusta? (opcional)"
                  className="flex-1 px-4 py-2.5 border border-[#e0e0e0] rounded-[10px] text-sm outline-none focus:border-[#1c1c1c] transition-colors"
                />
                <button
                  onClick={agregarRef}
                  className="flex items-center gap-1.5 bg-[#1c1c1c] text-white px-4 py-2.5 rounded-[10px] text-sm font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity shrink-0">
                  <Plus size={14} /> Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de referencias */}
          {referencias.length > 0 && (
            <div className="flex flex-col gap-2">
              {referencias.map(r => (
                <div key={r.id} className="bg-white border border-[#e8e8e8] rounded-[12px] p-4 flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-[6px] bg-[#f5f5f5] flex items-center justify-center shrink-0">
                    <Link size={14} className="text-[#888]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-[#1c1c1c] font-medium truncate block hover:underline no-underline">
                      {r.url}
                    </a>
                    {r.descripcion && <p className="text-xs text-[#888] mt-0.5">{r.descripcion}</p>}
                  </div>
                  <button
                    onClick={() => eliminarRef(r.id)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-[#ccc] hover:text-red-400 rounded-[6px] cursor-pointer border-none bg-transparent transition-all shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enviar */}
        <div className="bg-white border border-[#e8e8e8] rounded-[18px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#1c1c1c]">¿Está todo listo?</p>
            <p className="text-xs text-[#888] mt-0.5">
              {respuestasCount > 0
                ? `Respondiste ${respuestasCount} de ${preguntas.length} preguntas.`
                : 'Completá al menos una respuesta antes de enviar.'}
            </p>
          </div>
          <button
            onClick={enviar}
            disabled={enviando || respuestasCount === 0}
            className="flex items-center gap-2 bg-[#1c1c1c] text-white px-6 py-3 rounded-[12px] text-sm font-bold cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
            <Send size={15} />
            {enviando ? 'Enviando…' : 'Enviar brief'}
          </button>
        </div>

        <p className="text-center text-xs text-[#bbb] mt-6">
          Las respuestas se guardan automáticamente al salir de cada campo.
        </p>
      </div>
    </div>
  )
}
