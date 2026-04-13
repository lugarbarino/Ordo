import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react'
import { db } from '../../lib/supabase'
import { Navbar } from './Public'

function Spinner({ color }) {
  return (
    <div className="flex items-center justify-center h-72">
      <div className="w-10 h-10 rounded-full border-4 border-[#e3e3e3] animate-spin"
        style={{ borderTopColor: color || '#285576' }} />
    </div>
  )
}

export default function CatalogoNosotros() {
  const { slug } = useParams()
  const [empresa, setEmpresa] = useState(null)
  const [error, setError] = useState(false)
  const [cargando, setCargando] = useState(true)

  const brandColor = empresa?.color || '#285576'
  const brandLight = empresa?.color ? empresa.color + '18' : '#e8f0fc'

  useEffect(() => {
    if (!slug) { setError(true); setCargando(false); return }

    ;(async () => {
      const { data: emp } = await db.from('empresas').select('*').eq('slug', slug).single()
      if (!emp) { setError(true); setCargando(false); return }
      setEmpresa(emp)
      document.title = emp.nombre + ' — Quiénes somos'
      const root = document.documentElement
      if (emp.color) root.style.setProperty('--brand', emp.color)
    })()

    setCargando(false)
  }, [slug])

  if (cargando) return (
    <div className="min-h-screen bg-white">
      <Spinner color={brandColor} />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-5xl mb-2">😕</div>
      <h2 className="text-xl font-bold text-[#1e2a3a]">Empresa no encontrada</h2>
      <p className="text-[#6b7a90] text-sm">Revisá el link o pedile uno nuevo a la empresa.</p>
    </div>
  )

  const contactar = () => {
    if (empresa?.whatsapp) window.open(`https://wa.me/${empresa.whatsapp}`, '_blank')
    else if (empresa?.email_contacto) window.open(`mailto:${empresa.email_contacto}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#1e2a3a]" style={{
      '--brand': brandColor,
      '--brand-light': brandLight,
    }}>

      {/* Navbar */}
      <Navbar
        empresa={empresa}
        slug={slug}
        brandColor={brandColor}
        carritoCount={0}
        onCarrito={() => {}}
      />

      {/* Hero */}
      <div className="relative w-full h-[380px] md:h-[460px] flex items-end overflow-hidden">
        {empresa?.banner_url && /\.(mp4|webm|ogg)(\?|#|$)/i.test(empresa.banner_url) ? (
          <video key={empresa.banner_url} autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover">
            <source src={empresa.banner_url} />
          </video>
        ) : (
          <div className="absolute inset-0" style={{
            background: brandColor,
            ...(empresa?.banner_url ? {
              backgroundImage: `url(${empresa.banner_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : {})
          }} />
        )}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(10,20,40,0.85) 0%, rgba(10,20,40,0.35) 60%, transparent 100%)' }} />

        <div className="relative z-10 px-6 md:px-16 pb-10 md:pb-14">
          {empresa?.logo_url && (
            <img src={empresa.logo_url} alt={empresa.nombre}
              className="h-12 md:h-16 w-auto object-contain mb-5 brightness-0 invert" />
          )}
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
            {empresa?.nombre}
          </h1>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-[900px] mx-auto px-6 md:px-10 py-14 md:py-20">

        {/* Descripción */}
        {empresa?.descripcion && (
          <div className="mb-14">
            <p className="text-[.72rem] font-bold uppercase tracking-widest mb-4"
              style={{ color: brandColor }}>
              Quiénes somos
            </p>
            <p className="text-xl md:text-2xl text-[#1e2a3a] leading-relaxed font-medium max-w-[700px]">
              {empresa.descripcion}
            </p>
          </div>
        )}

        {/* Línea divisora */}
        {empresa?.descripcion && <div className="border-t border-[#e8ecf2] mb-14" />}

        {/* Contacto */}
        {(empresa?.email_contacto || empresa?.whatsapp) && (
          <div className="mb-14">
            <p className="text-[.72rem] font-bold uppercase tracking-widest mb-6"
              style={{ color: brandColor }}>
              Contacto
            </p>
            <div className="flex flex-col gap-4">
              {empresa?.email_contacto && (
                <a href={`mailto:${empresa.email_contacto}`}
                  className="flex items-center gap-3 text-[#1e2a3a] hover:opacity-70 transition-opacity group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: brandLight }}>
                    <Mail size={18} style={{ color: brandColor }} />
                  </div>
                  <span className="text-base font-medium">{empresa.email_contacto}</span>
                </a>
              )}
              {empresa?.whatsapp && (
                <a href={`https://wa.me/${empresa.whatsapp}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 text-[#1e2a3a] hover:opacity-70 transition-opacity group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: brandLight }}>
                    <Phone size={18} style={{ color: brandColor }} />
                  </div>
                  <span className="text-base font-medium">+{empresa.whatsapp}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* CTA al catálogo */}
        <div className="rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10"
          style={{ backgroundColor: brandLight }}>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-black text-[#1e2a3a] mb-2">
              Explorá nuestro catálogo
            </h2>
            <p className="text-sm text-[#6b7a90]">
              Encontrá todos nuestros productos y generá tu presupuesto al instante.
            </p>
          </div>
          <Link to={`/catalogo/${slug}`}
            className="flex items-center gap-2 px-6 h-12 rounded-xl text-white text-sm font-bold shrink-0 hover:opacity-90 transition-opacity"
            style={{ background: brandColor }}>
            Ver catálogo
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-7 text-[#6b7a90] text-[.8rem] border-t border-[#dde3ed]">
        Catálogo creado con <a href="/" className="font-semibold" style={{ color: brandColor }}>Ordo</a>
      </div>
    </div>
  )
}
