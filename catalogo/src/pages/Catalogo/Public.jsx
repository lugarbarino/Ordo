import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Search, X, ShoppingBag, Trash2, Plus, Minus, Send, Image, Check, Menu } from 'lucide-react'
import { db } from '../../lib/supabase'

function formatPrecio(v) {
  if (!v) return null
  const s = String(v).trim()
  if (s.toLowerCase() === 'consultar') return null
  if (isNaN(s)) return s
  return `$${Number(s).toLocaleString('es-AR')}`
}

function Spinner({ color }) {
  return (
    <div className="flex items-center justify-center h-72">
      <div className="w-10 h-10 rounded-full border-4 border-[#e3e3e3] animate-spin"
        style={{ borderTopColor: color || '#285576' }} />
    </div>
  )
}

function ModalFoto({ img, nombre, onClose }) {
  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  if (!img) return null
  return (
    <div className="fixed inset-0 bg-black/82 z-[100] flex items-center justify-center p-5"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-4 max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-3 relative">
        <button onClick={onClose}
          className="absolute top-2.5 right-3.5 text-[#6b7a90] bg-transparent border-none cursor-pointer">
          <X size={20} />
        </button>
        <img src={img} alt={nombre} className="max-w-[80vw] max-h-[72vh] object-contain rounded-lg" />
        {nombre && <div className="text-sm font-bold text-center">{nombre}</div>}
      </div>
    </div>
  )
}

