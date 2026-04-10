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
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(nombre)}:wght@300;400;600;700;900&display=swap`
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
function LogoCard({ url, label, sub, dark, nombreBase }) {
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
      <div className={`w-full h-[160px] rounded-2xl flex items-center justify-center p-8 border border-[#e0e0e6]
        ${dark ? 'bg-[#363645]' : 'bg-white border-[#e0e0e6]'}`}>
        <img src={url} alt={label} className="max-h-[90px] max-w-[80%] object-contain" />
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
  { key: 'iso',   label: 'Isotipo',    sub_c: 'Fondo claro',  sub_o: 'Fondo oscuro', claro: 'iso_claro',   oscuro: 'iso_oscuro'   },
  { key: 'texto', label: 'Solo texto', sub_c: 'Fondo claro',  sub_o: 'Fondo oscuro', claro: 'texto_claro', oscuro: 'texto_oscuro' },
  { key: 'horiz', label: 'Horizontal', sub_c: 'Fondo claro',  sub_o: 'Fondo oscuro', claro: 'horiz_claro', oscuro: 'horiz_oscuro' },
  { key: 'vert',  label: 'Vertical',   sub_c: 'Fondo claro',  sub_o: 'Fondo oscuro', claro: 'vert_claro',  oscuro: 'vert_oscuro'  },
]

const TEMPLATE_CATS = [
  { key: 'foto',    label: 'Foto de perfil' },
  { key: 'portada', label: 'Portada'        },
  { key: 'posts',   label: 'Posts'          },
]

// ── Main ──────────────────────────────────────────────────────
export default function MarcaManual() {
  const { nombre } = useParams()
  const [proyecto, setProyecto] = useState(null)
  const [manual, setManual] = useState(null)
  const [cargando, setCargando] = useState(true)

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
  const hayTemplates = TEMPLATE_CATS.some(({ key }) => (templates[key] || []).some(t => t?.preview_url || t?.canva_url))

  let sectionNum = 0
  const nextNum = () => String(++sectionNum).padStart(2, '0')

  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif]">

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
            <img src={logos['horiz_oscuro']} alt={proyecto.nombre} className="h-12 sm:h-16 w-auto object-contain" />
          )}
          {!logos['horiz_oscuro'] && (
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-none tracking-tight">{proyecto.nombre}</h1>
          )}
          <div className="w-16 h-px bg-white/20" />
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[2px]">Guía de Identidad de Marca</p>
          {tematica && (
            <p className="text-[15px] text-white/60 leading-relaxed max-w-[380px]">{tematica}</p>
          )}
        </div>
        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-10 bg-white" />
          <p className="text-[10px] text-white uppercase tracking-[2px]">Scroll</p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-[1024px] mx-auto px-6 sm:px-12 py-24 flex flex-col gap-24">

        {/* LOGOS */}
        {hayLogos && (
          <div>
            <SectionHeader num={nextNum()} label="Logotipo" />
            <div className="flex flex-col gap-16">
              {LOGO_GRUPOS.map(({ key, label, sub_c, sub_o, claro, oscuro }) => {
                const urlClaro = logos[claro]
                const urlOscuro = logos[oscuro]
                if (!urlClaro && !urlOscuro) return null
                return (
                  <div key={key}>
                    <p className="text-[16px] font-semibold text-[#363645] mb-1">{label}</p>
                    <p className="text-[14px] text-[#52586f] mb-6">{urlClaro && urlOscuro ? 'Versiones sobre fondo claro y oscuro.' : urlClaro ? 'Versión sobre fondo claro.' : 'Versión sobre fondo oscuro.'}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {urlClaro && <LogoCard url={urlClaro} label="Sobre claro" sub={sub_c} dark={false} nombreBase={`${nombreMarca}-${claro}`} />}
                      {urlOscuro && <LogoCard url={urlOscuro} label="Sobre oscuro" sub={sub_o} dark={true} nombreBase={`${nombreMarca}-${oscuro}`} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* COLORES */}
        {hayColores && (
          <div>
            <SectionHeader num={nextNum()} label="Paleta de colores" />
            <div className="flex rounded-2xl overflow-hidden h-[280px] sm:h-[320px]">
              {colores.map((c, i) => {
                const isLight = parseInt(c.hex.slice(1,3),16)*0.299 + parseInt(c.hex.slice(3,5),16)*0.587 + parseInt(c.hex.slice(5,7),16)*0.114 > 160
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end p-6 sm:p-8" style={{ background: c.hex }}>
                    {c.nombre && <p className={`text-[16px] font-semibold mb-1 ${isLight ? 'text-[#363645]' : 'text-white'}`}>{c.nombre}</p>}
                    <p className={`text-[13px] font-mono uppercase ${isLight ? 'text-[#363645]/80' : 'text-white/80'}`}>{c.hex}</p>
                    {c.uso && <p className={`text-[11px] mt-1 ${isLight ? 'text-[#363645]/50' : 'text-white/50'}`}>{c.uso}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TIPOGRAFÍA */}
        {hayTipos && (
          <div>
            <SectionHeader num={nextNum()} label="Tipografía" />
            <div className="flex flex-col gap-20">
              {tipografias.map((t, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-12 items-start">
                  {/* Left: info */}
                  <div className="flex flex-col gap-4">
                    <p className="text-[11px] font-bold text-[#c63f3f] uppercase tracking-[1.2px]">{i === 0 ? 'Fuente principal' : 'Fuente secundaria'}</p>
                    <p className="text-[80px] sm:text-[96px] font-normal leading-none text-[#363645]" style={{ fontFamily: `'${t.nombre}', sans-serif` }}>{t.nombre}</p>
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
                      {t.url && (
                        <a href={t.url} target="_blank" rel="noreferrer"
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
                  {/* Right: specimen */}
                  <div className="flex flex-col gap-4">
                    <div className="bg-[#ececf0] rounded-2xl p-8 overflow-hidden" style={{ fontFamily: `'${t.nombre}', sans-serif` }}>
                      <p className="text-[13px] font-bold text-[#52586f] tracking-[1.4px] mb-1">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                      <p className="text-[13px] text-[#52586f] mb-1">abcdefghijklmnopqrstuvwxyz</p>
                      <p className="text-[13px] text-[#52586f] mb-1">1234567890</p>
                      <p className="text-[13px] text-[#52586f]">!@#$%&*().,;:'"-+=/</p>
                    </div>
                    <div className="bg-[#363645] rounded-2xl p-8" style={{ fontFamily: `'${t.nombre}', sans-serif` }}>
                      <p className="text-[14px] font-light text-white leading-relaxed">
                        "La identidad visual define cómo el mundo percibe una marca. Cada trazo comunica valores, visión y carácter."
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* APLICACIONES / MOCKUPS */}
        {hayMockups && (
          <div>
            <SectionHeader num={nextNum()} label="Aplicaciones" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {mockups.map((m, i) => (
                <div key={i} className="bg-[#ececf0] rounded-2xl overflow-hidden flex items-end justify-center pt-6 px-6 min-h-[280px]">
                  <img src={m.url} alt={m.caption || ''} className="w-full max-h-[260px] object-contain object-bottom" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USOS */}
        {hayUsos && (
          <div>
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
          <div>
            <SectionHeader num={nextNum()} label="Templates para redes" />
            <div className="flex flex-col gap-12">
              {TEMPLATE_CATS.map(({ key, label }) => {
                const items = (templates[key] || []).filter(t => t?.preview_url || t?.canva_url)
                if (!items.length) return null
                return (
                  <div key={key}>
                    <p className="text-[13px] font-semibold text-[#52586f] uppercase tracking-[1.4px] mb-6">{label}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {items.map((tmpl, i) => (
                        <div key={i} className="flex flex-col gap-3">
                          {tmpl.preview_url ? (
                            <div className="bg-[#ececf0] rounded-2xl overflow-hidden flex items-end justify-center pt-4 px-4 min-h-[200px]">
                              <img src={tmpl.preview_url} alt={label} className="w-full max-h-[180px] object-contain object-bottom" />
                            </div>
                          ) : (
                            <div className="bg-[#ececf0] rounded-2xl min-h-[200px] flex items-center justify-center">
                              <p className="text-[12px] text-[#aaa]">Sin preview</p>
                            </div>
                          )}
                          {tmpl.canva_url && (
                            <a href={tmpl.canva_url} target="_blank" rel="noreferrer"
                              className="flex items-center justify-center gap-1.5 text-[12px] font-medium py-2 rounded-xl border border-[#e0e0e6] bg-white text-[#52586f] hover:border-[#363645] hover:text-[#363645] transition-colors no-underline">
                              <ExternalLink size={11} /> Editar en Canva
                            </a>
                          )}
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
      <div className="bg-[#363645] px-8 sm:px-16 py-12">
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
