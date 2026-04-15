import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Download, ChevronDown } from 'lucide-react'
import { db } from '../lib/supabase'
import { ComentariosSeccion } from '../components/shared/ComentariosSeccion'

function SeccionWrapper({ id, title, numero, children, proyectoId }) {
  return (
    <section id={id} className="py-16 px-4 border-b border-[#e3e3e3]">
      <div className="max-w-3xl mx-auto">
        <div className="text-xs font-bold text-[#aaa] tracking-widest mb-2">{numero}</div>
        <h2 className="text-2xl font-bold mb-10">{title}</h2>
        {children}
        <ComentariosSeccion proyectoId={proyectoId} seccion={id} />
      </div>
    </section>
  )
}

function LogoCard({ logo, label }) {
  if (!logo) return null
  const isSvg = logo.url?.includes('.svg') || logo.url?.endsWith('.svg')
  const pngUrl = logo.url_png || null

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold text-[#888] uppercase tracking-wide">{label}</span>
      {/* 3 fondos */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { bg: '#ffffff', border: '1px solid #e3e3e3', label: 'Blanco' },
          { bg: '#191A23', border: 'none', label: 'Oscuro' },
          { bg: null, label: 'Color' },
        ].map(({ bg, border, label: bgLabel }, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl flex items-center justify-center p-4"
            style={{
              background: bg || 'linear-gradient(135deg, #35425F, #495A82)',
              border: border || 'none',
            }}
          >
            <img src={logo.url} alt={label} className="max-h-full max-w-full object-contain" />
          </div>
        ))}
      </div>
      {/* Descargas */}
      <div className="flex gap-2">
        {isSvg && (
          <a
            href={logo.url}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#e3e3e3] rounded-lg text-[#555] hover:border-[#aaa] hover:text-[#111] transition-colors"
          >
            <Download size={12} /> SVG
          </a>
        )}
        {pngUrl && (
          <a
            href={pngUrl}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#e3e3e3] rounded-lg text-[#555] hover:border-[#aaa] hover:text-[#111] transition-colors"
          >
            <Download size={12} /> PNG
          </a>
        )}
      </div>
    </div>
  )
}

