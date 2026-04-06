import { useState, useEffect, useRef } from 'react'
import { Sparkles, Link, RefreshCw, Palette, Shield, Smartphone, Eye, EyeOff } from 'lucide-react'
import { db } from '../lib/supabase'

function useFadeIn() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

function FadeIn({ children, delay = 0, className = '' }) {
  const [ref, visible] = useFadeIn()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(28px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

const OrdoLogo = ({ className = 'h-[22px] w-auto' }) => (
  <img src="/logo-ordo.svg" alt="ORDO" className={className} />
)

function AuthModal({ open, tab: initialTab, onClose }) {
  const [tab, setTab] = useState(initialTab || 'login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (open) { setTab(initialTab || 'login'); setError(''); setSuccess('') } }, [open])

  if (!open) return null

  const handleLogin = async () => {
    setError(''); setLoading(true)
    const { error } = await db.auth.signInWithPassword({ email, password: pass })
    setLoading(false)
    if (error) { setError(error.message); return }
    onClose()
  }

  const handleRegistro = async () => {
    setError(''); setLoading(true)
    const { error } = await db.auth.signUp({ email, password: pass })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess('¡Cuenta creada! Revisá tu email para confirmarla.')
  }

  const handleMagic = async () => {
    setError(''); setLoading(true)
    const { error } = await db.auth.signInWithOtp({ email })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess('¡Link enviado! Revisá tu correo.')
  }

  const inputCls = 'w-full px-3.5 py-2.5 border border-[#dde3ed] rounded-lg text-sm outline-none focus:border-[#295e4f] transition-colors'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-[18px] p-9 w-full max-w-[420px] relative shadow-2xl">
        <button onClick={onClose} className="absolute top-3.5 right-4 text-[#6b7a90] text-xl bg-transparent border-none cursor-pointer">✕</button>

        {tab !== 'magic' && (
          <div className="flex mb-6 border-b-2 border-[#dde3ed]">
            {[['login', 'Iniciar sesión'], ['registro', 'Crear cuenta']].map(([t, label]) => (
              <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }}
                className={`flex-1 py-2.5 text-sm font-semibold border-none cursor-pointer transition-colors bg-transparent
                  ${tab === t ? 'text-[#295e4f] border-b-[3px] border-[#295e4f] -mb-0.5' : 'text-[#6b7a90]'}`}>
                {label}
              </button>
            ))}
          </div>
        )}

        {tab === 'login' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-[#111]">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-[#111]">Contraseña</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)}
                  placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className={inputCls + ' pr-10'} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] transition-colors bg-transparent border-none cursor-pointer p-0">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={handleLogin} disabled={loading}
              className="w-full py-3 bg-[#295e4f] text-white rounded-lg font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 border-none">
              {loading ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
            <div className="flex items-center gap-2 text-[#aaa] text-xs"><div className="flex-1 h-px bg-[#e0e0e0]" />o<div className="flex-1 h-px bg-[#e0e0e0]" /></div>
            <button onClick={() => { setTab('magic'); setError(''); setSuccess('') }}
              className="w-full py-2.5 border border-[#dde3ed] rounded-lg text-sm font-semibold bg-white text-[#111] cursor-pointer hover:bg-[#f4f4f4] transition-colors border-solid">
              Acceder sin contraseña
            </button>
          </div>
        )}

        {tab === 'registro' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-[#111]">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-[#111]">Contraseña</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)}
                  placeholder="Mínimo 6 caracteres" onKeyDown={e => e.key === 'Enter' && handleRegistro()}
                  className={inputCls + ' pr-10'} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] transition-colors bg-transparent border-none cursor-pointer p-0">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            {success && <p className="text-[#295e4f] text-xs">{success}</p>}
            <button onClick={handleRegistro} disabled={loading}
              className="w-full py-3 bg-[#295e4f] text-white rounded-lg font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 border-none">
              {loading ? 'Creando cuenta…' : 'Crear cuenta gratis'}
            </button>
          </div>
        )}

        {tab === 'magic' && (
          <div className="space-y-4">
            <button onClick={() => { setTab('login'); setError(''); setSuccess('') }}
              className="flex items-center gap-1 text-xs text-[#6b7a90] bg-transparent border-none cursor-pointer mb-1 p-0">
              ← Volver
            </button>
            <h2 className="text-lg font-bold">Acceder sin contraseña</h2>
            <p className="text-sm text-[#6b7a90] leading-relaxed">Te enviamos un link único para que inicies sesión sin contraseña.</p>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-[#111]">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" onKeyDown={e => e.key === 'Enter' && handleMagic()}
                className={inputCls} />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            {success && <p className="text-[#295e4f] text-xs">{success}</p>}
            <button onClick={handleMagic} disabled={loading}
              className="w-full py-3 bg-[#295e4f] text-white rounded-lg font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 border-none">
              {loading ? 'Enviando…' : 'Enviar link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: Sparkles, title: 'IA extrae tus productos', desc: 'Subís tu catálogo en PDF y la inteligencia artificial identifica todos los productos automáticamente.' },
  { icon: Link, title: 'Link propio para tus clientes', desc: 'Recibís un link único ordo.app/tu-empresa para compartir con clientes.' },
  { icon: RefreshCw, title: 'Catálogo siempre actualizado', desc: 'Agregás, editás o eliminás productos cuando quieras. Los clientes siempre ven la última versión.' },
  { icon: Palette, title: 'Con tu marca', desc: 'Logo, colores y descripción de tu empresa. Tu catálogo se ve profesional desde el primer día.' },
  { icon: Shield, title: 'Seguro', desc: 'Tus clientes ven el catálogo pero no pueden modificar nada. Vos tenés el control total.' },
  { icon: Smartphone, title: 'Funciona en celular', desc: 'El catálogo se adapta a cualquier pantalla. Tus clientes lo ven perfecto desde el celular.' },
]

const STEPS = [
  { n: '1', title: 'Creás tu cuenta y configurás tu empresa', desc: 'Nombre, logo, descripción y el link único para tus clientes. Tarda 2 minutos.' },
  { n: '2', title: 'Subís tu catálogo en PDF', desc: 'La IA lee el PDF y extrae todos los productos automáticamente. Revisás, editás y confirmás.' },
  { n: '3', title: 'Compartís el link con tus clientes', desc: 'Tus clientes entran al link y ven el catálogo completo con buscador y filtros. Y te mandan su pedido de presupuesto.' },
]

export function Landing() {
  const [modal, setModal] = useState(null)

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f8f8f8', color: '#373c42' }}>

      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', position: 'sticky', top: 0, background: '#f8f8f8', zIndex: 40 }}>
        <OrdoLogo />
        <button onClick={() => setModal('login')} style={{ background: '#1c1c1c', color: 'white', padding: '14px 28px', borderRadius: 14, fontWeight: 600, fontSize: '1rem', cursor: 'pointer', border: 'none' }}>
          Iniciar Sesión
        </button>
      </nav>

      {/* HERO */}
      <section style={{ padding: '32px 48px 48px' }}>
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', maxWidth: 1035, margin: '0 auto', display: 'flex', alignItems: 'flex-end', height: 416 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/hero.png')", backgroundSize: 'cover', backgroundPosition: 'top' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(95deg,rgba(0,0,0,.6) 34%,rgba(49,49,49,.31) 73%,rgba(102,102,102,0) 98%)' }} />
          <div style={{ position: 'relative', zIndex: 1, padding: '0 67px 52px' }}>
            <h1 style={{ fontSize: 43, fontWeight: 900, color: 'white', lineHeight: 1.14, marginBottom: 18, textTransform: 'capitalize' }}>
              Tu catálogo digital<br />listo en minutos
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,.9)', maxWidth: 526, lineHeight: 1.4, marginBottom: 28 }}>
              Subí tu PDF, la IA extrae todos tus productos automáticamente. Tus clientes lo ven online, sin poder editar nada.
            </p>
            <button onClick={() => setModal('registro')} style={{ background: '#295e4f', color: 'white', padding: '18px 24px', borderRadius: 13, fontWeight: 600, fontSize: '1.05rem', cursor: 'pointer', border: 'none', textTransform: 'capitalize' }}>
              Creá tu catálogo
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '80px 48px' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 43, fontWeight: 900, color: '#373c42', textTransform: 'capitalize', marginBottom: 6 }}>Todo lo que necesitás</h2>
            <p style={{ fontSize: '1.5rem', color: '#373c42', textTransform: 'capitalize' }}>Sin técnicos, sin complicaciones</p>
          </div>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 1160, margin: '0 auto' }}>
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <FadeIn key={title} delay={i * 80}>
              <div style={{ background: 'white', borderRadius: 20, padding: '40px 32px', boxShadow: '0 4px 34px rgba(0,0,0,.09)', height: '100%' }}>
                <div style={{ width: 51, height: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={34} strokeWidth={1.5} color="#295e4f" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'black', marginBottom: 10, textTransform: 'capitalize' }}>{title}</h3>
                <p style={{ fontSize: '1rem', color: '#545454', lineHeight: 1.6 }}>{desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section style={{ background: '#1e453b', padding: '80px 48px 112px' }}>
        <FadeIn>
          <h2 style={{ textAlign: 'center', fontSize: 43, fontWeight: 900, color: '#e0e0e0', textTransform: 'capitalize', marginBottom: 64 }}>¿Cómo funciona?</h2>
        </FadeIn>
        <div style={{ display: 'flex', gap: 60, justifyContent: 'center', maxWidth: 1300, margin: '0 auto' }}>
          {STEPS.map(({ n, title, desc }, i) => (
            <FadeIn key={n} delay={i * 120} style={{ flex: 1, maxWidth: 359 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
                <div style={{ width: 77, height: 77, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 900, color: '#1e453b', flexShrink: 0 }}>{n}</div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e0e0e0', lineHeight: 1.4 }}>{title}</h4>
                <p style={{ fontSize: '1rem', color: '#e0e0e0', lineHeight: 1.6 }}>{desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ position: 'relative', height: 480, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/banner.png')", backgroundSize: 'cover', backgroundPosition: 'center 30%', filter: 'brightness(0.65)' }} />
        <FadeIn style={{ position: 'relative', zIndex: 1, marginLeft: 'clamp(40px,8vw,200px)' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '44px 48px', maxWidth: 380 }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#373c42', marginBottom: 14 }}>Empezá hoy</h2>
            <p style={{ fontSize: '1rem', color: '#545454', lineHeight: 1.6, marginBottom: 28 }}>
              Subís tu catálogo en PDF o crealo a mano y tenés tu catálogo hoy mismo.
            </p>
            <button onClick={() => setModal('registro')} style={{ width: '100%', background: '#295e4f', color: 'white', padding: '18px 24px', borderRadius: 13, fontWeight: 600, fontSize: '1.05rem', cursor: 'pointer', border: 'none', textTransform: 'capitalize' }}>
              Creá tu catálogo
            </button>
          </div>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 48px', borderTop: '1px solid #e0e0e0', background: '#f8f8f8' }}>
        <OrdoLogo className="h-[18px] w-auto opacity-50" />
        <span style={{ fontSize: '1rem', color: '#333' }}>Hecho con <span style={{ color: '#c13e58' }}>❤</span> en Argentina</span>
      </footer>

      <AuthModal open={!!modal} tab={modal} onClose={() => setModal(null)} />
    </div>
  )
}
