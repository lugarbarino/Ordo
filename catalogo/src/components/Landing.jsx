import { useState, useEffect, useRef } from 'react'
import { Sparkles, Link, RefreshCw, Palette, Shield, Smartphone, Eye, EyeOff } from 'lucide-react'
import { db } from '../lib/supabase'
import { Onboarding } from './Onboarding'

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

function FadeIn({ children, delay = 0, className = '', style = {} }) {
  const [ref, visible] = useFadeIn()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(28px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  )
}

const OrdoLogo = ({ className = 'h-[22px] w-auto' }) => (
  <img src="/logo-ordo.svg" alt="ORDO" className={className} />
)

function LoginModal({ open, onClose, onRegister }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('login')
  const [success, setSuccess] = useState('')
  const [remember, setRemember] = useState(true)

  useEffect(() => { if (open) { setError(''); setSuccess(''); setTab('login') } }, [open])
  if (!open) return null

  const handleLogin = async () => {
    setError(''); setLoading(true)
    const { data, error } = await db.auth.signInWithPassword({ email, password: pass })
    setLoading(false)
    if (error) { setError(error.message); return }
    // Redirect to admin panel after login
    if (data?.session) window.location.href = window.location.origin
    onClose()
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
              <button key={t} onClick={() => { if (t === 'registro') { onClose(); onRegister?.() } else { setTab(t); setError('') } }}
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
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#295e4f] cursor-pointer" />
              <span className="text-xs text-[#6b7a90]">Recordar cuenta</span>
            </label>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={handleLogin} disabled={loading}
              className="w-full py-3 bg-[#295e4f] text-white rounded-lg font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 border-none">
              {loading ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
            <div className="flex items-center gap-2 text-[#aaa] text-xs">
              <div className="flex-1 h-px bg-[#e0e0e0]" />o<div className="flex-1 h-px bg-[#e0e0e0]" />
            </div>
            <button onClick={() => { setTab('magic'); setError('') }}
              className="w-full py-2.5 border border-[#dde3ed] rounded-lg text-sm font-semibold bg-white text-[#111] cursor-pointer hover:bg-[#f4f4f4] transition-colors border-solid">
              Acceder sin contraseña
            </button>
          </div>
        )}

        {tab === 'magic' && (
          <div className="space-y-4">
            <button onClick={() => { setTab('login'); setError('') }}
              className="flex items-center gap-1 text-xs text-[#6b7a90] bg-transparent border-none cursor-pointer mb-1 p-0">
              ← Volver
            </button>
            <h2 className="text-lg font-bold">Acceder sin contraseña</h2>
            <p className="text-sm text-[#6b7a90] leading-relaxed">Te enviamos un link único para iniciar sesión sin contraseña.</p>
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
  const [loginOpen, setLoginOpen] = useState(false)
  const [mode, setMode] = useState('landing') // 'landing' | 'onboarding'

  if (mode === 'onboarding') {
    return <Onboarding onLogin={() => { setMode('landing'); setLoginOpen(true) }} />
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-[#373c42]">

      {/* NAV */}
      <nav className="flex items-center justify-between px-4 sm:px-12 py-5 sticky top-0 bg-[#f8f8f8] z-40">
        <OrdoLogo />
        <button onClick={() => setLoginOpen(true)}
          className="bg-[#1c1c1c] text-white px-4 sm:px-7 py-3 sm:py-4 rounded-[14px] font-semibold text-sm sm:text-base cursor-pointer hover:opacity-80 transition-opacity border-none">
          Iniciar Sesión
        </button>
      </nav>

      {/* HERO */}
      <section className="px-4 sm:px-12 pb-8 sm:pb-12 pt-4 sm:pt-8">
        <div className="relative rounded-xl overflow-hidden max-w-[1035px] mx-auto flex items-end"
          style={{ height: 'clamp(240px, 40vw, 416px)' }}>
          <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: "url('/hero.png')" }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(95deg,rgba(0,0,0,.65) 34%,rgba(49,49,49,.31) 73%,rgba(102,102,102,0) 98%)' }} />
          <div className="relative z-10 p-6 sm:p-0" style={{ paddingLeft: 'clamp(24px,5vw,67px)', paddingBottom: 'clamp(24px,4vw,52px)' }}>
            <h1 className="text-2xl sm:text-[43px] font-black leading-tight text-white mb-3 sm:mb-[18px] capitalize">
              Tu catálogo digital<br />listo en minutos
            </h1>
            <p className="text-sm sm:text-xl text-white/90 max-w-[526px] leading-relaxed mb-5 sm:mb-7 hidden sm:block">
              Subí tu PDF, la IA extrae todos tus productos automáticamente. Tus clientes lo ven online, sin poder editar nada.
            </p>
            <button onClick={() => setMode('onboarding')}
              className="bg-[#295e4f] text-white px-5 sm:px-6 py-3 sm:py-[22px] rounded-[13px] font-semibold text-sm sm:text-[1.05rem] cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all capitalize border-none">
              Creá tu catálogo
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4 sm:px-12 py-12 sm:py-20">
        <FadeIn className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-[43px] font-black text-[#373c42] capitalize mb-1.5">Todo lo que necesitás</h2>
          <p className="text-base sm:text-2xl text-[#373c42] capitalize">Sin técnicos, sin complicaciones</p>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-[1160px] mx-auto">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <FadeIn key={title} delay={i * 80}>
              <div className="bg-white rounded-[20px] px-6 sm:px-8 py-8 sm:py-10 h-full" style={{ boxShadow: '0 4px 34px rgba(0,0,0,.09)' }}>
                <div className="w-[51px] h-[51px] flex items-center justify-center mb-4">
                  <Icon size={34} strokeWidth={1.5} className="text-[#295e4f]" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-black mb-2.5 capitalize">{title}</h3>
                <p className="text-sm sm:text-base text-[#545454] leading-relaxed">{desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="bg-[#1e453b] px-4 sm:px-12 py-12 sm:py-20 pb-16 sm:pb-28">
        <FadeIn>
          <h2 className="text-center text-2xl sm:text-[43px] font-black text-[#e0e0e0] capitalize mb-10 sm:mb-16">¿Cómo funciona?</h2>
        </FadeIn>
        <div className="flex flex-col sm:flex-row gap-10 sm:gap-[60px] justify-center max-w-[1300px] mx-auto">
          {STEPS.map(({ n, title, desc }, i) => (
            <FadeIn key={n} delay={i * 120} className="flex-1 max-w-[359px] mx-auto sm:mx-0">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-[77px] h-[77px] rounded-full bg-white flex items-center justify-center text-[40px] font-black text-[#1e453b] shrink-0">{n}</div>
                <h4 className="text-lg sm:text-xl font-semibold text-[#e0e0e0] leading-relaxed">{title}</h4>
                <p className="text-sm sm:text-base text-[#e0e0e0] leading-relaxed">{desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="relative overflow-hidden flex items-center" style={{ height: 'clamp(320px,45vw,480px)' }}>
        <div className="absolute inset-0 bg-cover" style={{ backgroundImage: "url('/banner.png')", backgroundPosition: 'center 30%', filter: 'brightness(0.65)' }} />
        <FadeIn className="relative z-10 mx-4 sm:mx-0" style={{ marginLeft: 'clamp(16px,8vw,200px)' }}>
          <div className="bg-white rounded-[20px] px-6 sm:px-12 py-8 sm:py-11 max-w-[380px]">
            <h2 className="text-2xl sm:text-[32px] font-black text-[#373c42] mb-3.5">Empezá hoy</h2>
            <p className="text-sm sm:text-base text-[#545454] leading-relaxed mb-6 sm:mb-7">
              Subís tu catálogo en PDF o crealo a mano y tenés tu catálogo hoy mismo.
            </p>
            <button onClick={() => setMode('onboarding')}
              className="w-full bg-[#295e4f] text-white py-4 sm:py-[22px] rounded-[13px] font-semibold text-sm sm:text-[1.05rem] cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all capitalize border-none">
              Creá tu catálogo
            </button>
          </div>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer className="flex items-center justify-between px-4 sm:px-12 py-8 border-t border-[#e0e0e0] bg-[#f8f8f8]">
        <OrdoLogo className="h-[18px] w-auto opacity-50" />
        <span className="text-sm sm:text-base text-[#333]">Hecho con <span className="text-[#c13e58]">❤</span> en Argentina</span>
      </footer>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onRegister={() => setMode('onboarding')} />
    </div>
  )
}
