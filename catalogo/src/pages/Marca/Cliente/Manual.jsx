import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Download, ExternalLink, Check, X } from 'lucide-react'
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

const PAD = 80 // px padding on each side when downloading

async function downloadSvg(url, nombre) {
  const res = await fetch(url)
  const svgText = await res.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  const svgEl = doc.querySelector('svg')
  if (!svgEl) {
    const blob = new Blob([svgText], { type: 'image/svg+xml' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${nombre}.svg`; a.click(); URL.revokeObjectURL(a.href); return
  }
  const vb = svgEl.getAttribute('viewBox')
  const vbVals = vb ? vb.split(/[\s,]+/).map(Number) : null
  const svgW = vbVals ? vbVals[2] : (parseFloat(svgEl.getAttribute('width')) || 100)
  const svgH = vbVals ? vbVals[3] : (parseFloat(svgEl.getAttribute('height')) || 100)
  // Expand viewBox to add transparent padding
  svgEl.setAttribute('viewBox', `${-PAD} ${-PAD} ${svgW + PAD * 2} ${svgH + PAD * 2}`)
  svgEl.setAttribute('width', svgW + PAD * 2)
  svgEl.setAttribute('height', svgH + PAD * 2)
  const blob = new Blob([new XMLSerializer().serializeToString(doc)], { type: 'image/svg+xml' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${nombre}.svg`; a.click(); URL.revokeObjectURL(a.href)
}

async function downloadPng(url, nombre) {
  const res = await fetch(url)
  const svgText = await res.text()
  const blob = new Blob([svgText], { type: 'image/svg+xml' })
  const objUrl = URL.createObjectURL(blob)
  const img = new window.Image()
  img.onload = () => {
    const ratio = (img.naturalWidth && img.naturalHeight) ? img.naturalWidth / img.naturalHeight : 1
    const logoW = 1200; const logoH = Math.round(1200 / ratio)
    const canvas = document.createElement('canvas')
    canvas.width = logoW + PAD * 2; canvas.height = logoH + PAD * 2
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, PAD, PAD, logoW, logoH)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `${nombre}.png`
    a.click()
    URL.revokeObjectURL(objUrl)
  }
  img.src = objUrl
}

const FRASES_POR_TEMA = {
  juridico: [
    '"El derecho es el arte de hacer lo correcto, incluso cuando nadie está mirando."',
    '"La ley no protege solo los derechos; protege las personas detrás de ellos."',
    '"La confianza se construye con actos, no con palabras. El derecho los respalda."',
    '"Donde hay justicia, hay futuro. Donde hay rigor, hay tranquilidad."',
  ],
  salud: [
    '"Cuidar es más que una profesión; es la forma más profunda de escuchar."',
    '"La salud no es un destino, es el camino que recorremos juntos."',
    '"Detrás de cada tratamiento, hay una persona que merece lo mejor."',
    '"Sanar comienza con confiar. Confiar comienza con presencia."',
  ],
  tecnologia: [
    '"La tecnología no reemplaza lo humano; amplifica lo que somos capaces de crear."',
    '"Innovar es ver el problema antes de que el problema te encuentre."',
    '"El código bien escrito es poesía que solo entienden las máquinas y sus autores."',
    '"Cada solución digital empieza con una pregunta humana."',
  ],
  creativo: [
    '"El diseño no decora el mundo; lo hace más comprensible."',
    '"Una idea bien ejecutada puede cambiar cómo alguien ve su día."',
    '"La creatividad no es talento; es la disciplina de hacerse preguntas incómodas."',
    '"Lo que no se puede ver todavía, ya existe en la mente del diseñador."',
  ],
  gastronomia: [
    '"Una mesa bien puesta no alimenta el cuerpo solo; alimenta el alma."',
    '"El sabor que perdura en la memoria es el que se hizo con intención."',
    '"Cocinar es transformar lo cotidiano en algo que vale la pena recordar."',
    '"Los mejores ingredientes son la técnica, el tiempo y el cuidado."',
  ],
  educacion: [
    '"Aprender no es llenar un recipiente; es encender una llama."',
    '"La educación cambia lo que una persona puede imaginar para sí misma."',
    '"Enseñar bien es saber cuándo hablar y cuándo dejar que el silencio enseñe."',
    '"El conocimiento compartido es el único que crece al darlo."',
  ],
  moda: [
    '"La moda no es lo que se usa; es lo que se dice sin abrir la boca."',
    '"Cada prenda lleva el tiempo y la intención de quien la pensó."',
    '"El estilo es la forma más silenciosa de presentarse al mundo."',
    '"Vestir bien no es vanidad; es respeto por uno mismo y por los demás."',
  ],
  sostenibilidad: [
    '"El futuro no se hereda; se construye con cada decisión del presente."',
    '"Cuidar el planeta no es un costo; es la inversión más importante que existe."',
    '"Lo sostenible no es lo que dura más, sino lo que deja menos huella al pasar."',
    '"Cada acción consciente es un mensaje para las generaciones que aún no nacieron."',
  ],
  generico: [
    '"Las marcas que perduran no venden productos; construyen significado."',
    '"La identidad de una marca vive en los detalles que la mayoría no nota."',
    '"Lo que distingue no es el logo sino la coherencia de cada decisión."',
    '"Una marca fuerte no grita; susurra con tanta claridad que todos la escuchan."',
  ],
}

function generarFrase(tematica, idx) {
  if (!tematica) return FRASES_POR_TEMA.generico[idx % FRASES_POR_TEMA.generico.length]
  const t = tematica.toLowerCase()
  let cat = 'generico'
  if (/juríd|legal|derecho|abogad|notaría|estudio/.test(t)) cat = 'juridico'
  else if (/salud|médic|clinic|hospital|bienestar|nutrici/.test(t)) cat = 'salud'
  else if (/tecnolog|software|digital|datos|desarroll|código|app/.test(t)) cat = 'tecnologia'
  else if (/diseño|creativ|agencia|arte|visual|branding|publicidad/.test(t)) cat = 'creativo'
  else if (/gastro|restaurant|cocina|comida|café|food|catering/.test(t)) cat = 'gastronomia'
  else if (/educaci|escuela|formaci|academia|capacit|enseñ/.test(t)) cat = 'educacion'
  else if (/moda|ropa|indumen|fashion|textil|boutique/.test(t)) cat = 'moda'
  else if (/sostenib|ecológ|verde|sustentab|medio ambiente|reciclaj|renovable/.test(t)) cat = 'sostenibilidad'
  const frases = FRASES_POR_TEMA[cat]
  return frases[idx % frases.length]
}

function getCanvaEmbedUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/(edit|view).*$/, '/view')
    return `https://www.canva.com${path}?embed`
  } catch { return null }
}

