import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, ShoppingBag, Trash2, Plus, Minus, Send, Image } from 'lucide-react'
import { db } from './lib/supabase'
import { Landing } from './components/Landing'
import { useAppStore } from './store/useAppStore'
import { useProductosStore } from './store/useProductosStore'
import { usePedidosStore } from './store/usePedidosStore'
import { Layout } from './components/admin/layout/Layout'
import { Onboarding as AdminOnboarding } from './components/admin/Onboarding'
import { DashboardPanel } from './components/admin/panels/DashboardPanel'
import { ProductosPanel } from './components/admin/panels/ProductosPanel'
import { PedidosPanel } from './components/admin/panels/PedidosPanel'
import { ConfigPanel } from './components/admin/panels/ConfigPanel'
import { PdfPanel } from './components/admin/panels/PdfPanel'

// ── Route detection ──────────────────────────────────────────
const path = window.location.pathname

function getRoute() {
  if (path === '/admin' || path.startsWith('/admin/')) return 'admin'
  const slug = path.replace(/^\//, '').split('/')[0]
  if (slug) return 'catalog'
  return 'landing'
}

const ROUTE = getRoute()

// ── Admin App ────────────────────────────────────────────────
function PanelContent({ panel }) {
  switch (panel) {
    case 'dashboard': return <DashboardPanel />
    case 'productos': return <ProductosPanel />
    case 'pedidos': return <PedidosPanel />
    case 'config': return <ConfigPanel />
    case 'pdf': return <PdfPanel />
    default: return <DashboardPanel />
  }
}

function AdminApp() {
  const { user, empresa, panel, setUser, cargarEmpresa } = useAppStore()
  const cargarProductos = useProductosStore(s => s.cargar)
  const cargarPedidos = usePedidosStore(s => s.cargar)

  useEffect(() => {
    const { data: { subscription } } = db.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user || null
      setUser(u)
      if (u) {
        const emp = await cargarEmpresa()
        if (emp) {
          cargarProductos(emp.id)
          cargarPedidos(emp.id)
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (empresa) {
      cargarProductos(empresa.id)
      cargarPedidos(empresa.id)
    }
  }, [empresa?.id])

  // Not logged in → redirect to landing
  if (user === null) {
    // user starts as null; only redirect after auth check completes
    // We show nothing until auth state is determined (subscription fires quickly)
    return null
  }

  if (!empresa) return <AdminOnboarding initialStep={2} />

  return (
    <Layout>
      <PanelContent panel={panel} />
    </Layout>
  )
}

// ── Admin route wrapper (handles auth loading state) ─────────
function AdminRoute() {
  const [authChecked, setAuthChecked] = useState(false)
  const [initialUser, setInitialUser] = useState(undefined)

  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      setInitialUser(session?.user || null)
      setAuthChecked(true)
    })
  }, [])

  if (!authChecked) return null

  // Not logged in → go to landing
  if (initialUser === null) {
    window.location.href = '/'
    return null
  }

  return <AdminApp />
}

