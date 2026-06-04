import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../../../lib/supabase'

function loadGoogleFont(nombre) {
  if (!nombre) return
  const id = `gfont-${nombre.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id; link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(nombre)}:wght@300;400;600;700;900&display=swap`
  document.head.appendChild(link)
}

export default function ClienteFinalista() {
  const { nombre } = useParams()
  const [proyecto, setProyecto] = useState(null)
  const [finalistas, setFinalistas] = useState([])
  const [tab, setTab] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [acento, setAcento] = useState('#c63f3f')
  const [darkBg, setDarkBg] = useState('#363645')

  useEffect(() => { cargar() }, [nombre])

  const cargar = async () => {
    setCargando(true)
    const { data: rows } = await db.from('proyectos_marca').select('id, nombre, finalistas').eq('slug', nombre).limit(1)
    const p = rows?.[0]
    if (!p) { setCargando(false); return }
    setProyecto(p)
    setFinalistas(p.finalistas || [])
    document.title = `${p.nombre} — Finalistas`

    const { data: manualRows } = await db.from('manual_marca').select('colores').eq('proyecto_id', p.id).limit(1)
    const colores = manualRows?.[0]?.colores || []
    const colorAcento = colores.find(c => c.esAcento) || colores[0]
    const colorDark = colores.find(c => c.esDark)
    if (colorAcento?.hex) setAcento(colorAcento.hex.startsWith('#') ? colorAcento.hex : `#${colorAcento.hex}`)
    if (colorDark?.hex) setDarkBg(colorDark.hex.startsWith('#') ? colorDark.hex : `#${colorDark.hex}`)
    p.finalistas?.forEach(f => { if (f.tipografia) loadGoogleFont(f.tipografia) })
    setCargando(false)
  }

  if (cargando) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-[#e3e3e3] border-t-[#363645] animate-spin" />
    </div>
  )

  if (!proyecto || finalistas.length === 0) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-[#888] text-sm">No hay finalistas disponibles aún.</p>
    </div>
  )

  const fin = finalistas[tab]
  const logosOscuros = (fin.logos || []).filter(l => l.dark)
  const logosEstaticos = (fin.logos || []).filter(l => !l.dark)

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Header con tabs ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#f0f0f0]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold shrink-0" style={{ color: darkBg }}>{proyecto.nombre}</p>
          <div className="flex items-center bg-[#f5f5f5] rounded-full p-1 gap-0.5">
            {finalistas.map((f, i) => (
              <button key={f.id} onClick={() => setTab(i)}
                className="px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border-none"
                style={{
                  backgroundColor: tab === i ? acento : 'transparent',
                  color: tab === i ? 'white' : '#888',
                }}>
                {f.nombre || `Opción ${i + 1}`}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Sección principal: concepto + logos ── */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Columna izquierda */}
          <div className="flex flex-col gap-8">

            {/* Texto */}
            <div>
              {fin.atributo && (
                <p className="text-[11px] font-bold uppercase tracking-[3px] mb-3" style={{ color: acento }}>{fin.atributo}</p>
              )}
              {fin.tagline && (
                <h1 className="text-5xl font-light leading-tight mb-3" style={{ color: darkBg }}>{fin.tagline}</h1>
              )}
              {fin.concepto && (
                <p className="text-base font-medium mb-4" style={{ color: darkBg }}>{fin.concepto}</p>
              )}
              {fin.descripcion && (
                <p className="text-sm leading-[1.8] opacity-50" style={{ color: darkBg }}>{fin.descripcion}</p>
              )}
            </div>

            {/* Cards de logos */}
            {(fin.logos || []).length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {logosEstaticos.map((img, i) => (
                  <div key={i} className="rounded-[22px] border border-[#e8e8e8] bg-white shadow-sm flex items-center justify-center p-8 aspect-video">
                    <img src={img.url} alt={img.titulo || ''} className="max-h-16 max-w-full object-contain" />
                  </div>
                ))}
                {logosOscuros.map((img, i) => (
                  <div key={i} className="rounded-[22px] flex items-center justify-center p-8 aspect-video"
                    style={{ background: `linear-gradient(135deg, ${acento}cc 0%, ${darkBg} 100%)` }}>
                    <img src={img.url} alt={img.titulo || ''} className="max-h-16 max-w-full object-contain" />
                  </div>
                ))}
              </div>
            )}

            {/* Paleta */}
            {(fin.colores || []).length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {fin.colores.map((hex, i) => (
                  <div key={i} className="w-14 h-14 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: hex }} />
                ))}
              </div>
            )}

            {/* Tipografía */}
            {fin.tipografia && (
              <div className="bg-white border border-[#e8e8e8] rounded-[22px] p-6 relative overflow-hidden shadow-sm">
                <div className="relative z-10">
                  <p className="text-[11px] font-bold uppercase tracking-[2px] mb-1" style={{ color: acento }}>Tipografía</p>
                  <p className="text-4xl font-light mb-4" style={{ fontFamily: `'${fin.tipografia}', sans-serif`, color: darkBg }}>
                    {fin.tipografia}
                  </p>
                  <div className="text-[11px] leading-loose opacity-50" style={{ color: darkBg, fontFamily: `'${fin.tipografia}', sans-serif` }}>
                    <p className="font-bold">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                    <p>abcdefghijklmnopqrstuvwxyz</p>
                    <p>1234567890 &apos;?&apos;!(%)[#]@&lt;&amp;&gt;</p>
                  </div>
                </div>
                {/* Aa fantasma */}
                <p className="absolute -right-4 -bottom-6 text-[120px] font-light leading-none pointer-events-none select-none opacity-[0.06]"
                  style={{ fontFamily: `'${fin.tipografia}', sans-serif`, color: darkBg }}>
                  Aa
                </p>
              </div>
            )}
          </div>

          {/* Columna derecha — mockups */}
          {(fin.mockups || []).length > 0 && (
            <div className="flex flex-col gap-3">
              {fin.mockups.map((m, i) => (
                <div key={i} className={`rounded-[22px] overflow-hidden border border-[#e8e8e8] ${i === 0 ? 'aspect-[4/3]' : 'aspect-video'}`}>
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Logo responsivo ── */}
      {(fin.logo_responsivo || []).length > 0 && (
        <section className="py-12 px-6 border-t border-[#f0f0f0]">
          <div className="max-w-6xl mx-auto">
            <p className="text-xl font-medium text-center mb-10" style={{ color: darkBg }}>Logo responsivo</p>
            <div className={`grid divide-x divide-[#f0f0f0] ${fin.logo_responsivo.length <= 2 ? 'grid-cols-2' : fin.logo_responsivo.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
              {fin.logo_responsivo.map((lr, i) => (
                <div key={i} className="flex flex-col items-center gap-6 px-6 py-4">
                  <div className="flex items-center justify-center h-20">
                    <img src={lr.url} alt={lr.titulo || ''} className="max-h-full max-w-[140px] object-contain" />
                  </div>
                  {(lr.titulo || lr.subtitulo) && (
                    <div className="text-center">
                      {lr.titulo && <p className="text-sm font-semibold" style={{ color: darkBg }}>{lr.titulo}</p>}
                      {lr.subtitulo && <p className="text-xs opacity-40 mt-0.5" style={{ color: darkBg }}>{lr.subtitulo}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="py-8 px-8 mt-4" style={{ backgroundColor: darkBg }}>
        <p className="text-center text-[11px] text-white/40 tracking-wide">
          © {new Date().getFullYear()} {proyecto?.nombre} — Propuesta de marca
        </p>
      </footer>

    </div>
  )
}