// ── Section header (01 ——— LOGOTIPO) ──────────────────────────
function SectionHeader({ num, label }) {
  return (
    <div className="flex items-center gap-6 w-full mb-16">
      <span className="text-[72px] font-bold text-[#ececf0] leading-none shrink-0">{num}</span>
      <div className="flex-1 h-px bg-[#ececf0]" />
      <span className="text-[13px] font-semibold text-[#52586f] uppercase tracking-[1.4px] shrink-0">{label}</span>
    </div>
  )
}

// ── Logo card ─────────────────────────────────────────────────
function LogoCard({ url, label, sub, dark, darkBg, lightBg, nombreBase, onZoom }) {
  const [dl, setDl] = useState('')
  if (!url) return null

  const handle = async (tipo) => {
    setDl(tipo)
    try {
      if (tipo === 'svg') await downloadSvg(url, nombreBase)
      else await downloadPng(url, nombreBase)
    } catch { }
    finally { setDl('') }
  }

  return (
    <div className="flex flex-col gap-3">
      <div onClick={() => onZoom?.({ url, dark, darkBg, lightBg })} className={`w-full h-[200px] rounded-2xl flex items-center justify-center p-6 border border-[#e0e0e6] cursor-zoom-in`}
        style={{ backgroundColor: dark ? (darkBg || '#363645') : (lightBg || '#ffffff') }}>
        <img src={url} alt={label} className="object-contain" style={{ maxHeight: '120px', maxWidth: '100%' }} />
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[#363645]">{label}</p>
        {sub && <p className="text-[12px] text-[#52586f]">{sub}</p>}
      </div>
      <div className="flex gap-2">
        {[['svg','SVG'],['png','PNG']].map(([tipo, lbl]) => (
          <button key={tipo} onClick={() => handle(tipo)} disabled={!!dl}
            className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-[7px] rounded-[10px] border border-[#e0e0e6] text-[#52586f] hover:border-[#363645] hover:text-[#363645] transition-colors cursor-pointer disabled:opacity-50 bg-white">
            {dl === tipo ? <div className="w-3 h-3 rounded-full border border-[#ccc] border-t-[#555] animate-spin" /> : <Download size={11} />}
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}

const LOGO_GRUPOS = [
  { key: 'iso',   label: 'Isotipo',             uso: 'Para espacios pequeños o cuando la marca ya es reconocible sin texto.',  ej: 'App icon, favicon, avatar.',               claro: 'iso_claro',   oscuro: 'iso_oscuro'   },
  { key: 'texto', label: 'Logotipo',             uso: 'Cuando es clave que se lea el nombre completo de la marca.',            ej: 'Documentos, presentaciones, piezas institucionales.', claro: 'texto_claro', oscuro: 'texto_oscuro' },
  { key: 'horiz', label: 'Imagotipo horizontal', uso: 'Uso principal y más versátil.',                                         ej: 'Web, banners, papelería.',                  claro: 'horiz_claro', oscuro: 'horiz_oscuro' },
  { key: 'vert',  label: 'Imagotipo vertical',   uso: 'Para espacios más altos que anchos.',                                   ej: 'Perfiles verticales, roll ups, señalética.', claro: 'vert_claro',  oscuro: 'vert_oscuro'  },
]

const TEMPLATE_CATS = [
  { key: 'foto',    label: 'Foto de perfil', aspect: 'aspect-square'      },
  { key: 'portada', label: 'Portada',        aspect: 'aspect-[16/9]'      },
  { key: 'posts',   label: 'Posts',          aspect: 'aspect-square'      },
]

// ── Main ──────────────────────────────────────────────────────
export default function MarcaManual() {
  const { nombre } = useParams()
  const [proyecto, setProyecto] = useState(null)
  const [manual, setManual] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [copiedIdx, setCopiedIdx] = useState(null)
  const copyTimer = useRef(null)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    const els = document.querySelectorAll('[data-animate]')
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('anim-visible'); observer.unobserve(e.target) } }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  })

  useEffect(() => {
    const cargar = async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nombre)
      const q = db.from('proyectos_marca').select('*')
      const { data: proyectos } = await (isUuid ? q.eq('id', nombre) : q.eq('slug', nombre)).limit(1)
      const p = proyectos?.[0]
      if (!p) { setCargando(false); return }
      setProyecto(p)
      const { data: rows } = await db.from('manual_marca').select('*').eq('proyecto_id', p.id).limit(1)
      const m = rows?.[0] || null
      setManual(m)
      m?.tipografias?.forEach(t => { if (t.nombre) loadGoogleFont(t.nombre) })
      setCargando(false)
    }
    cargar()
  }, [nombre])

  if (cargando) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-[#e3e3e3] border-t-[#363645] animate-spin" />
    </div>
  )

  if (!proyecto) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-[#888] text-sm">Manual no encontrado.</p>
    </div>
  )

  const logos = manual?.logos || {}
  const tematica = manual?.tematica || ''
  const videoUrl = manual?.video_url || ''
  const atributo = manual?.atributo || ''
  const tagline = manual?.tagline || ''
  const concepto = manual?.concepto || ''
  const descripcion = manual?.descripcion || ''
  const colores = manual?.colores || []
  const colorAcento = colores.find(c => c.esAcento) || colores[0]
  const acento = colorAcento?.hex ? (colorAcento.hex.startsWith('#') ? colorAcento.hex : `#${colorAcento.hex}`) : '#c63f3f'
  const colorDark = colores.find(c => c.esDark)
  const darkBg = colorDark?.hex ? (colorDark.hex.startsWith('#') ? colorDark.hex : `#${colorDark.hex}`) : '#363645'
  const colorLight = colores.find(c => c.esLight)
  const lightBg = colorLight?.hex ? (colorLight.hex.startsWith('#') ? colorLight.hex : `#${colorLight.hex}`) : '#ececf0'
  const tipografias = manual?.tipografias || []
  const mockups = manual?.mockups || []
  const usosCorrectos = manual?.usos_correctos || []
  const usosIncorrectos = manual?.usos_incorrectos || []
  const templates = manual?.templates || {}
  const nombreMarca = proyecto.nombre?.toLowerCase().replace(/\s+/g, '-') || 'logo'

  const hayLogos = LOGO_GRUPOS.some(g => logos[g.claro] || logos[g.oscuro])
  const hayColores = colores.length > 0
  const hayTipos = tipografias.length > 0
  const hayMockups = mockups.length > 0
  const hayUsos = usosCorrectos.length > 0 || usosIncorrectos.length > 0
  const hayTemplates = TEMPLATE_CATS.some(({ key }) => (templates[key] || []).some(t => t?.preview_url || t?.canva_url))

  let sectionNum = 0
  const nextNum = () => String(++sectionNum).padStart(2, '0')

  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif]">
      <style>{`
        [data-animate] { opacity: 0; transform: translateY(28px); transition: opacity 0.6s ease, transform 0.6s ease; }
        [data-animate].anim-visible { opacity: 1; transform: translateY(0); }
        [data-animate][data-delay="1"] { transition-delay: 0.1s; }
        [data-animate][data-delay="2"] { transition-delay: 0.2s; }
        [data-animate][data-delay="3"] { transition-delay: 0.3s; }
      `}</style>

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          <div
            onClick={e => e.stopPropagation()}
            className="rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ backgroundColor: lightbox.dark ? (lightbox.darkBg || '#363645') : (lightbox.lightBg || '#ffffff'), maxWidth: '60vw' }}
          >
            <div className="flex justify-end px-4 pt-4">
              <button onClick={() => setLightbox(null)} className={`cursor-pointer bg-transparent border-none p-1 ${lightbox.dark ? 'text-white/50 hover:text-white' : 'text-black/30 hover:text-black/70'}`}>
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center px-10 py-10">
              <img src={lightbox.url} alt="" style={{ width: '50vw', maxHeight: '35vh', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="min-h-[600px] flex flex-col items-center justify-center px-8 py-24 relative overflow-hidden bg-[#1a1a1a]">
        {/* Video de fondo */}
        {videoUrl && (
          <video
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src={videoUrl}
          />
        )}
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative flex flex-col items-center gap-8 max-w-[560px] text-center">
          {/* Logo horizontal oscuro */}
          {logos['horiz_oscuro'] && (
            <img src={logos['horiz_oscuro']} alt={proyecto.nombre} className="h-20 sm:h-28 w-auto object-contain" />
          )}
          {!logos['horiz_oscuro'] && (
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-none tracking-tight">{proyecto.nombre}</h1>
          )}
          <div className="w-16 h-px bg-white/20" />
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[2px]">Guía de Identidad de Marca</p>
        </div>
        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-10 bg-white" />
          <p className="text-[10px] text-white uppercase tracking-[2px]">Scroll</p>
        </div>
      </div>

      {/* CONCEPTO */}
      {(atributo || tagline || concepto || descripcion) && (
        <div data-animate className="max-w-[1024px] mx-auto px-6 sm:px-12 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div className="flex flex-col gap-5">
              {atributo && (
                <p className="text-[11px] font-bold uppercase tracking-[1.4px]" style={{ color: acento }}>{atributo}</p>
              )}
              {tagline && (
                <h2 className="text-[64px] sm:text-[80px] font-bold text-[#363645] leading-none">{tagline}</h2>
              )}
              {concepto && (
                <p className="text-[18px] font-bold text-[#363645] leading-snug">{concepto}</p>
              )}
              {descripcion && (
                <p className="text-[15px] text-[#52586f] leading-relaxed">{descripcion}</p>
              )}
            </div>
            {/* Logo card */}
            <div className="flex items-center justify-center">
              {(logos['horiz_claro'] || logos['iso_claro'] || logos['horiz_oscuro']) && (
                <div className="w-full max-w-[360px] border border-[#e8e8ee] rounded-2xl p-10 flex items-center justify-center" style={{ backgroundColor: lightBg }}>
                  <img
                    src={logos['horiz_claro'] || logos['iso_claro'] || logos['horiz_oscuro']}
                    alt={proyecto.nombre}
                    className="max-h-[120px] max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LOGOS */}
      {hayLogos && (
        <div data-animate className="max-w-[1024px] mx-auto px-6 sm:px-12 py-24">
          <SectionHeader num={nextNum()} label="Logotipo" />
          <div className="flex flex-col gap-16">
            {LOGO_GRUPOS.map(({ key, label, uso, ej, claro, oscuro }) => {
              const urlClaro = logos[claro]
              const urlOscuro = logos[oscuro]
              if (!urlClaro && !urlOscuro) return null
              return (
                <div key={key} className="py-8 border-b border-[#ececf0] last:border-b-0">
                  <p className="text-[18px] font-semibold text-[#363645] mb-2">{label}</p>
                  <div className="flex flex-col gap-0.5 mb-6">
                    {uso && <p className="text-[14px] text-[#52586f]">{uso}</p>}
                    {ej && <p className="text-[13px] text-[#aaa]"><span className="font-semibold text-[#888]">Ej:</span> {ej}</p>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {urlClaro && <LogoCard url={urlClaro} label="Fondo claro" dark={false} darkBg={darkBg} lightBg={lightBg} nombreBase={`${nombreMarca}-${claro}`} onZoom={v => setLightbox(v)} />}
                    {urlOscuro && <LogoCard url={urlOscuro} label="Fondo oscuro" dark={true} darkBg={darkBg} lightBg={lightBg} nombreBase={`${nombreMarca}-${oscuro}`} onZoom={v => setLightbox(v)} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* COLORES — full width, fondo oscuro */}
      {hayColores && (
        <div style={{ backgroundColor: darkBg }}>
          {/* Header dentro del fondo oscuro */}
          <div className="max-w-[1024px] mx-auto px-6 sm:px-12 pt-20 pb-16">
            <div className="flex items-center gap-6 w-full">
              <span className="text-[72px] font-bold text-white/20 leading-none shrink-0">{nextNum()}</span>
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-[13px] font-semibold text-white/30 uppercase tracking-[1.4px] shrink-0">Paleta de colores</span>
            </div>
          </div>
          {/* Strips — vertical en mobile, horizontal en desktop */}
          <div className="flex flex-col sm:flex-row sm:h-[360px]">
            {colores.map((c, i) => {
              const hex = c.hex?.startsWith('#') ? c.hex : `#${c.hex}`
              const r = parseInt(hex.slice(1,3),16)
              const g = parseInt(hex.slice(3,5),16)
              const b = parseInt(hex.slice(5,7),16)
              const isLight = r*0.299 + g*0.587 + b*0.114 > 160
              const tc = isLight ? 'text-[#363645]' : 'text-white'
              const copied = copiedIdx === i
              return (
                <div
                  key={i}
                  className="sm:flex-1 flex flex-col justify-end p-6 sm:p-10 cursor-pointer select-none transition-all min-h-[100px] sm:min-h-0"
                  style={{ background: hex }}
                  onClick={() => {
                    navigator.clipboard.writeText(hex.toUpperCase()).catch(() => {})
                    setCopiedIdx(i)
                    clearTimeout(copyTimer.current)
                    copyTimer.current = setTimeout(() => setCopiedIdx(null), 1800)
                  }}
                  title="Clic para copiar"
                >
                  {c.nombre && <p className={`text-[16px] sm:text-[18px] font-semibold mb-1 ${tc}`}>{c.nombre}</p>}
                  <p className={`text-[12px] sm:text-[13px] font-mono uppercase ${tc} opacity-80`}>
                    {copied ? '¡Copiado!' : hex.toUpperCase()}
                  </p>
                  <p className={`text-[11px] font-mono ${tc} opacity-50 mt-0.5`}>RGB {r} · {g} · {b}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* REST OF CONTENT */}
      <div className="max-w-[1024px] mx-auto px-6 sm:px-12 py-24 flex flex-col gap-24">

        {/* TIPOGRAFÍA */}
        {hayTipos && (
          <div data-animate>
            <SectionHeader num={nextNum()} label="Tipografía" />
            <div className="flex flex-col gap-20">
              {tipografias.map((t, i) => {
                const frase = t.frase || generarFrase(tematica, i)
                const isEven = i % 2 === 0

                const gfUrl = t.url || (t.nombre ? `https://fonts.google.com/specimen/${encodeURIComponent(t.nombre)}` : null)

                const infoPanel = (
                  <div className={`flex flex-col gap-4 ${isEven ? 'order-1' : 'order-1 sm:order-2'}`}>
                    <p className="text-[11px] font-bold uppercase tracking-[1.2px]" style={{ color: acento }}>{i === 0 ? 'Fuente principal' : 'Fuente secundaria'}</p>
                    <p className="text-[72px] sm:text-[88px] font-normal leading-none text-[#363645]" style={{ fontFamily: `'${t.nombre}', sans-serif` }}>{t.nombre}</p>
                    {t.uso && <p className="text-[14px] text-[#52586f] leading-relaxed">{t.uso}</p>}
                    <div className="flex flex-col gap-2 pt-2">
                      {['Light','Regular','Bold','Black'].map(w => (
                        <div key={w} className="flex items-baseline gap-6">
                          <span className="text-[12px] text-[#52586f] w-14 shrink-0">{w}</span>
                          <span className="text-[22px] text-[#363645]" style={{ fontFamily: `'${t.nombre}', sans-serif`, fontWeight: w === 'Light' ? 300 : w === 'Regular' ? 400 : w === 'Bold' ? 700 : 900 }}>
                            Aa Bb Cc 123
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      {gfUrl && (
                        <a href={gfUrl} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-[7px] rounded-[10px] border border-[#e0e0e6] text-[#52586f] hover:border-[#363645] hover:text-[#363645] transition-colors no-underline bg-white">
                          <ExternalLink size={11} /> Google Fonts
                        </a>
                      )}
                      {t.archivo_url && (
                        <button onClick={() => {
                          fetch(t.archivo_url).then(r => r.blob()).then(b => {
                            const a = document.createElement('a')
                            a.href = URL.createObjectURL(b); a.download = t.archivo_nombre || 'fuente'; a.click()
                          })
                        }} className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-[7px] rounded-[10px] border border-[#e0e0e6] text-[#52586f] hover:border-[#363645] hover:text-[#363645] transition-colors cursor-pointer bg-white">
                          <Download size={11} /> Descargar fuente
                        </button>
                      )}
                    </div>
                  </div>
                )

                const specimenPanel = (
                  <div className={`flex flex-col gap-4 ${isEven ? 'order-2' : 'order-2 sm:order-1'}`}>
                    <div className="rounded-2xl p-8 overflow-hidden" style={{ backgroundColor: lightBg, fontFamily: `'${t.nombre}', sans-serif` }}>
                      <p className="text-[13px] font-bold text-[#52586f] tracking-[1.4px] mb-1">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                      <p className="text-[13px] text-[#52586f] mb-1">abcdefghijklmnopqrstuvwxyz</p>
                      <p className="text-[13px] text-[#52586f] mb-1">1234567890</p>
                      <p className="text-[13px] text-[#52586f]">!@#$%&*().,;:'"-+=/</p>
                    </div>
                    <div className="rounded-2xl p-8 sm:p-10" style={{ backgroundColor: darkBg, fontFamily: `'${t.nombre}', sans-serif` }}>
                      <p className="text-[22px] sm:text-[26px] font-light text-white leading-snug italic">
                        {frase}
                      </p>
                    </div>
                  </div>
                )

                return (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-12 items-start">
                    {infoPanel}
                    {specimenPanel}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* APLICACIONES / MOCKUPS */}
        {hayMockups && (
          <div data-animate>
            <SectionHeader num={nextNum()} label="Aplicaciones" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {mockups.map((m, i) => (
                <div key={i} className="rounded-2xl overflow-hidden flex items-end justify-center pt-6 px-6 min-h-[280px]" style={{ backgroundColor: lightBg }}>
                  <img src={m.url} alt={m.caption || ''} className="w-full max-h-[260px] object-contain object-bottom" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USOS */}
        {hayUsos && (
          <div data-animate>
            <SectionHeader num={nextNum()} label="Uso del logotipo" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {usosCorrectos.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-green-700 uppercase tracking-[1.2px] mb-5">✓ Usos correctos</p>
                  <div className="flex flex-col gap-3">
                    {usosCorrectos.map((u, i) => (
                      <div key={i} className="flex gap-3 items-start bg-green-50 rounded-2xl p-4">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={11} className="text-white" />
                        </div>
                        <div className="flex-1">
                          {u.texto && <p className="text-[14px] text-[#363645]">{u.texto}</p>}
                          {u.imagen_url && <img src={u.imagen_url} alt="" className="mt-2 w-full max-h-[120px] object-contain rounded-xl bg-white border border-green-100" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {usosIncorrectos.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-red-600 uppercase tracking-[1.2px] mb-5">✕ Usos incorrectos</p>
                  <div className="flex flex-col gap-3">
                    {usosIncorrectos.map((u, i) => (
                      <div key={i} className="flex gap-3 items-start bg-red-50 rounded-2xl p-4">
                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                          <X size={11} className="text-white" />
                        </div>
                        <div className="flex-1">
                          {u.texto && <p className="text-[14px] text-[#363645]">{u.texto}</p>}
                          {u.imagen_url && <img src={u.imagen_url} alt="" className="mt-2 w-full max-h-[120px] object-contain rounded-xl bg-white border border-red-100" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TEMPLATES REDES */}
        {hayTemplates && (
          <div data-animate>
            <SectionHeader num={nextNum()} label="Templates para redes" />
            <div className="flex flex-col gap-12">
              {TEMPLATE_CATS.map(({ key, label, aspect }) => {
                const items = (templates[key] || []).filter(t => t?.preview_url || t?.canva_url)
                if (!items.length) return null
                const isPortada = key === 'portada'
                return (
                  <div key={key}>
                    <p className="text-[13px] font-semibold text-[#52586f] uppercase tracking-[1.4px] mb-6">{label}</p>
                    <div className={`grid gap-4 ${isPortada ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                      {items.map((tmpl, i) => (
                        <div key={i} className="flex flex-col gap-3">
                          {tmpl.preview_url ? (
                            <div className={`rounded-2xl overflow-hidden ${aspect} w-full`} style={{ backgroundColor: lightBg }}>
                              <img src={tmpl.preview_url} alt={label} className="w-full h-full object-cover" />
                            </div>
                          ) : getCanvaEmbedUrl(tmpl.canva_url) ? (
                            <div className={`rounded-2xl overflow-hidden ${aspect} w-full bg-[#f5f5f5] border border-[#e8e8ee]`}>
                              <iframe
                                src={getCanvaEmbedUrl(tmpl.canva_url)}
                                className="w-full h-full border-0 pointer-events-none"
                                allow="fullscreen"
                                loading="lazy"
                                title={label}
                              />
                            </div>
                          ) : (
                            <div className={`rounded-2xl ${aspect} w-full flex items-center justify-center`} style={{ backgroundColor: lightBg }}>
                              <p className="text-[12px] text-[#aaa]">Sin preview</p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            {tmpl.preview_url && (
                              <button
                                onClick={async () => {
                                  const res = await fetch(tmpl.preview_url)
                                  const blob = await res.blob()
                                  const ext = tmpl.preview_url.split('?')[0].split('.').pop() || 'jpg'
                                  const a = document.createElement('a')
                                  a.href = URL.createObjectURL(blob)
                                  a.download = `template.${ext}`
                                  a.click()
                                  URL.revokeObjectURL(a.href)
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium py-2 rounded-xl border border-[#e0e0e6] bg-white text-[#52586f] hover:border-[#363645] hover:text-[#363645] transition-colors cursor-pointer">
                                <Download size={11} /> Descargar
                              </button>
                            )}
                            {tmpl.canva_url && (
                              <a href={tmpl.canva_url} target="_blank" rel="noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium py-2 rounded-xl border border-[#e0e0e6] bg-white text-[#52586f] hover:border-[#363645] hover:text-[#363645] transition-colors no-underline">
                                <ExternalLink size={11} /> Editar en Canva
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hayLogos && !hayColores && !hayTipos && !hayMockups && !hayUsos && !hayTemplates && (
          <div className="py-24 text-center">
            <p className="text-[#bbb] text-sm">El manual todavía no tiene contenido.</p>
          </div>
        )}

      </div>

      {/* FOOTER */}
      <div className="px-8 sm:px-16 py-12" style={{ backgroundColor: darkBg }}>
        <div className="max-w-[1024px] mx-auto flex items-center justify-between">
          <img src="/logo-ordo.svg" alt="ORDO" className="h-4 w-auto opacity-30 invert" />
          <div className="text-right">
            <p className="text-[12px] text-white/40">Guía de Identidad de Marca · {new Date().getFullYear()}</p>
            <p className="text-[12px] text-white/30 mt-0.5">{proyecto.nombre}</p>
          </div>
        </div>
      </div>

    </div>
  )
}
