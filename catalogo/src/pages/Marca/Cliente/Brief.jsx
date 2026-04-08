import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../../../lib/supabase'

export default function ClienteBrief() {
  const { nombre } = useParams()
  const [proyecto, setProyecto] = useState(null)
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [guardando, setGuardando] = useState({})
  const [guardado, setGuardado] = useState({})
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

    const { data: resp } = await db
      .from('brief_respuestas')
      .select('*')
      .eq('proyecto_id', p.id)

    const respMap = {}
    resp?.forEach(r => { respMap[r.pregunta_id] = r })

    setProyecto(p)
    setPreguntas(preg || [])
    setRespuestas(respMap)
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

        <div className="flex flex-col gap-6">
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

        <p className="text-center text-xs text-[#bbb] mt-10">
          Las respuestas se guardan automáticamente al salir de cada campo.
        </p>
      </div>
    </div>
  )
}
