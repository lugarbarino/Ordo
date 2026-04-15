import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../lib/supabase'

export function FinalistasPage() {
  const { slug } = useParams()
  const [empresa, setEmpresa] = useState(null)
  const [proyecto, setProyecto] = useState(null)
  const [finalistas, setFinalistas] = useState([])
  const [activo, setActivo] = useState(0)
  const [loading, setLoading] = useState(true)

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
      .select('*, opciones_marca(*), assets_marca(*), colores_marca(*), tipografias_marca(*)')
      .eq('empresa_id', emp.id)
      .eq('estado', 'activo')
      .single()

    if (proy) {
      setProyecto(proy)
      setFinalistas((proy.opciones_marca || []).filter(o => o.es_finalista))
    }
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#888] text-sm">Cargando…</div>
  if (!proyecto || finalistas.length === 0) return <div className="min-h-screen flex items-center justify-center text-[#888] text-sm">Sin finalistas cargados</div>

  const opcion = finalistas[activo]
  const assets = (proyecto.assets_marca || []).filter(a => a.opcion_id === opcion.id)
  const colores = (proyecto.colores_marca || []).filter(c => c.opcion_id === opcion.id)
  const tipografias = (proyecto.tipografias_marca || []).filter(t => t.opcion_id === opcion.id)
  const mockups = assets.filter(a => a.tipo === 'mockup')
  const logos = {
    isotipo: assets.find(a => a.tipo === 'isotipo'),
    logotipo: assets.find(a => a.tipo === 'logotipo'),
    imagotipo_h: assets.find(a => a.tipo === 'imagotipo_h'),
    imagotipo_v: assets.find(a => a.tipo === 'imagotipo_v'),
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="bg-white border-b border-[#e3e3e3] px-6 py-4 flex items-center gap-4">
        {empresa?.logo_url
          ? <img src={empresa.logo_url} alt={empresa.nombre} className="h-8 w-auto object-contain" />
          : <span className="font-bold text-lg">{empresa?.nombre}</span>
        }
        <span className="text-[#ccc]">·</span>
        <span className="text-sm text-[#666]">Finalistas</span>
      </header>

      {/* Tabs pill */}
      {finalistas.length > 1 && (
        <div className="sticky top-0 z-10 bg-white border-b border-[#e3e3e3] px-6 py-3 flex gap-2">
          {finalistas.map((f, i) => (
            <button
              key={f.id}
              onClick={() => setActivo(i)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                activo === i
                  ? 'bg-[#191A23] text-white border-[#191A23]'
                  : 'bg-white text-[#555] border-[#e3e3e3] hover:border-[#aaa]'
              }`}
            >
              {f.nombre}
            </button>
          ))}
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-12">

        {/* Info */}
        <section>
          <h1 className="text-2xl font-bold">{opcion.nombre}</h1>
          {opcion.tagline && <p className="text-base text-[#555] mt-1">{opcion.tagline}</p>}
          {opcion.atributo && (
            <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full bg-[#f1f1f1] text-[#555]">
              {opcion.atributo}
            </span>
          )}
          {opcion.descripcion && <p className="text-sm text-[#666] mt-4 leading-relaxed">{opcion.descripcion}</p>}
        </section>

        {/* Colores */}
        {colores.length > 0 && (
          <section>
            <div className="text-xs font-bold text-[#aaa] uppercase tracking-widest mb-4">Paleta de colores</div>
            <div className="flex gap-3">
              {colores.map(c => (
                <div key={c.id} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-14 h-14 rounded-full border border-black/10 shadow-sm"
                    style={{ background: c.hex }}
                  />
                  <span className="text-[10px] font-mono text-[#666]">{c.hex}</span>
                  {c.nombre && <span className="text-[10px] text-[#aaa]">{c.nombre}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tipografía */}
        {tipografias.length > 0 && (
          <section>
            <div className="text-xs font-bold text-[#aaa] uppercase tracking-widest mb-4">Tipografía</div>
            <div className="space-y-3">
              {tipografias.map(t => (
                <div key={t.id} className="bg-white rounded-xl border border-[#e3e3e3] p-5">
                  <div className="text-xs text-[#aaa] mb-1">{t.tipo === 'primary' ? 'Principal' : 'Secundaria'}</div>
                  <div className="text-xl font-bold">{t.nombre_fuente}</div>
                  <div className="text-sm text-[#888] mt-1" style={{ fontFamily: t.nombre_fuente }}>
                    Aa Bb Cc Dd Ee Ff Gg 0 1 2 3 4 5 6 7 8 9
                  </div>
                  {t.pesos && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {t.pesos.map(p => (
                        <span key={p} className="text-xs px-2 py-0.5 bg-[#f1f1f1] rounded-full text-[#555]">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Logos */}
        {Object.values(logos).some(Boolean) && (
          <section>
            <div className="text-xs font-bold text-[#aaa] uppercase tracking-widest mb-4">Logos</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'isotipo', label: 'Isotipo' },
                { key: 'logotipo', label: 'Logotipo' },
                { key: 'imagotipo_h', label: 'Imagotipo H' },
                { key: 'imagotipo_v', label: 'Imagotipo V' },
              ].map(({ key, label }) => logos[key] && (
                <div key={key} className="bg-white rounded-xl border border-[#e3e3e3] p-6 flex flex-col items-center gap-3">
                  <img src={logos[key].url} alt={label} className="max-h-16 max-w-full object-contain" />
                  <span className="text-xs text-[#888]">{label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mockups */}
        {mockups.length > 0 && (
          <section>
            <div className="text-xs font-bold text-[#aaa] uppercase tracking-widest mb-4">Mockups</div>
            <div className="space-y-4">
              {mockups.map(m => (
                <div key={m.id} className="rounded-xl overflow-hidden border border-[#e3e3e3]">
                  <img src={m.url} alt={m.label || 'Mockup'} className="w-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="bg-[#191A23] text-white/50 text-xs text-center py-6 rounded-t-3xl mt-10">
        {empresa?.nombre} · Ordo
      </footer>
    </div>
  )
}