// ── Catalog view ─────────────────────────────────────────────
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8ecf2]">
          <h3 className="text-base font-black flex items-center gap-2">
            <ShoppingBag size={18} style={{ color: brandColor }} /> Tu pedido de presupuesto
          </h3>
          <button onClick={onClose} className="text-[#999] bg-transparent border-none cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
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
              {/* Items */}
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

              {/* Formulario */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Nombre *</label>
                    <input value={nombre} onChange={e => setNombre(e.target.value)}
                      placeholder="Tu nombre" className={inputCls}
                      style={{ '--tw-ring-color': brandColor }}
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

        {/* Footer */}
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

function CatalogApp() {
  const [empresa, setEmpresa] = useState(null)
  const [productos, setProductos] = useState([])
  const [error, setError] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [catActiva, setCatActiva] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState([])
  const [fotoModal, setFotoModal] = useState(null)
  const [carritoOpen, setCarritoOpen] = useState(false)

  const slug = new URLSearchParams(window.location.search).get('slug')
    || window.location.pathname.replace(/^\//, '') || null
  const brandColor = empresa?.color || '#285576'
  const brandLight = empresa?.color ? empresa.color + '22' : '#e8f0fc'

  useEffect(() => {
    if (!slug) { setError(true); setCargando(false); return }

    ;(async () => {
      const { data: emp } = await db.from('empresas').select('*').eq('slug', slug).single()
      if (!emp) { setError(true); setCargando(false); return }
      setEmpresa(emp)
      document.title = emp.nombre + ' — Catálogo'

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

  return (
    <div className="min-h-screen bg-white text-[#1e2a3a]" style={{ '--brand': brandColor, '--brand-light': brandLight }}>

      {/* HEADER logo */}
      <div className="flex justify-center pt-6 pb-0 bg-white">
        <div className="w-[250px] h-[110px] flex items-center justify-center overflow-hidden">
          {empresa.logo_url
            ? <img src={empresa.logo_url} alt={empresa.nombre} className="w-full h-full object-contain" />
            : <span className="text-2xl font-black" style={{ color: brandColor }}>{empresa.nombre}</span>
          }
        </div>
      </div>

      {/* HERO */}
      <div className="mx-auto my-5 rounded-[14px] overflow-hidden relative flex items-center px-14
        max-w-[calc(100%-48px)] w-[1000px] h-[450px]
        max-md:h-[260px] max-md:px-6 max-md:my-3 max-md:max-w-[calc(100%-24px)]
        max-sm:h-[200px] max-sm:px-[18px] max-sm:my-2.5 max-sm:rounded-[10px]">
        <div className="absolute inset-0" style={{
          background: brandColor,
          ...(empresa.banner_url ? { backgroundImage: `url(${empresa.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {})
        }} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(110deg,rgba(15,38,62,0.88) 0%,rgba(25,60,95,0.65) 55%,rgba(25,60,95,0.35) 100%)' }} />
        <div className="relative z-10 w-[500px] max-w-full">
          <h1 className="text-[50px] font-black text-white leading-[1.1] mb-4
            max-md:text-[2rem] max-sm:text-[1.5rem] max-sm:mb-2">
            {empresa.titulo || empresa.nombre}
          </h1>
          {empresa.descripcion && (
            <p className="text-xl text-white/85 leading-relaxed max-md:text-sm max-md:leading-snug max-sm:text-[.82rem]">
              {empresa.descripcion}
            </p>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border-b border-[#dde3ed] px-10 h-16 flex items-center gap-4 sticky top-0 z-20
        max-md:px-4 max-md:h-auto max-md:flex-wrap max-md:gap-2 max-md:py-2.5">
        <div className="flex items-center bg-[#f1f1f1] rounded-[40px] p-1 gap-0.5 overflow-x-auto shrink min-w-0 max-md:order-1 max-md:w-full"
          style={{ scrollbarWidth: 'none' }}>
          {['', ...categorias].map(cat => (
            <button key={cat} onClick={() => setCatActiva(cat)}
              className="px-5 py-2 rounded-[30px] text-[.85rem] font-semibold cursor-pointer border-none whitespace-nowrap shrink-0 transition-all"
              style={catActiva === cat
                ? { background: brandColor, color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,.18)' }
                : { background: 'transparent', color: '#333' }}>
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

      {/* GRID */}
      <div className="px-10 py-7 max-md:px-4 max-md:py-3.5 max-sm:px-3 max-sm:py-3">
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
              <ProductCard key={p.id} producto={p} brandColor={brandColor} brandLight={brandLight}
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

      {/* FAB carrito */}
      {totalCarrito > 0 && (
        <button onClick={() => setCarritoOpen(true)}
          className="fixed bottom-7 right-7 text-white border-none rounded-[13px] px-5 h-[60px] text-[.92rem] font-bold cursor-pointer flex items-center gap-2.5 shadow-[0_4px_20px_rgba(0,0,0,.25)] z-50 hover:scale-[1.04] transition-transform max-sm:bottom-4 max-sm:right-4 max-sm:h-[52px] max-sm:px-4 max-sm:text-[.84rem]"
          style={{ background: brandColor }}>
          <ShoppingBag size={18} style={{ opacity: 0.7 }} />
          Ver presupuesto
          <span className="bg-white rounded-full w-[22px] h-[22px] flex items-center justify-center text-[.8rem] font-black"
            style={{ color: brandColor }}>
            {totalCarrito}
          </span>
        </button>
      )}

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

function ProductCard({ producto: p, brandColor, brandLight, enCarrito, onFoto, onAgregar }) {
  const precio = formatPrecio(p.precio)

  return (
    <div className="bg-white rounded-xl border border-[#dde3ed] overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,.10)]">
      <div className="w-full h-[185px] bg-white flex items-center justify-center overflow-hidden relative border-b border-[#eef1f6] cursor-zoom-in max-sm:h-[130px]"
        onClick={p.imagen_url ? onFoto : undefined}>
        {p.imagen_url
          ? <img src={p.imagen_url} alt={p.nombre} className="absolute inset-0 w-full h-full object-contain p-3.5" />
          : <Image size={32} className="text-[#d8dee6]" />
        }
        {p.codigo && (
          <span className="absolute top-2.5 right-2.5 text-[.68rem] text-[#444] font-mono font-bold bg-[rgba(220,228,238,.92)] px-2 py-0.5 rounded-[5px] z-10 tracking-[.3px]">
            {p.codigo}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 max-sm:px-2.5 max-sm:py-2.5">
        {p.categoria && (
          <span className="self-start text-[.62rem] font-bold px-2.5 py-0.5 rounded-[20px] uppercase tracking-[.6px] mb-2"
            style={{ background: brandLight, color: brandColor }}>
            {p.categoria}
          </span>
        )}
        <div className="text-[.88rem] font-bold uppercase leading-snug mb-1.5 max-sm:text-[.8rem]">{p.nombre}</div>
        {p.descripcion && (
          <div className="text-[.81rem] text-[#6b7a90] leading-relaxed flex-1 mb-3.5 max-sm:text-[.75rem] max-sm:mb-2">{p.descripcion}</div>
        )}
        {precio && (
          <div className="text-[.86rem] font-bold mb-3" style={{ color: brandColor }}>{precio}</div>
        )}
        <button
          onClick={enCarrito ? undefined : onAgregar}
          disabled={enCarrito}
          className="w-full h-[60px] border rounded-lg text-[.84rem] font-semibold flex items-center justify-center gap-1.5 transition-colors max-sm:h-12 max-sm:text-[.78rem]"
          style={enCarrito
            ? { background: '#f0f0f0', borderColor: '#e0e0e0', color: '#6b7a90', cursor: 'default' }
            : { background: 'white', borderColor: '#ccd6e0', color: '#1e2a3a' }
          }
          onMouseEnter={e => { if (!enCarrito) { e.currentTarget.style.background = '#f0f5fb'; e.currentTarget.style.borderColor = brandColor } }}
          onMouseLeave={e => { if (!enCarrito) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#ccd6e0' } }}>
          {enCarrito ? '✓ Agregado' : '+ Presupuestá'}
        </button>
      </div>
    </div>
  )
}

// ── Root App ─────────────────────────────────────────────────
export default function App() {
  if (ROUTE === 'admin') return <AdminRoute />
  if (ROUTE === 'catalog') return <CatalogApp />
  return <LandingRoute />
}

// ── Landing route (check if logged in → redirect to /admin) ──
function LandingRoute() {
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        window.location.href = '/admin'
      } else {
        setChecked(true)
      }
    })
  }, [])

  if (!checked) return null
  return <Landing />
}
