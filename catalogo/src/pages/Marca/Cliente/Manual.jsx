import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Download, ExternalLink, Check, X } from 'lucide-react'
import { db } from '../../../lib/supabase'

function loadGoogleFont(nombre) {
  if (!nombre) return
  const id = `gfont-${nombre.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id; link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(nombre)}:wght@400;700&display=swap`
  document.head.appendChild(link)
}

async function downloadSvg(url, nombre) {
  const res = await fetch(url)
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${nombre}.svg`
  a.click()
  URL.revokeObjectURL(a.href)
}

async function downloadPng(url, nombre) {
  const res = await fetch(url)
  const svgText = await res.text()
  const blob = new Blob([svgText], { type: 'image/svg+xml' })
  const objUrl = URL.createObjectURL(blob)
  const img = new window.Image()
  img.onload = () => {
    const ratio = (img.naturalWidth && img.naturalHeight) ? img.naturalWidth / img.naturalHeight : 1
    const w = 1200; const h = Math.round(1200 / ratio)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `${nombre}.png`
    a.click()
    URL.revokeObjectURL(objUrl)
  }
  img.src = objUrl
}

// ── Logo card ─────────────────────────────────────────────────
function LogoCard({ url, label, dark, nombreBase }) {
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
      <div className={`w-full h-[140px] rounded-2xl flex items-center justify-center p-6 ${dark ? 'bg-[#1a1a1a]' : 'bg-[#f5f5f5]'}`}>
        <img src={url} alt={label} className="max-h-[100px] max-w-[85%] object-contain" />
      </div>
      <div className="flex gap-2">
        {[['svg','SVG'],['png','PNG']].map(([tipo, lbl]) => (
          <button key={tipo} onClick={() => handle(tipo)} disabled={!!dl}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg border border-[#e3e3e3] bg-white text-[#555] hover:border-[#1c1c1c] hover:text-[#1c1c1c] transition-colors cursor-pointer disabled:opacity-50">
            {dl === tipo ? <div className="w-3 h-3 rounded-full border border-[#ccc] border-t-[#555] animate-spin" /> : <Download size={11} />}
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Sections ──────────────────────────────────────────────────
const LOGO_GRUPOS = [
  { key: 'iso',   label: 'Isotipo',    claro: 'iso_claro',    oscuro: 'iso_oscuro'   },
  { key: 'texto', label: 'Solo texto', claro: 'texto_claro',  oscuro: 'texto_oscuro' },
  { key: 'horiz', label: 'Horizontal', claro: 'horiz_claro',  oscuro: 'horiz_oscuro' },
  { key: 'vert',  label: 'Vertical',   claro: 'vert_claro',   oscuro: 'vert_oscuro'  },
]

const REDES_LABELS = {
  ig_post:    'Instagram Post',
  ig_story:   'Instagram Story',
  fb_portada: 'Facebook Portada',
  li_portada: 'LinkedIn Portada',
  li_post:    'LinkedIn Post',
  canva_1:    'Template 1',
  canva_2:    'Template 2',
  canva_3:    'Template 3',
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-4 my-16">
      <div className="flex-1 h-px bg-[#e8e8e8]" />
      <span className="text-xs font-semibold text-[#bbb] uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-[#e8e8e8]" />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function MarcaManual() {
  const { nombre } = useParams()
  const [proyecto, setProyecto] = useState(null)
  const [manual, setManual] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data: proyectos } = await db.from('proyectos_marca').select('*').or(`slug.eq.${nombre},id.eq.${nombre}`).limit(1)
      const p = proyectos?.[0]
      if (!p) { setCargando(false); return }
      setProyecto(p)
      const { data: rows } = await db.from('manual_marca').select('*').eq('proyecto_id', p.id).limit(1)
      const m = rows?.[0] || null
      setManual(m)
      // Precargar Google Fonts
      m?.tipografias?.forEach(t => { if (t.nombre) loadGoogleFont(t.nombre) })
      setCargando(false)
    }
    cargar()
  }, [nombre])

  if (cargando) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-[#e3e3e3] border-t-[#1c1c1c] animate-spin" />
    </div>
  )

  if (!proyecto) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-[#888] text-sm">Manual no encontrado.</p>
    </div>
  )

  const logos = manual?.logos || {}
  const colores = manual?.colores || []
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
  const hayTemplates = Object.values(templates).some(t => t?.preview_url || t?.canva_url)

  const vacio = !hayLogos && !hayColores && !hayTipos && !hayMockups && !hayUsos && !hayTemplates

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="border-b border-[#f0f0f0] px-6 sm:px-16 py-5 flex items-center justify-between sticky top-0 bg-white z-10">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-5 w-auto opacity-60" />
        <p className="text-sm font-semibold text-[#1c1c1c]">{proyecto.nombre}</p>
      </header>

      {/* Hero */}
      <div className="bg-[#1c1c1c] px-6 sm:px-16 py-20 sm:py-28">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-[0.2em] mb-4">Manual de marca</p>
        <h1 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tight">{proyecto.nombre}</h1>
      </div>

      {/* Content */}
      <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-16">

        {vacio && (
          <div className="text-center py-20">
            <p className="text-[#bbb] text-sm">El manual todavía no tiene contenido.</p>
          </div>
        )}

        {/* LOGOS */}
        {hayLogos && (
          <>
            <Divider label="Logotipo" />
            <div className="flex flex-col gap-12">
              {LOGO_GRUPOS.map(({ key, label, claro, oscuro }) => {
                const urlClaro = logos[claro]
                const urlOscuro = logos[oscuro]
                if (!urlClaro && !urlOscuro) return null
                return (
                  <div key={key}>
                    <p className="text-xs font-semibold text-[#aaa] uppercase tracking-widest mb-4">{label}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {urlClaro && <LogoCard url={urlClaro} label={`${label} — fondo claro`} dark={false} nombreBase={`${nombreMarca}-${claro}`} />}
                      {urlOscuro && <LogoCard url={urlOscuro} label={`${label} — fondo oscuro`} dark={true} nombreBase={`${nombreMarca}-${oscuro}`} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* COLORES */}
        {hayColores && (
          <>
            <Divider label="Paleta de colores" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {colores.map((c, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="w-full aspect-square rounded-2xl border border-black/5" style={{ background: c.hex }} />
                  <div>
                    <p className="text-xs font-bold text-[#1c1c1c]">{c.nombre || 'Sin nombre'}</p>
                    <p className="text-xs font-mono text-[#888] uppercase">{c.hex}</p>
                    {c.uso && <p className="text-xs text-[#aaa] mt-0.5">{c.uso}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TIPOGRAFÍA */}
        {hayTipos && (
          <>
            <Divider label="Tipografía" />
            <div className="flex flex-col gap-8">
              {tipografias.map((t, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-base font-bold text-[#1c1c1c]">{t.nombre}</p>
                      {t.uso && <p className="text-xs text-[#888]">{t.uso}</p>}
                    </div>
                    <div className="flex gap-2">
                      {t.url && (
                        <a href={t.url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg border border-[#e3e3e3] bg-white text-[#555] hover:border-[#1c1c1c] hover:text-[#1c1c1c] transition-colors no-underline">
                          <ExternalLink size={11} /> Google Fonts
                        </a>
                      )}
                      {t.archivo_url && (
                        <button onClick={() => {
                          const a = document.createElement('a')
                          fetch(t.archivo_url).then(r => r.blob()).then(b => {
                            a.href = URL.createObjectURL(b); a.download = t.archivo_nombre || 'fuente'; a.click()
                          })
                        }} className="flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg border border-[#e3e3e3] bg-white text-[#555] hover:border-[#1c1c1c] hover:text-[#1c1c1c] transition-colors cursor-pointer">
                          <Download size={11} /> Descargar fuente
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-5xl text-[#1c1c1c] leading-tight font-normal mt-2" style={{ fontFamily: `'${t.nombre}', sans-serif` }}>
                    Aa Bb Cc 123
                  </p>
                  <p className="text-base text-[#555] leading-relaxed" style={{ fontFamily: `'${t.nombre}', sans-serif` }}>
                    La identidad visual define cómo el mundo percibe a una marca.
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* MOCKUPS */}
        {hayMockups && (
          <>
            <Divider label="Aplicaciones" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockups.map((m, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <img src={m.url} alt={m.caption || ''} className="w-full rounded-2xl object-cover" />
                  {m.caption && <p className="text-xs text-[#888] text-center">{m.caption}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* USOS */}
        {hayUsos && (
          <>
            <Divider label="Uso del logo" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {usosCorrectos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-4">✓ Usos correctos</p>
                  <div className="flex flex-col gap-3">
                    {usosCorrectos.map((u, i) => (
                      <div key={i} className="flex gap-3 items-start bg-green-50 rounded-xl p-3">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={11} className="text-white" />
                        </div>
                        <div className="flex-1">
                          {u.texto && <p className="text-sm text-[#333]">{u.texto}</p>}
                          {u.imagen_url && <img src={u.imagen_url} alt="" className="mt-2 w-full max-h-[120px] object-contain rounded-lg bg-white border border-green-100" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {usosIncorrectos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-4">✕ Usos incorrectos</p>
                  <div className="flex flex-col gap-3">
                    {usosIncorrectos.map((u, i) => (
                      <div key={i} className="flex gap-3 items-start bg-red-50 rounded-xl p-3">
                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                          <X size={11} className="text-white" />
                        </div>
                        <div className="flex-1">
                          {u.texto && <p className="text-sm text-[#333]">{u.texto}</p>}
                          {u.imagen_url && <img src={u.imagen_url} alt="" className="mt-2 w-full max-h-[120px] object-contain rounded-lg bg-white border border-red-100" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* TEMPLATES REDES */}
        {hayTemplates && (
          <>
            <Divider label="Templates para redes" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {Object.entries(templates).map(([key, tmpl]) => {
                if (!tmpl?.preview_url && !tmpl?.canva_url) return null
                return (
                  <div key={key} className="flex flex-col gap-2">
                    {tmpl.preview_url && (
                      <img src={tmpl.preview_url} alt={REDES_LABELS[key] || key} className="w-full aspect-video object-cover rounded-xl border border-[#e3e3e3]" />
                    )}
                    <p className="text-xs font-semibold text-[#1c1c1c]">{REDES_LABELS[key] || key}</p>
                    {tmpl.canva_url && (
                      <a href={tmpl.canva_url} target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg border border-[#e3e3e3] bg-white text-[#555] hover:border-[#1c1c1c] hover:text-[#1c1c1c] transition-colors no-underline">
                        <ExternalLink size={11} /> Editar en Canva
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

      </div>

      {/* Footer */}
      <footer className="border-t border-[#f0f0f0] px-6 sm:px-16 py-8 flex items-center justify-between mt-8">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-4 w-auto opacity-30" />
        <p className="text-xs text-[#bbb]">{proyecto.nombre} · Manual de marca</p>
      </footer>

    </div>
  )
}