function ModalCarrito({ carrito, empresa, onClose, onCambiarCantidad, onQuitar, onEnviado, brandColor }) {
  const [nombre, setNombre] = useState('')
  const [tel, setTel] = useState('')
  const [email, setEmail] = useState('')
  const [empresaCliente, setEmpresaCliente] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const enviar = async () => {
    if (!nombre.trim() || !tel.trim()) {
      alert('Nombre y teléfono son obligatorios')
      return
    }
    setLoading(true)
    const pedido = {
      empresa_id: empresa.id,
      nombre_cliente: nombre.trim(),
      telefono_cliente: tel.trim(),
      email_cliente: email.trim(),
      empresa_cliente: empresaCliente.trim(),
      mensaje: mensaje.trim(),
      productos: carrito.map(x => ({ id: x.id, nombre: x.nombre, cantidad: x.cantidad })),
    }
    const { error } = await db.from('pedidos').insert(pedido)
    setLoading(false)
    if (error) { alert('Error al enviar. Intentá de nuevo.'); return }

    const lista = carrito.map(x => `• ${x.cantidad}x ${x.nombre}`).join('\n')
    const texto = `Hola! Soy ${nombre.trim()} (${tel.trim()}). Solicito presupuesto de:\n\n${lista}${mensaje.trim() ? '\n\nMensaje: ' + mensaje.trim() : ''}`

    if (empresa.whatsapp)
      window.open(`https://wa.me/${empresa.whatsapp}?text=${encodeURIComponent(texto)}`, '_blank')
    if (empresa.email_contacto)
      window.open(`mailto:${empresa.email_contacto}?subject=${encodeURIComponent('Solicitud de presupuesto de ' + nombre.trim())}&body=${encodeURIComponent(texto)}`, '_blank')

    setEnviado(true)
    onEnviado()
  }

  const inputCls = `w-full px-3.5 py-2.5 border border-[#dde3ed] rounded-lg text-sm outline-none transition-colors`

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-t-[20px] w-full max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8ecf2]">
          <h3 className="text-base font-black flex items-center gap-2">
            <ShoppingBag size={18} style={{ color: brandColor }} /> Tu pedido de presupuesto
          </h3>
          <button onClick={onClose} className="text-[#999] bg-transparent border-none cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {enviado ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-lg font-black mb-1">¡Pedido enviado!</h3>
              <p className="text-sm text-[#6b7a90]">Nos pondremos en contacto pronto.</p>
            </div>
          ) : !carrito.length ? (
            <div className="text-center py-10 text-[#999] text-sm">Agregá productos desde el catálogo.</div>
          ) : (
            <>
              <div className="mb-4">
                {carrito.map(x => (
                  <div key={x.id} className="flex items-center gap-3 py-2.5 border-b border-[#f0f0f0] last:border-0">
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{x.nombre}</div>
                      {x.categoria && <div className="text-xs text-[#6b7a90]">{x.categoria}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onCambiarCantidad(x.id, -1)}
                        className="w-7 h-7 rounded-full border border-[#dde3ed] bg-white flex items-center justify-center cursor-pointer hover:bg-[#f0f5fb] transition-colors"
                        style={{ color: brandColor }}>
                        <Minus size={12} />
                      </button>
                      <span className="font-bold text-sm min-w-[20px] text-center">{x.cantidad}</span>
                      <button onClick={() => onCambiarCantidad(x.id, 1)}
                        className="w-7 h-7 rounded-full border border-[#dde3ed] bg-white flex items-center justify-center cursor-pointer hover:bg-[#f0f5fb] transition-colors"
                        style={{ color: brandColor }}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => onQuitar(x.id)}
                      className="text-[#6b7a90] hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Nombre *</label>
                    <input value={nombre} onChange={e => setNombre(e.target.value)}
                      placeholder="Tu nombre" className={inputCls}
                      onFocus={e => e.target.style.borderColor = brandColor}
                      onBlur={e => e.target.style.borderColor = '#dde3ed'} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Teléfono *</label>
                    <input value={tel} onChange={e => setTel(e.target.value)}
                      placeholder="Tu teléfono" className={inputCls}
                      onFocus={e => e.target.style.borderColor = brandColor}
                      onBlur={e => e.target.style.borderColor = '#dde3ed'} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com" className={inputCls}
                    onFocus={e => e.target.style.borderColor = brandColor}
                    onBlur={e => e.target.style.borderColor = '#dde3ed'} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Empresa / Institución</label>
                  <input value={empresaCliente} onChange={e => setEmpresaCliente(e.target.value)}
                    placeholder="Opcional" className={inputCls}
                    onFocus={e => e.target.style.borderColor = brandColor}
                    onBlur={e => e.target.style.borderColor = '#dde3ed'} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Mensaje</label>
                  <input value={mensaje} onChange={e => setMensaje(e.target.value)}
                    placeholder="Opcional" className={inputCls}
                    onFocus={e => e.target.style.borderColor = brandColor}
                    onBlur={e => e.target.style.borderColor = '#dde3ed'} />
                </div>
              </div>
            </>
          )}
        </div>

        {!enviado && carrito.length > 0 && (
          <div className="px-6 py-4 border-t border-[#e8ecf2]">
            <button onClick={enviar} disabled={loading}
              className="w-full py-3.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: brandColor }}>
              <Send size={16} style={{ opacity: 0.7 }} />
              {loading ? 'Enviando…' : 'Enviar pedido de presupuesto'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ProductCard({ producto: p, enCarrito, onFoto, onAgregar }) {
  const precio = formatPrecio(p.precio)

  return (
    <div className="bg-white rounded-xl border border-[#e8ecf2] overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,.08)]">

      {/* Imagen */}
      <div
        className="w-full h-[160px] bg-white flex items-center justify-center overflow-hidden relative max-sm:h-[120px]"
        onClick={p.imagen_url ? onFoto : undefined}
        style={{ cursor: p.imagen_url ? 'zoom-in' : 'default' }}>
        {p.imagen_url
          ? <img src={p.imagen_url} alt={p.nombre} className="absolute inset-0 w-full h-full object-contain p-4" />
          : <Image size={28} className="text-[#d0d5de]" />
        }
      </div>

      {/* Contenido */}
      <div className="p-4 flex flex-col flex-1 gap-1.5">
        {p.categoria && (
          <p className="text-[.68rem] font-semibold text-[var(--brand)] uppercase tracking-wider truncate">{p.categoria}</p>
        )}
        <p className="text-[.86rem] font-bold text-[#1e2a3a] leading-snug">{p.nombre}</p>
        {p.descripcion && (
          <p className="text-[.78rem] text-[#7a8799] leading-relaxed flex-1 line-clamp-2">{p.descripcion}</p>
        )}
        {precio && (
          <p className="text-[.86rem] font-bold text-[var(--brand)] mt-1">{precio}</p>
        )}
        <button
          onClick={enCarrito ? undefined : onAgregar}
          disabled={enCarrito}
          className={`mt-2 w-full h-10 rounded-lg text-[.82rem] font-semibold flex items-center justify-center gap-1.5 border transition-colors
            ${enCarrito
              ? 'bg-[#f0f0f0] border-transparent text-[#999] cursor-default'
              : 'bg-white border-[#dde3ed] text-[#1e2a3a] hover:bg-[var(--brand-light)] hover:border-[var(--brand)] hover:text-[var(--brand)]'
            }`}>
          {enCarrito ? <><Check size={13} strokeWidth={2.5} /> Agregado</> : '+ Presupuestá'}
        </button>
      </div>
    </div>
  )
}

/* ── Navbar compartida ── */
function Navbar({ empresa, slug, brandColor, carritoCount, onCarrito }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const contactar = () => {
    if (empresa?.whatsapp) window.open(`https://wa.me/${empresa.whatsapp}`, '_blank')
    else if (empresa?.email_contacto) window.open(`mailto:${empresa.email_contacto}`, '_blank')
  }

  return (
    <nav className="sticky top-0 z-30 bg-white border-b border-[#e8ecf2] flex items-center px-6 md:px-10 h-[64px] gap-4">
      {/* Logo */}
      <Link to={`/catalogo/${slug}`} className="flex items-center shrink-0 mr-auto md:mr-0">
        {empresa?.logo_url
          ? <img src={empresa.logo_url} alt={empresa?.nombre} className="h-9 w-auto object-contain max-w-[140px]" />
          : <span className="text-lg font-black" style={{ color: brandColor }}>{empresa?.nombre}</span>
        }
      </Link>

      {/* Nav links — desktop */}
      <div className="hidden md:flex items-center gap-1 mx-auto">
        <Link to={`/catalogo/${slug}`}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-[#4a5568] hover:text-[#1e2a3a] hover:bg-[#f5f6f8] transition-colors">
          Catálogo
        </Link>
        <Link to={`/catalogo/${slug}/nosotros`}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-[#4a5568] hover:text-[#1e2a3a] hover:bg-[#f5f6f8] transition-colors">
          Sobre nosotros
        </Link>
      </div>

      {/* Acciones desktop */}
      <div className="hidden md:flex items-center gap-3 ml-auto md:ml-0">
        {carritoCount > 0 && (
          <button onClick={onCarrito}
            className="flex items-center gap-2 text-sm font-semibold px-4 h-10 rounded-xl border border-[#dde3ed] text-[#1e2a3a] hover:bg-[#f5f6f8] transition-colors cursor-pointer bg-white">
            <ShoppingBag size={16} style={{ color: brandColor }} />
            <span style={{ color: brandColor }}>{carritoCount}</span>
          </button>
        )}
        {(empresa?.whatsapp || empresa?.email_contacto) && (
          <button onClick={contactar}
            className="px-5 h-10 rounded-xl text-white text-sm font-bold cursor-pointer border-none hover:opacity-90 transition-opacity"
            style={{ background: brandColor }}>
            Contactanos
          </button>
        )}
      </div>

      {/* Mobile: carrito + menu */}
      <div className="flex md:hidden items-center gap-2 ml-auto">
        {carritoCount > 0 && (
          <button onClick={onCarrito}
            className="flex items-center gap-1.5 text-sm font-bold px-3 h-9 rounded-xl border border-[#dde3ed] bg-white cursor-pointer"
            style={{ color: brandColor }}>
            <ShoppingBag size={15} />
            {carritoCount}
          </button>
        )}
        <button onClick={() => setMenuOpen(o => !o)}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#dde3ed] bg-white cursor-pointer text-[#4a5568]">
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-[#e8ecf2] flex flex-col p-4 gap-2 shadow-lg md:hidden">
          <Link to={`/catalogo/${slug}`} onClick={() => setMenuOpen(false)}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-[#1e2a3a] hover:bg-[#f5f6f8] transition-colors">
            Catálogo
          </Link>
          <Link to={`/catalogo/${slug}/nosotros`} onClick={() => setMenuOpen(false)}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-[#1e2a3a] hover:bg-[#f5f6f8] transition-colors">
            Sobre nosotros
          </Link>
          {(empresa?.whatsapp || empresa?.email_contacto) && (
            <button onClick={() => { contactar(); setMenuOpen(false) }}
              className="px-4 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer border-none mt-1 hover:opacity-90 transition-opacity"
              style={{ background: brandColor }}>
              Contactanos
            </button>
          )}
        </div>
      )}
    </nav>
  )
}

export { Navbar }

export default function CatalogoPublic() {
  const { slug } = useParams()
  const [empresa, setEmpresa] = useState(null)
  const [productos, setProductos] = useState([])
  const [error, setError] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [catActiva, setCatActiva] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState([])
  const [fotoModal, setFotoModal] = useState(null)
  const [carritoOpen, setCarritoOpen] = useState(false)

  const brandColor = empresa?.color || '#285576'
  const brandLight = empresa?.color ? empresa.color + '22' : '#e8f0fc'

  useEffect(() => {
    if (!slug) { setError(true); setCargando(false); return }

    ;(async () => {
      const { data: emp } = await db.from('empresas').select('*').eq('slug', slug).single()
      if (!emp) { setError(true); setCargando(false); return }
      setEmpresa(emp)
      document.title = emp.nombre + ' — Catálogo'
      const t = emp.tokens || {}
      const root = document.documentElement
      if (emp.color)           root.style.setProperty('--brand',               emp.color)
      if (t.fontFamily)        root.style.setProperty('--font-family',         t.fontFamily)
      if (t.fontFamilyHeading) root.style.setProperty('--font-family-heading', t.fontFamilyHeading)
      if (t.fontScale)         root.style.setProperty('--font-scale',          t.fontScale)
      if (t.radiusCard)        root.style.setProperty('--radius-card',         t.radiusCard)
      if (t.radiusBtn)         root.style.setProperty('--radius-btn',          t.radiusBtn)

      db.from('visitas').insert({ empresa_id: emp.id }).then(() => {})

      const { data: prods } = await db.from('productos').select('*')
        .eq('empresa_id', emp.id).order('posicion', { ascending: true })
      setProductos(prods || [])
      setCargando(false)
    })()
  }, [slug])

  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))].sort()

  const productosFiltrados = productos.filter(p =>
    (!catActiva || p.categoria === catActiva) &&
    (!busqueda || [p.nombre, p.descripcion, p.codigo].some(
      v => (v || '').toLowerCase().includes(busqueda.toLowerCase())
    ))
  )

  const agregarCarrito = useCallback((producto) => {
    setCarrito(c => {
      const existe = c.find(x => x.id === producto.id)
      if (existe) return c.map(x => x.id === producto.id ? { ...x, cantidad: x.cantidad + 1 } : x)
      return [...c, { ...producto, cantidad: 1 }]
    })
  }, [])

  const quitarCarrito = useCallback((id) => {
    setCarrito(c => c.filter(x => x.id !== id))
  }, [])

  const cambiarCantidad = useCallback((id, delta) => {
    setCarrito(c => c.map(x => x.id === id ? { ...x, cantidad: Math.max(1, x.cantidad + delta) } : x))
  }, [])

  const abrirFoto = (producto) => {
    setFotoModal({ url: producto.imagen_url, nombre: producto.nombre })
    if (empresa)
      db.from('visitas').insert({ empresa_id: empresa.id, producto_id: producto.id }).then(() => {})
  }

  const totalCarrito = carrito.reduce((s, x) => s + x.cantidad, 0)

  if (cargando) return (
    <div className="min-h-screen bg-white">
      <Spinner color={brandColor} />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-5xl mb-2">😕</div>
      <h2 className="text-xl font-bold text-[#1e2a3a]">Catálogo no encontrado</h2>
      <p className="text-[#6b7a90] text-sm">Revisá el link o pedile uno nuevo a la empresa.</p>
    </div>
  )

  const tokens = empresa?.tokens || {}

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#1e2a3a]" style={{
      '--brand': brandColor,
      '--brand-light': brandLight,
      '--font-family': tokens.fontFamily || undefined,
      '--font-family-heading': tokens.fontFamilyHeading || undefined,
      '--font-scale': tokens.fontScale || undefined,
      '--radius-card': tokens.radiusCard || undefined,
      '--radius-btn': tokens.radiusBtn || undefined,
    }}>

      {/* Navbar */}
      <Navbar
        empresa={empresa}
        slug={slug}
        brandColor={brandColor}
        carritoCount={totalCarrito}
        onCarrito={() => setCarritoOpen(true)}
      />

      {/* Hero full-width */}
      <div className="relative w-full h-[560px] md:h-[640px] flex items-center overflow-hidden">
        {/* Fondo */}
        {empresa.banner_url && /\.(mp4|webm|ogg)(\?|#|$)/i.test(empresa.banner_url) ? (
          <video key={empresa.banner_url} autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover">
            <source src={empresa.banner_url} />
          </video>
        ) : (
          <div className="absolute inset-0" style={{
            background: brandColor,
            ...(empresa.banner_url ? {
              backgroundImage: `url(${empresa.banner_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : {})
          }} />
        )}
        {/* Overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(110deg, rgba(10,28,50,0.90) 0%, rgba(15,45,80,0.70) 55%, rgba(15,45,80,0.40) 100%)' }} />

        {/* Contenido */}
        <div className="relative z-10 px-6 md:px-16 max-w-[700px]">
          <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-black text-white leading-[1.1] mb-5">
            {empresa.titulo || empresa.nombre}
          </h1>
          {empresa.descripcion && (
            <p className="text-base md:text-lg text-white/80 leading-relaxed mb-8 max-w-[520px]">
              {empresa.descripcion}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setCarritoOpen(true)}
              className="px-6 h-12 rounded-xl text-white text-sm font-bold cursor-pointer border-none hover:opacity-90 transition-opacity"
              style={{ background: brandColor }}>
              Generá tu presupuesto
            </button>
            <Link to={`/catalogo/${slug}/nosotros`}
              className="px-6 h-12 rounded-xl text-white text-sm font-bold flex items-center border border-white/30 bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
              Conocenos
            </Link>
          </div>
        </div>
      </div>

      {/* Barra filtros sticky */}
      <div className="bg-white border-b border-[#dde3ed] px-6 md:px-10 h-16 flex items-center gap-3 sticky top-[64px] z-20
        max-md:h-auto max-md:flex-wrap max-md:gap-2 max-md:py-2.5">
        <div className="inline-flex items-center bg-[#f1f2f4] rounded-[10px] p-1 gap-1 overflow-x-auto shrink min-w-0 max-md:order-1 max-md:w-full"
          style={{ scrollbarWidth: 'none' }}>
          {['', ...categorias].map(cat => (
            <button key={cat} onClick={() => setCatActiva(cat)}
              className="px-5 py-1.5 rounded-[7px] text-sm font-medium cursor-pointer border-none whitespace-nowrap shrink-0 transition-all"
              style={catActiva === cat
                ? { background: 'white', color: '#111', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,.1)' }
                : { background: 'transparent', color: '#666' }}>
              {cat || 'Todas'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 border border-[#dde3ed] rounded-[10px] px-3.5 h-[42px] min-w-[200px] shrink-0 ml-auto transition-colors focus-within:border-current max-md:order-2 max-md:min-w-0 max-md:flex-1 max-md:ml-0">
          <Search size={15} className="text-[#aab] shrink-0" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar productos…"
            className="border-none outline-none text-[.88rem] w-full text-[#1e2a3a] placeholder:text-[#aab] bg-transparent" />
        </div>
        <span className="text-[.8rem] text-[#6b7a90] whitespace-nowrap shrink-0 max-md:order-3 max-md:ml-auto">
          {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Productos */}
      <div className="px-6 md:px-10 py-8 max-sm:px-3 max-sm:py-4">
        {!productosFiltrados.length ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#6b7a90]">
            <div className="text-5xl mb-2">📦</div>
            <h2 className="text-lg font-bold text-[#1e2a3a]">No hay productos todavía</h2>
            <p className="text-sm">Volvé a consultar pronto.</p>
          </div>
        ) : (
          <div className="grid gap-5 max-sm:gap-2.5"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {productosFiltrados.map(p => (
              <ProductCard key={p.id} producto={p}
                enCarrito={carrito.some(x => x.id === p.id)}
                onFoto={() => abrirFoto(p)}
                onAgregar={() => agregarCarrito(p)} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-7 text-[#6b7a90] text-[.8rem] border-t border-[#dde3ed] mt-4">
        Catálogo creado con <a href="/" className="font-semibold" style={{ color: brandColor }}>Ordo</a>
      </div>

      {/* Modales */}
      {fotoModal && (
        <ModalFoto img={fotoModal.url} nombre={fotoModal.nombre} onClose={() => setFotoModal(null)} />
      )}

      {carritoOpen && (
        <ModalCarrito
          carrito={carrito}
          empresa={empresa}
          brandColor={brandColor}
          onClose={() => setCarritoOpen(false)}
          onCambiarCantidad={cambiarCantidad}
          onQuitar={quitarCarrito}
          onEnviado={() => setCarrito([])}
        />
      )}
    </div>
  )
}
