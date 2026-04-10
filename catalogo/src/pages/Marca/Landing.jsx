import { useState, useEffect, useRef } from 'react'
import { FileText, Palette, Star, BookOpen, Eye, EyeOff } from 'lucide-react'
import { db } from '../../lib/supabase'

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

function LoginModal({ open, onClose }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [nombre, setNombre] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('login')
  const [success, setSuccess] = useState('')

  useEffect(() => { if (open) { setError(''); setSuccess(''); setTab('login'); setNombre('') } }, [open])
  if (!open) return null

  const ensureCuentaMarca = async (userId, nombreEstudio) => {
    const { data: existings } = await db.from('cuentas_marca').select('id').eq('user_id', userId).limit(1)
    const existing = existings?.[0]
    if (!existing && nombreEstudio?.trim()) {
      await db.from('cuentas_marca').insert({ user_id: userId, nombre: nombreEstudio.trim() })
    }
  }

  const handleLogin = async () => {
    setError(''); setLoading(true)
    const { data, error } = await db.auth.signInWithPassword({ email, password: pass })
    setLoading(false)
    if (error) { setError(error.message); return }
    if (data?.session) {
      // Si viene de Catálogo y no tiene cuentas_marca, pedir nombre
      const { data: cuenta } = await db.from('cuentas_marca').select('id').eq('user_id', data.user.id).single()
      if (!cuenta) {
        // El onboarding del admin se encarga de pedirlo
      }
      window.location.href = '/marca/admin'
    }
    onClose()
  }

  const handleRegistro = async () => {
    if (!nombre.trim()) { setError('El nombre del estudio es obligatorio'); return }
    setError(''); setLoading(true)

    const { data, error } = await db.auth.signUp({ email, password: pass })

    // Si el mail ya existe, logueamos directo y creamos la cuenta de marca
    if (error?.message?.toLowerCase().includes('already registered') || error?.message?.toLowerCase().includes('already exists')) {
      const { data: loginData, error: loginError } = await db.auth.signInWithPassword({ email, password: pass })
      setLoading(false)
      if (loginError) { setError('El mail ya tiene cuenta. Iniciá sesión en la otra pestaña.'); return }
      if (loginData?.user) await ensureCuentaMarca(loginData.user.id, nombre)
      if (loginData?.session) { window.location.href = '/marca/admin'; return }
    }

    setLoading(false)
    if (error) { setError(error.message); return }
    if (data?.user) await ensureCuentaMarca(data.user.id, nombre)
    if (data?.session) {
      window.location.href = '/marca/admin'
    } else {
      setSuccess('¡Cuenta creada! Revisá tu correo para confirmar.')
    }
  }

  const handleMagic = async () => {
    setError(''); setLoading(true)
    const { error } = await db.auth.signInWithOtp({ email })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess('¡Link enviado! Revisá tu correo.')
  }

  const inputCls = 'w-full px-3.5 py-2.5 border border-[#dde3ed] rounded-lg text-sm outline-none focus:border-[#1c1c1c] transition-colors'

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
                  ${tab === t ? 'text-[#1c1c1c] border-b-[3px] border-[#1c1c1c] -mb-0.5' : 'text-[#6b7a90]'}`}>
                {label}
              </button>
            ))}
          </div>
        )}

        {(tab === 'login' || tab === 'registro') && (
          <div className="space-y-4">
            {tab === 'registro' && (
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#111]">Nombre del estudio / diseñador</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Estudio Vela, Ana García…" className={inputCls} />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-[#111]">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-[#111]">Contraseña</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)}
                  placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && (tab === 'login' ? handleLogin() : handleRegistro())}
                  className={inputCls + ' pr-10'} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] transition-colors bg-transparent border-none cursor-pointer p-0">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            {success && <p className="text-green-600 text-xs">{success}</p>}
            <button onClick={tab === 'login' ? handleLogin : handleRegistro} disabled={loading}
              className="w-full py-3 bg-[#1c1c1c] text-white rounded-lg font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 border-none">
              {loading ? '…' : tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
            {tab === 'login' && (
              <>
                <div className="flex items-center gap-2 text-[#aaa] text-xs">
                  <div className="flex-1 h-px bg-[#e0e0e0]" />o<div className="flex-1 h-px bg-[#e0e0e0]" />
                </div>
                <button onClick={() => { setTab('magic'); setError('') }}
                  className="w-full py-2.5 border border-[#dde3ed] rounded-lg text-sm font-semibold bg-white text-[#111] cursor-pointer hover:bg-[#f4f4f4] transition-colors border-solid">
                  Acceder sin contraseña
                </button>
              </>
            )}
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
            {success && <p className="text-[#1c1c1c] text-xs">{success}</p>}
            <button onClick={handleMagic} disabled={loading}
              className="w-full py-3 bg-[#1c1c1c] text-white rounded-lg font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 border-none">
              {loading ? 'Enviando…' : 'Enviar link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const FEATURES = [
  {
    icon: FileText,
    title: 'Brief guiado',
    desc: 'Tu cliente responde preguntas clave sobre su empresa, valores, público y referentes. Todo en un formulario simple y claro.',
  },
  {
    icon: Palette,
    title: 'Exploración visual',
    desc: 'Presentás propuestas de paletas, tipografías y estilos para validar la dirección antes de profundizar.',
  },
  {
    icon: Star,
    title: 'Finalistas',
    desc: 'Refinás las mejores opciones hasta llegar a la identidad definitiva. Tu cliente elige con criterio, no al azar.',
  },
  {
    icon: BookOpen,
    title: 'Manual de marca',
    desc: 'El resultado final: un manual completo y profesional que tu cliente puede usar desde el primer día.',
  },
]

const STEPS = [
  { n: '1', title: 'Tu cliente completa el brief', desc: 'Un formulario guiado con preguntas sobre su empresa, valores, público y referencias visuales.' },
  { n: '2', title: 'Explorás y refinás juntos', desc: 'Presentás opciones de paleta, tipografía y estilo. Tu cliente valida y vos iterás hasta el finalista.' },
  { n: '3', title: 'Entregás el manual', desc: 'Un documento profesional con todo el sistema de identidad, listo para usar en cualquier soporte.' },
]

export default function MarcaLanding() {
  const [loginOpen, setLoginOpen] = useState(false)
  useEffect(() => { document.title = 'Marca — Ordo' }, [])

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
        <div className="relative rounded-xl overflow-hidden max-w-[1035px] mx-auto flex items-end bg-[#1c1c1c]"
          style={{ height: 'clamp(380px, 40vw, 416px)' }}>
          <video autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover">
            <source src="https://videos.pexels.com/video-files/7764354/7764354-hd_2048_1080_25fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(95deg,rgba(0,0,0,.75) 34%,rgba(0,0,0,.4) 70%,rgba(0,0,0,0.15) 100%)' }} />
          <div className="relative z-10 p-6 sm:p-0" style={{ paddingLeft: 'clamp(24px,5vw,67px)', paddingBottom: 'clamp(24px,4vw,52px)' }}>
            <h1 className="text-2xl sm:text-[43px] font-black leading-tight text-white mb-3 sm:mb-[18px]">
              De brief a manual<br />de marca, sin fricción
            </h1>
            <p className="text-sm sm:text-xl text-white/80 max-w-[526px] leading-relaxed mb-5 sm:mb-7">
              Guiás a tu cliente por todo el proceso de identidad visual. Brief, exploración, finalistas y entrega del manual, todo en un solo lugar.
            </p>
            <button onClick={() => setLoginOpen(true)}
              className="bg-white text-[#1c1c1c] px-5 sm:px-6 py-3 sm:py-[22px] rounded-[13px] font-semibold text-sm sm:text-[1.05rem] cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all border-none">
              Empezá hoy
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4 sm:px-12 py-12 sm:py-20">
        <FadeIn className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-[43px] font-black text-[#373c42] mb-1.5">Todo el proceso en un lugar</h2>
          <p className="text-base sm:text-2xl text-[#373c42]">Desde la primera pregunta hasta la entrega final</p>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-[1160px] mx-auto">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <FadeIn key={title} delay={i * 80}>
              <div className="bg-white rounded-[20px] px-6 sm:px-8 py-8 sm:py-10 h-full" style={{ boxShadow: '0 4px 34px rgba(0,0,0,.09)' }}>
                <div className="w-[51px] h-[51px] flex items-center justify-center mb-4">
                  <Icon size={34} strokeWidth={1.5} className="text-[#1c1c1c]" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-black mb-2.5">{title}</h3>
                <p className="text-sm sm:text-base text-[#545454] leading-relaxed">{desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="bg-[#1c1c1c] px-4 sm:px-12 py-12 sm:py-20 pb-16 sm:pb-28">
        <FadeIn>
          <h2 className="text-center text-2xl sm:text-[43px] font-black text-[#e0e0e0] mb-10 sm:mb-16">¿Cómo funciona?</h2>
        </FadeIn>
        <div className="flex flex-col sm:flex-row gap-10 sm:gap-[60px] justify-center max-w-[1300px] mx-auto">
          {STEPS.map(({ n, title, desc }, i) => (
            <FadeIn key={n} delay={i * 120} className="flex-1 max-w-[359px] mx-auto sm:mx-0">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-[77px] h-[77px] rounded-full bg-white flex items-center justify-center text-[40px] font-black text-[#1c1c1c] shrink-0">{n}</div>
                <h4 className="text-lg sm:text-xl font-semibold text-[#e0e0e0] leading-relaxed">{title}</h4>
                <p className="text-sm sm:text-base text-white/50 leading-relaxed">{desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="bg-[#f8f8f8] px-4 sm:px-12 py-16 sm:py-24 flex items-center justify-center">
        <FadeIn className="text-center max-w-[560px]">
          <h2 className="text-2xl sm:text-[36px] font-black text-[#373c42] mb-4">Construí marcas con método</h2>
          <p className="text-sm sm:text-lg text-[#545454] leading-relaxed mb-8">
            Dejá de gestionar el proceso por WhatsApp o email. Tus clientes siguen cada etapa, vos tenés todo en orden.
          </p>
          <button onClick={() => setLoginOpen(true)}
            className="bg-[#1c1c1c] text-white px-8 py-[18px] rounded-[13px] font-semibold text-sm sm:text-[1.05rem] cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all border-none">
            Empezá hoy
          </button>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer className="flex items-center justify-between px-4 sm:px-12 py-8 border-t border-[#e0e0e0] bg-[#f8f8f8]">
        <OrdoLogo className="h-[18px] w-auto opacity-50" />
        <span className="text-sm sm:text-base text-[#333]">Hecho en Argentina</span>
      </footer>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}
