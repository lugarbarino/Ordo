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

    // cargar fuentes
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

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Header + tabs ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#f0f0f0] px-6 py-3 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold shrink-0" style={{ color: darkBg }}>{proyecto.nombre}</p>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {finalistas.map((f, i) => (
            <button key={f.id} onClick={() => setTab(i)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer"
              style={{
                backgroundColor: tab === i ? acento : 'transparent',
                borderColor: tab === i ? acento : '#e0e0e0',
                color: tab === i ? 'white' : darkBg,
              }}>
              {f.nombre || `Opción ${i + 1}`}
            </button>
          ))}
        </div>
      </header>

      {/* ── Concepto ── */}
      <section className="py-16 px-6 md:px-16 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-16 items-start">

          {/* Texto izq */}
          <div className="flex-1 max-w-md">
            {fin.atributo && (
              <p className="text-xs font-bold uppercase tracking-[3px] mb-3" style={{ color: acento }}>{fin.atributo}</p>
            )}
            {fin.tagline && (
              <h1 className="text-5xl font-light mb-3 leading-tight" style={{ color: darkBg }}>{fin.tagline}</h1>
            )}
            {fin.concepto && (
              <p className="text-lg font-medium mb-4" style={{ color: darkBg }}>{fin.concepto}</p>
            )}
            {fin.descripcion && (
              <p className="text-sm leading-relaxed opacity-60" style={{ color: darkBg }}>{fin.descripcion}</p>
            )}
          </div>

          {/* Logos der */}
          {(fin.logos || []).length > 0 && (
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fin.logos.map((img, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-[#e8e8e8] flex items-center justify-center p-8 aspect-video"
                  style={{ backgroundColor: img.dark ? darkBg : '#f8f8f8' }}>
                  <img src={img.url} alt={img.titulo || ''} className="max-h-24 max-w-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Colores + Tipografía ── */}
      {((fin.colores || []).length > 0 || fin.tipografia) && (
        <section className="py-12 px-6 md:px-16 border-t border-[#f0f0f0]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12">

            {/* Colores */}
            {(fin.colores || []).length > 0 && (
              <div className="flex flex-col gap-4">
                <p className="text-xs font-bold uppercase tracking-[2px] opacity-40" style={{ color: darkBg }}>Paleta</p>
                <div className="flex gap-3 flex-wrap">
                  {fin.colores.map((hex, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <div className="w-14 h-14 rounded-full border border-black/5 shadow-sm" style={{ backgroundColor: hex }} />
                      <p className="text-[10px] font-mono opacity-50" style={{ color: darkBg }}>{hex}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tipografía */}
            {fin.tipografia && (
              <div className="flex flex-col gap-4 flex-1">
                <p className="text-xs font-bold uppercase tracking-[2px] opacity-40" style={{ color: darkBg }}>Tipografía</p>
                <div className="flex items-end gap-6">
                  <div>
                    <p className="text-xs font-bold mb-1" style={{ color: acento }}>Tipografía</p>
                    <p className="text-4xl" style={{ fontFamily: `'${fin.tipografia}', sans-serif`, color: darkBg }}>{fin.tipografia}</p>
                  </div>
                  <p className="text-7xl opacity-10 font-light leading-none" style={{ fontFamily: `'${fin.tipografia}', sans-serif`, color: darkBg }}>Aa</p>
                </div>
                <div className="text-[11px] leading-relaxed opacity-50" style={{ color: darkBg, fontFamily: `'${fin.tipografia}', sans-serif` }}>
                  <p className="font-bold">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                  <p>abcdefghijklmnopqrstuvwxyz</p>
                  <p>1234567890</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Mockups ── */}
      {(fin.mockups || []).length > 0 && (
        <section className="py-12 px-6 md:px-16 border-t border-[#f0f0f0]">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[2px] opacity-40 mb-6" style={{ color: darkBg }}>Aplicaciones</p>
            <div className={`grid gap-4 ${fin.mockups.length === 1 ? 'grid-cols-1 max-w-2xl' : fin.mockups.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
              {fin.mockups.map((m, i) => (
                <div key={i} className="rounded-2xl overflow-hidden aspect-video border border-[#e8e8e8] bg-[#f5f5f5]">
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Logo responsivo ── */}
      {(fin.logo_responsivo || []).length > 0 && (
        <section className="py-12 px-6 md:px-16 border-t border-[#f0f0f0]">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[2px] opacity-40 mb-2" style={{ color: darkBg }}>Logo responsivo</p>
            <p className="text-lg font-medium mb-8" style={{ color: darkBg }}>Versiones del logo</p>
            <div className={`grid gap-4 ${fin.logo_responsivo.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
              {fin.logo_responsivo.map((lr, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="aspect-square rounded-2xl border border-[#e8e8e8] bg-[#fafafa] flex items-center justify-center p-6">
                    <img src={lr.url} alt={lr.titulo || ''} className="max-h-full max-w-full object-contain" />
                  </div>
                  {(lr.titulo || lr.subtitulo) && (
                    <div>
                      {lr.titulo && <p className="text-sm font-semibold" style={{ color: darkBg }}>{lr.titulo}</p>}
                      {lr.subtitulo && <p className="text-xs opacity-50" style={{ color: darkBg }}>{lr.subtitulo}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="py-8 px-8 mt-8" style={{ backgroundColor: darkBg }}>
        <p className="text-center text-[11px] text-white/40 tracking-wide">
          © {new Date().getFullYear()} {proyecto?.nombre} — Propuesta de marca
        </p>
      </footer>

    </div>
  )
}
