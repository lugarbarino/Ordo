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
  const logos = fin.logos || []
  const mockups = fin.mockups || []
  const logoResp = fin.logo_responsivo || []

  // logos por posición
  const logo1 = logos[0]  // grande blanco (izq arriba)
  const logo2 = logos[1]  // grande oscuro (der arriba)
  const logo3 = logos[2]  // cuadrado acento (izq medio)
  const logo4 = logos[3]  // tarjeta blanca (izq medio)

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Header con tabs ── */}
      <header className="px-8 py-4 flex items-center justify-between">
        <p className="text-sm font-medium opacity-40" style={{ color: darkBg }}>{proyecto.nombre}</p>
        <div className="flex items-center bg-[#f0f0f0] rounded-full p-1 gap-0.5">
          {finalistas.map((f, i) => (
            <button key={f.id} onClick={() => setTab(i)}
              className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer border-none"
              style={{
                backgroundColor: tab === i ? acento : 'transparent',
                color: tab === i ? 'white' : '#888',
              }}>
              {f.nombre || `Opción ${i + 1}`}
            </button>
          ))}
        </div>
      </header>

      {/* ── Contenido principal ── */}
      <div className="px-6 md:px-10 max-w-5xl mx-auto pb-16">

        {/* ── Fila 1: texto + logo claro / logo oscuro grande ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

          {/* Col izq: texto + logo claro */}
          <div className="flex flex-col gap-6">
            <div className="pt-4">
              {fin.atributo && <p className="text-xs font-bold uppercase tracking-[2px] mb-2" style={{ color: acento }}>{fin.atributo}</p>}
              {fin.tagline && <h1 className="text-5xl font-light leading-tight mb-2" style={{ color: darkBg }}>{fin.tagline}</h1>}
              {fin.concepto && <p className="text-base font-medium mb-3" style={{ color: darkBg }}>{fin.concepto}</p>}
              {fin.descripcion && <p className="text-sm leading-relaxed opacity-40" style={{ color: darkBg }}>{fin.descripcion}</p>}
            </div>

            {/* Logo claro grande */}
            {logo1 && (
              <div className="rounded-[22px] overflow-hidden border border-[#ececf0] aspect-[4/3]">
                <img src={logo1.url} alt={logo1.titulo || ''} className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Col der: logo oscuro grande */}
          {logo2 && (
            <div className="rounded-[22px] overflow-hidden aspect-[4/3]">
              <img src={logo2.url} alt={logo2.titulo || ''} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* ── Fila 2: logo acento + logo pequeño / tipografía ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

          {/* Col izq: acento + logo pequeño */}
          <div className="grid grid-cols-2 gap-4">
            {logo3 && (
              <div className="rounded-[22px] overflow-hidden aspect-square flex items-center justify-center p-6"
                style={{ backgroundColor: acento }}>
                <img src={logo3.url} alt={logo3.titulo || ''} className="max-w-full max-h-full object-contain" />
              </div>
            )}
            {logo4 && (
              <div className="rounded-[22px] overflow-hidden aspect-square border border-[#ececf0]">
                <img src={logo4.url} alt={logo4.titulo || ''} className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Col der: tipografía */}
          {fin.tipografia && (
            <div className="rounded-[22px] border border-[#ececf0] bg-white p-8 relative overflow-hidden">
              <p className="text-[11px] font-bold uppercase tracking-[2px] mb-1" style={{ color: acento }}>Tipografía</p>
              <p className="text-4xl font-light mb-5" style={{ fontFamily: `'${fin.tipografia}', sans-serif`, color: darkBg }}>
                {fin.tipografia}
              </p>
              <div className="text-[11px] leading-loose opacity-40 relative z-10" style={{ color: darkBg, fontFamily: `'${fin.tipografia}', sans-serif` }}>
                <p className="font-bold">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                <p>abcdefghijklmnopqrstuvwxyz</p>
                <p>1234567890</p>
                <p>{'\'?\'?!(%)[#]@<&>-_+=~'}</p>
              </div>
              <p className="absolute right-2 bottom-0 text-[110px] font-light leading-none pointer-events-none select-none opacity-[0.07]"
                style={{ fontFamily: `'${fin.tipografia}', sans-serif`, color: darkBg }}>
                Aa
              </p>
            </div>
          )}
        </div>

        {/* ── Fila 3: colores + mockup izq / mockup grande der ── */}
        {((fin.colores || []).length > 0 || mockups.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* Col izq: colores + primer mockup */}
            <div className="flex flex-col gap-4">
              {(fin.colores || []).length > 0 && (
                <div className="flex gap-3 flex-wrap items-center py-2">
                  {fin.colores.map((hex, i) => (
                    <div key={i} className="w-[72px] h-[72px] rounded-full shadow-md border-4 border-white" style={{ backgroundColor: hex }} />
                  ))}
                </div>
              )}
              {mockups[0] && (
                <div className="rounded-[22px] overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  <img src={mockups[0].url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Col der: segundo mockup */}
            {mockups[1] && (
              <div className="rounded-[22px] overflow-hidden" style={{ minHeight: 300 }}>
                <img src={mockups[1].url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        )}

        {/* mockups extras */}
        {mockups.length > 2 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {mockups.slice(2).map((m, i) => (
              <div key={i} className="rounded-[22px] overflow-hidden aspect-video">
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* ── Logo responsivo ── */}
        {logoResp.length > 0 && (
          <div className="mt-8">
            <p className="text-xl font-medium text-center mb-8" style={{ color: darkBg }}>Logo responsivo</p>
            <div className={`grid border border-[#ececf0] rounded-[22px] overflow-hidden divide-x divide-[#ececf0]
              ${logoResp.length <= 2 ? 'grid-cols-2' : logoResp.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
              {logoResp.map((lr, i) => (
                <div key={i} className="flex flex-col gap-4 p-6">
                  {(lr.titulo || lr.subtitulo) && (
                    <div>
                      {lr.titulo && <p className="text-sm font-semibold" style={{ color: darkBg }}>{lr.titulo}</p>}
                      {lr.subtitulo && <p className="text-xs opacity-40 mt-0.5" style={{ color: darkBg }}>{lr.subtitulo}</p>}
                    </div>
                  )}
                  <div className="flex items-center justify-start h-20">
                    <img src={lr.url} alt={lr.titulo || ''} className="max-h-full max-w-[140px] object-contain" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="py-8 px-8" style={{ backgroundColor: darkBg }}>
        <p className="text-center text-[11px] text-white/40 tracking-wide">
          © {new Date().getFullYear()} {proyecto?.nombre} — Propuesta de marca
        </p>
      </footer>

    </div>
  )
}
