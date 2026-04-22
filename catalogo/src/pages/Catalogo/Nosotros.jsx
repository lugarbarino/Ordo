import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Mail, ArrowRight, MessageCircle, ShoppingBag, Truck, Globe, CreditCard } from 'lucide-react'
import { db } from '../../lib/supabase'
import { Navbar } from './Public'

const DEFAULT_SERVICIOS = ['Entrega a domicilio', 'Envíos a todo el país', 'Todos los medios de pago']
const SERVICIO_ICONS = [Truck, Globe, CreditCard]

function WhatsAppIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.853L.057 23.885a.5.5 0 0 0 .611.61l6.101-1.456A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.938 9.938 0 0 1-5.072-1.385l-.361-.214-3.762.898.938-3.669-.235-.375A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  )
}

function InstagramIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function FacebookIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function Spinner({ color }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
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
  const brandLight = empresa?.color ? empresa.color + '15' : '#e8f0fc'
  const brandMid  = empresa?.color ? empresa.color + '30' : '#d0e4f5'

  useEffect(() => {
    if (!slug) { setError(true); setCargando(false); return }
    ;(async () => {
      const { data: emp } = await db.from('empresas').select('*').eq('slug', slug).single()
      if (!emp) { setError(true); setCargando(false); return }
      setEmpresa(emp)
      document.title = emp.nombre + ' — Sobre nosotros'
      const root = document.documentElement
      if (emp.color) root.style.setProperty('--brand', emp.color)
      setCargando(false)
    })()
  }, [slug])

  if (cargando) return <Spinner color={brandColor} />

  if (error) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-5xl mb-2">😕</div>
      <h2 className="text-xl font-bold text-[#1e2a3a]">Empresa no encontrada</h2>
      <p className="text-[#6b7a90] text-sm">Revisá el link o pedile uno nuevo a la empresa.</p>
    </div>
  )

  const tokens = empresa.tokens || {}
  const bannerNosotros = tokens.banner_nosotros_url || empresa.banner_url
  const hasBanner = !!bannerNosotros
  const isVideo = hasBanner && /\.(mp4|webm|ogg)(\?|#|$)/i.test(bannerNosotros)

  const servicios = (tokens.servicios && tokens.servicios.length > 0)
    ? tokens.servicios
    : DEFAULT_SERVICIOS

  const instagramUrl = tokens.instagram
    ? (tokens.instagram.startsWith('http') ? tokens.instagram : `https://instagram.com/${tokens.instagram}`)
    : null
  const facebookUrl = tokens.facebook
    ? (tokens.facebook.startsWith('http') ? tokens.facebook : `https://facebook.com/${tokens.facebook}`)
    : null

  return (
    <div className="min-h-screen bg-white text-[#1e2a3a]">

      {/* Navbar */}
      <Navbar
        empresa={empresa}
        slug={slug}
        brandColor={brandColor}
        carritoCount={0}
        onCarrito={() => {}}
      />

      {/* ── HERO SPLIT ── */}
      <div className="flex flex-col md:flex-row min-h-[520px] md:min-h-[580px]">

        {/* Izquierda: color de marca + logo + nombre */}
        <div className="flex flex-col justify-center items-start px-10 md:px-16 py-16 md:w-1/2 relative overflow-hidden"
          style={{ backgroundColor: brandColor }}>

          <div className="relative z-10">
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">
              Sobre nosotros
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              {empresa.titulo || empresa.nombre}
            </h1>
            {empresa.descripcion && (
              <p className="text-white/75 text-base md:text-lg leading-relaxed max-w-[420px]">
                {empresa.descripcion}
              </p>
            )}
          </div>
        </div>

        {/* Derecha: imagen / video o bloque decorativo */}
        <div className="md:w-1/2 min-h-[280px] md:min-h-0 relative overflow-hidden">
          {isVideo ? (
            <video key={bannerNosotros} autoPlay muted loop playsInline
              className="absolute inset-0 w-full h-full object-cover">
              <source src={bannerNosotros} />
            </video>
          ) : hasBanner ? (
            <img src={bannerNosotros} alt={empresa.nombre}
              className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ backgroundColor: brandLight }} />
          )}
        </div>
      </div>

      {/* ── QUIÉNES SOMOS (tokens.quienes_somos) ── */}
      {tokens.quienes_somos && (
        <div className="bg-white px-8 md:px-20 py-14 md:py-20">
          <div className="max-w-[900px] mx-auto">
            <div className="flex gap-6 md:gap-10 items-start">
              <div className="w-1 rounded-full shrink-0 self-stretch mt-1"
                style={{ backgroundColor: brandColor }} />
              <div>
                <p className="text-[.72rem] font-bold uppercase tracking-widest mb-5"
                  style={{ color: brandColor }}>
                  Quiénes somos
                </p>
                <p className="text-xl md:text-2xl leading-relaxed text-[#1e2a3a]">
                  {tokens.quienes_somos}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SERVICIOS ── */}
      <div className="px-6 md:px-16 py-14 md:py-20" style={{ backgroundColor: '#f7f8fa' }}>
        <div className="max-w-[900px] mx-auto">
          <p className="text-[.72rem] font-bold uppercase tracking-widest mb-10 text-center"
            style={{ color: brandColor }}>
            Nuestros servicios
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {servicios.map((label, i) => {
              const Icon = SERVICIO_ICONS[i] || Truck
              return (
                <div key={i} className="bg-white rounded-2xl p-7 flex flex-col items-center text-center gap-4 shadow-sm">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: brandColor }}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <p className="font-bold text-[#1e2a3a] text-base">{label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── BANNER DE SERVICIO ── */}
      {tokens.banner_servicio_url && (
        <div className="mx-6 md:mx-16 my-10 md:my-14">
          <div className="rounded-2xl overflow-hidden h-[320px] md:h-[400px] relative">
            <img src={tokens.banner_servicio_url} alt="Servicio"
              className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </div>
      )}

      {/* ── UBICACIÓN ── */}
      {tokens.direccion && (
        <div className="bg-white px-6 md:px-16 py-14 md:py-20">
          <div className="max-w-[900px] mx-auto">
            <p className="text-[.72rem] font-bold uppercase tracking-widest mb-3"
              style={{ color: brandColor }}>
              Dónde encontrarnos
            </p>
            <p className="text-base text-[#1e2a3a] mb-6 font-medium">{tokens.direccion}</p>
            <div className="rounded-2xl overflow-hidden">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(tokens.direccion)}&z=15&output=embed`}
                width="100%"
                height="320"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                title="Ubicación"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── CONTACTO ── */}
      {(empresa.email_contacto || empresa.whatsapp) && (
        <div className="px-6 md:px-16 pb-16 md:pb-24" style={{ backgroundColor: '#f7f8fa' }}>
          <div className="max-w-[900px] mx-auto py-14 md:py-20">
            <p className="text-[.72rem] font-bold uppercase tracking-widest mb-2"
              style={{ color: brandColor }}>
              Contacto
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-[#1e2a3a] mb-10">
              Hablemos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {empresa.whatsapp && (
                <a href={`https://wa.me/${empresa.whatsapp}`} target="_blank" rel="noreferrer"
                  className="group flex flex-col gap-4 p-7 rounded-2xl border-2 border-transparent hover:border-current transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ backgroundColor: '#e8f5e9', color: '#1b5e20' }}>
                  <div className="w-12 h-12 rounded-xl bg-[#25D366] flex items-center justify-center text-white">
                    <WhatsAppIcon size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#388e3c] mb-1">WhatsApp</p>
                    <p className="text-lg font-black text-[#1b5e20]">+{empresa.whatsapp}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#2e7d32] flex items-center gap-1.5 mt-auto">
                    Escribinos <ArrowRight size={14} />
                  </span>
                </a>
              )}
              {empresa.email_contacto && (
                <a href={`mailto:${empresa.email_contacto}`}
                  className="group flex flex-col gap-4 p-7 rounded-2xl border-2 border-transparent hover:-translate-y-0.5 hover:shadow-lg transition-all"
                  style={{ backgroundColor: brandLight, borderColor: 'transparent' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: brandColor }}>
                    <Mail size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1"
                      style={{ color: brandColor }}>
                      Email
                    </p>
                    <p className="text-lg font-black text-[#1e2a3a] break-all">{empresa.email_contacto}</p>
                  </div>
                  <span className="text-sm font-semibold flex items-center gap-1.5 mt-auto"
                    style={{ color: brandColor }}>
                    Mandanos un mail <ArrowRight size={14} />
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REDES SOCIALES ── */}
      {(instagramUrl || facebookUrl) && (
        <div className="bg-white px-6 md:px-16 py-14 md:py-20">
          <div className="max-w-[900px] mx-auto">
            <p className="text-[.72rem] font-bold uppercase tracking-widest mb-8"
              style={{ color: brandColor }}>
              Seguinos
            </p>
            <div className="flex flex-wrap gap-4">
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl px-8 py-5 font-bold text-white hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
                  <InstagramIcon size={22} />
                  Instagram
                </a>
              )}
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl px-8 py-5 font-bold text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#1877F2' }}>
                  <FacebookIcon size={22} />
                  Facebook
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CTA CATÁLOGO ── */}
      <div className="px-6 md:px-16 py-16 md:py-24 flex items-center justify-center"
        style={{ backgroundColor: brandColor }}>
        <div className="text-center max-w-[560px]">
          <ShoppingBag size={36} className="text-white/50 mx-auto mb-5" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
            Explorá todo lo que tenemos para ofrecerte
          </h2>
          <p className="text-white/70 mb-8 text-base">
            Navegá nuestro catálogo completo y generá tu presupuesto al instante.
          </p>
          <Link to={`/catalogo/${slug}`}
            className="inline-flex items-center gap-2 px-8 h-13 py-3.5 rounded-xl bg-white font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ color: brandColor }}>
            Ver catálogo completo
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-[#9aa5b4] text-[.78rem] border-t border-[#e8ecf2]">
        Catálogo creado con <a href="/" className="font-semibold" style={{ color: brandColor }}>Ordo</a>
      </div>
    </div>
  )
}
