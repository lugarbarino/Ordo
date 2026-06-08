import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../../../lib/supabase'
import { X, ZoomIn } from 'lucide-react'

// ── Lightbox ──────────────────────────────────────────────────
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border-none cursor-pointer">
        <X size={18} />
      </button>
      <img src={src} alt="" className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl cursor-default" onClick={e => e.stopPropagation()} />
    </div>
  )
}

// ── ColorModal ────────────────────────────────────────────────
function ColorModal({ colores, onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-[24px] overflow-hidden flex shadow-2xl cursor-default relative" style={{ maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white border-none cursor-pointer">
          <X size={14} />
        </button>
        {colores.map((c, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end pb-8 pt-16 px-4" style={{ backgroundColor: c.hex }}>
            <p className="text-sm font-bold text-center" style={{ color: c.hex < '#888888' ? 'white' : '#1c1c1c' }}>{c.nombre || `Color ${i+1}`}</p>
            <p className="text-xs text-center opacity-70 mt-1" style={{ color: c.hex < '#888888' ? 'white' : '#1c1c1c' }}>{c.hex}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

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
  const [lightbox, setLightbox] = useState(null)
  const [colorModal, setColorModal] = useState(false)

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

  // logos por orden de carga — 0=claro izq, 1=oscuro der, 2=cuadrado, 3=logotipo
  const logo1 = logos[1]  // claro → col izq (abajo del texto)
  const logo2 = logos[0]  // oscuro → col der (grande, cuadrado)
  const logo3 = logos[2]  // cuadrado acento
  const logo4 = logos[3]  // logotipo

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
                backgroundColor: tab === i ? darkBg : 'transparent',
                color: tab === i ? 'white' : '#888',
              }}>
              {f.nombre || `Opción ${i + 1}`}
            </button>
          ))}
        </div>
      </header>

      {/* ── Contenido principal ── */}
      <div className="px-6 md:px-10 max-w-5xl mx-auto pb-16">

        {/* ── Fila 1: texto+logo angosto / logo cuadrado der ── */}
        <div className="grid grid-cols-1 md:grid-cols-[45%_1fr] gap-4 mb-4 md:items-end">

          {/* Col izq angosta: texto + logo claro */}
          <div className="flex flex-col gap-6">
            <div className="pt-4">
              {fin.atributo && <p className="text-xs font-bold uppercase tracking-[2px] mb-2 text-[#aaa]">{fin.atributo}</p>}
              {fin.tagline && <h1 className="text-5xl font-light leading-tight mb-2" style={{ color: darkBg }}>{fin.tagline}</h1>}
              {fin.concepto && <p className="text-base font-medium mb-3" style={{ color: darkBg }}>{fin.concepto}</p>}
              {fin.descripcion && <p className="text-sm leading-relaxed opacity-40" style={{ color: darkBg }}>{fin.descripcion}</p>}
            </div>
            {logo1 && (
              <div className="rounded-[22px] border border-[#ececf0] overflow-hidden cursor-zoom-in relative group" style={{ aspectRatio: '4/3' }}
                onClick={() => setLightbox(logo1.url)}>
                <img src={logo1.url} alt={logo1.titulo || ''} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                </div>
              </div>
            )}
          </div>

          {/* Col der cuadrada: logo oscuro */}
          {logo2 && (
            <div className="rounded-[22px] overflow-hidden cursor-zoom-in relative group" style={{ aspectRatio: '1/1', backgroundColor: darkBg }}
              onClick={() => setLightbox(logo2.url)}>
              <img src={logo2.url} alt={logo2.titulo || ''} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
              </div>
            </div>
          )}
        </div>

        {/* ── Fila 2: rectángulo con cuadrado adentro / tipografía ── */}
        <div className="grid grid-cols-1 md:grid-cols-[45%_1fr] gap-4 mb-4 md:items-stretch">

          {/* Col izq: rectángulo con cuadrado redondeado adentro */}
          {(logo3 || logo4) && (
            <div className="rounded-[22px] border border-[#ececf0] flex p-3 gap-3">
              {logo3 && (
                <div className="shrink-0 rounded-[16px] overflow-hidden" style={{ width: '45%', aspectRatio: '1/1' }}>
                  <img src={logo3.url} alt={logo3.titulo || ''} className="w-full h-full object-cover" />
                </div>
              )}
              {logo4 && (
                <div className="flex-1 flex items-center justify-center p-4">
                  <img src={logo4.url} alt={logo4.titulo || ''} className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          )}

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

        {/* ── Fila 3: colores centrados al mockup / mockup der ── */}
        {((fin.colores || []).length > 0 || mockups.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* Col izq: colores centrados + primer mockup */}
            <div className="flex flex-col gap-4">
              {(fin.colores || []).length > 0 && (
                <div className="flex gap-3 justify-center flex-wrap py-2 cursor-pointer" onClick={() => setColorModal(true)}>
                  {fin.colores.map((c, i) => (
                    <div key={i} className="w-[64px] h-[64px] rounded-full shadow-md border-4 border-white transition-transform hover:scale-110"
                      style={{ backgroundColor: c.hex || c }} />
                  ))}
                </div>
              )}
              {mockups[0] && (
                <div className="rounded-[22px] overflow-hidden cursor-zoom-in relative group" style={{ aspectRatio: '4/3' }}
                  onClick={() => setLightbox(mockups[0].url)}>
                  <img src={mockups[0].url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                  </div>
                </div>
              )}
            </div>

            {/* Col der: segundo mockup */}
            {mockups[1] && (
              <div className="rounded-[22px] overflow-hidden cursor-zoom-in relative group" style={{ minHeight: 300 }}
                onClick={() => setLightbox(mockups[1].url)}>
                <img src={mockups[1].url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* mockups extras */}
        {mockups.length > 2 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {mockups.slice(2).map((m, i) => (
              <div key={i} className="rounded-[22px] overflow-hidden aspect-video cursor-zoom-in relative group"
                onClick={() => setLightbox(m.url)}>
                <img src={m.url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Logo responsivo ── */}
        {logoResp.length > 0 && (
          <div className="mt-8">
            <p className="text-xl font-medium text-center mb-8" style={{ color: darkBg }}>Logo responsivo</p>
            <div className={`grid border border-[#ececf0] rounded-[22px] overflow-hidden divide-x divide-[#ececf0]
              ${logoResp.length <= 2 ? 'grid-cols-2' : logoResp.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
              {logoResp.map((lr, i) => (
                <div key={i} className="flex flex-col gap-4 p-6">
                  {(lr.titulo || lr.subtitulo) && (
                    <div>
                      {lr.titulo && <p className="text-sm font-semibold" style={{ color: darkBg }}>{lr.titulo}</p>}
                      {lr.subtitulo && <p className="text-xs opacity-40 mt-0.5" style={{ color: darkBg }}>{lr.subtitulo}</p>}
                    </div>
                  )}
                  <div className="flex items-center justify-start h-20 cursor-zoom-in" onClick={() => setLightbox(lr.url)}>
                    <img src={lr.url} alt={lr.titulo || ''} className="max-h-full max-w-[140px] object-contain" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Modales ── */}
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      {colorModal && fin.colores?.length > 0 && (
        <ColorModal colores={fin.colores.map((c, i) => ({ hex: c.hex || c, nombre: c.nombre || `Color ${i+1}` }))} onClose={() => setColorModal(false)} />
      )}

      {/* ── Footer ── */}
      <footer className="py-8 px-8" style={{ backgroundColor: darkBg }}>
        <p className="text-center text-[11px] text-white/40 tracking-wide">
          © {new Date().getFullYear()} {proyecto?.nombre} — Propuesta de marca
        </p>
      </footer>

    </div>
  )
}