export function ManualPage() {
  const { slug } = useParams()
  const [empresa, setEmpresa] = useState(null)
  const [proyecto, setProyecto] = useState(null)
  const [opcion, setOpcion] = useState(null)
  const [assets, setAssets] = useState([])
  const [colores, setColores] = useState([])
  const [tipografias, setTipografias] = useState([])
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
      // Opción elegida
      const elegida = (proy.opciones_marca || []).find(o => o.es_elegida)
      setOpcion(elegida || null)
      if (elegida) {
        setAssets((proy.assets_marca || []).filter(a => a.opcion_id === elegida.id))
        setColores((proy.colores_marca || []).filter(c => c.opcion_id === elegida.id))
        setTipografias((proy.tipografias_marca || []).filter(t => t.opcion_id === elegida.id))
      }
    }
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#888] text-sm">Cargando…</div>
  if (!opcion) return <div className="min-h-screen flex items-center justify-center text-[#888] text-sm">Manual no disponible</div>

  const logoAssets = {
    isotipo:     assets.find(a => a.tipo === 'isotipo'),
    logotipo:    assets.find(a => a.tipo === 'logotipo'),
    imagotipo_h: assets.find(a => a.tipo === 'imagotipo_h'),
    imagotipo_v: assets.find(a => a.tipo === 'imagotipo_v'),
  }
  const mockups = assets.filter(a => a.tipo === 'mockup')
  const principalLogo = logoAssets.logotipo || logoAssets.imagotipo_h || logoAssets.isotipo

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-[#191A23] min-h-screen flex flex-col items-center justify-center text-center px-6 relative">
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {principalLogo
            ? <img src={principalLogo.url} alt={empresa?.nombre} className="max-h-20 max-w-xs object-contain brightness-0 invert" />
            : <h1 className="text-3xl font-bold text-white">{empresa?.nombre}</h1>
          }
          <p className="text-white/50 text-sm tracking-widest uppercase">Guía de Identidad de Marca</p>
          {proyecto?.nombre && <p className="text-white/30 text-xs">{proyecto.nombre}</p>}
        </div>
        <div className="absolute bottom-10 flex flex-col items-center gap-1 text-white/30 text-xs">
          <ChevronDown size={16} className="animate-bounce" />
          scroll
        </div>
      </div>

      {/* 01 — Logotipo */}
      <SeccionWrapper id="logotipo" numero="01" title="Logotipo" proyectoId={proyecto?.id}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          <LogoCard logo={logoAssets.isotipo} label="Isotipo" />
          <LogoCard logo={logoAssets.logotipo} label="Logotipo" />
          <LogoCard logo={logoAssets.imagotipo_h} label="Imagotipo Horizontal" />
          <LogoCard logo={logoAssets.imagotipo_v} label="Imagotipo Vertical" />
        </div>
      </SeccionWrapper>

      {/* 02 — Paleta */}
      {colores.length > 0 && (
        <SeccionWrapper id="paleta" numero="02" title="Paleta de colores" proyectoId={proyecto?.id}>
          <div className="space-y-2">
            {colores.map(c => (
              <div
                key={c.id}
                className="w-full h-24 rounded-xl flex items-end px-5 py-4"
                style={{ background: c.hex }}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm" style={{ color: isLight(c.hex) ? '#111' : '#fff' }}>
                    {c.nombre || c.rol}
                  </span>
                  <div className="text-right" style={{ color: isLight(c.hex) ? '#33333388' : '#ffffff88' }}>
                    <div className="text-xs font-mono">{c.hex}</div>
                    {c.rgb && <div className="text-xs font-mono">{c.rgb}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SeccionWrapper>
      )}

      {/* 03 — Tipografía */}
      {tipografias.length > 0 && (
        <SeccionWrapper id="tipografia" numero="03" title="Tipografía" proyectoId={proyecto?.id}>
          <div className="space-y-8">
            {tipografias.map(t => (
              <div key={t.id}>
                <div className="text-xs text-[#aaa] mb-2">{t.tipo === 'primary' ? 'Fuente principal' : 'Fuente secundaria'}</div>
                <div className="bg-[#f8f9fa] rounded-xl p-6">
                  <div className="text-4xl font-bold mb-3" style={{ fontFamily: t.nombre_fuente }}>
                    {t.nombre_fuente}
                  </div>
                  <div className="text-base text-[#666] mb-4" style={{ fontFamily: t.nombre_fuente }}>
                    Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
                  </div>
                  <div className="text-sm text-[#888] font-mono mb-4" style={{ fontFamily: t.nombre_fuente }}>
                    0 1 2 3 4 5 6 7 8 9 ! @ # $ % & * ( ) - + = ? . , :
                  </div>
                  {t.pesos && (
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-[#e3e3e3]">
                      {t.pesos.map(p => (
                        <span key={p} className="text-sm text-[#444]" style={{ fontFamily: t.nombre_fuente, fontWeight: p }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SeccionWrapper>
      )}

      {/* 04 — Aplicaciones */}
      {mockups.length > 0 && (
        <SeccionWrapper id="aplicaciones" numero="04" title="Aplicaciones" proyectoId={proyecto?.id}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mockups.map(m => (
              <div key={m.id} className="rounded-xl overflow-hidden border border-[#e3e3e3]">
                <img src={m.url} alt={m.label || 'Mockup'} className="w-full object-cover" />
                {m.label && <div className="px-4 py-2 text-xs text-[#888] bg-white">{m.label}</div>}
              </div>
            ))}
          </div>
        </SeccionWrapper>
      )}

      {/* Footer */}
      <footer className="bg-[#191A23] rounded-t-3xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 mt-0">
        {principalLogo
          ? <img src={principalLogo.url} alt={empresa?.nombre} className="h-8 object-contain brightness-0 invert opacity-70" />
          : <span className="text-white/70 font-bold">{empresa?.nombre}</span>
        }
        <div className="text-right text-white/40 text-xs space-y-1">
          <div className="font-semibold text-white/60">Guía de Identidad de Marca</div>
          {proyecto?.nombre && <div>{proyecto.nombre}</div>}
          <div>Ordo · {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  )
}

// Utility: determina si un color hex es claro u oscuro
function isLight(hex) {
  if (!hex) return true
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}
