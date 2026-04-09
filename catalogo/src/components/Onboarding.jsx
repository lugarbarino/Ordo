import { useState, useRef } from 'react'
import { Upload, ChevronRight, Loader2, ArrowLeft, Eye, EyeOff, Check } from 'lucide-react'
import { db, SUPABASE_URL } from '../lib/supabase'
import { PexelsPicker } from './PexelsPicker'

function limpiarSlug(v) {
  return v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function isVideo(url) {
  if (!url) return false
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url) || url.includes('/video-files/')
}

function StepBar({ step }) {
  const steps = ['Tu cuenta', 'Tu empresa', 'Tu catálogo']
  return (
    <div className="flex items-center justify-center gap-2 pt-10 pb-8">
      {steps.map((label, i) => {
        const n = i + 1
        const done = step > n
        const active = step === n
        return (
          <div key={n} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${done ? 'bg-[#295e4f] text-white' : active ? 'bg-[#111] text-white' : 'bg-[#e3e3e3] text-[#999]'}`}>
                {done ? <Check size={13} strokeWidth={2.5} /> : n}
              </div>
              <span className={`text-sm font-medium hidden sm:block transition-colors
                ${active ? 'text-[#111]' : done ? 'text-[#295e4f]' : 'text-[#aaa]'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-10 h-px mx-1 transition-colors ${done ? 'bg-[#295e4f]' : 'bg-[#e3e3e3]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Paso1({ onNext, onLogin }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [yaExiste, setYaExiste] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim() || !pass.trim()) { setError('Completá email y contraseña'); return }
    if (pass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true); setError(''); setYaExiste(false)
    const { data, error } = await db.auth.signUp({ email, password: pass })
    setLoading(false)
    if (error) {
      if (error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('registered')) {
        setYaExiste(true)
        setError('Ya existe una cuenta con ese email.')
      } else {
        setError(error.message)
      }
      return
    }
    onNext({ email, user: data.user })
  }

  const inputCls = 'w-full px-4 py-3 border border-[#e3e3e3] rounded-xl text-sm outline-none focus:border-[#295e4f] transition-colors bg-white'

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-black text-[#111] mb-1">Creá tu cuenta</h1>
      <p className="text-[#666] text-sm mb-8">Gratis, sin tarjeta de crédito.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1.5">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1.5">Contraseña</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)}
              placeholder="Mínimo 6 caracteres" onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className={inputCls + ' pr-11'} />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] transition-colors bg-transparent border-none cursor-pointer p-0">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        {error && (
          <div className="text-sm text-red-500">
            {error}
            {yaExiste && (
              <button onClick={onLogin} className="ml-2 underline font-semibold text-[#295e4f] bg-transparent border-none cursor-pointer">
                Iniciá sesión
              </button>
            )}
          </div>
        )}
        <button onClick={handleSubmit} disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#111] text-white py-3.5 rounded-xl font-semibold text-sm cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-50 border-none mt-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <>Continuar <ChevronRight size={16} /></>}
        </button>
        <p className="text-center text-xs text-[#aaa]">
          ¿Ya tenés cuenta?{' '}
          <button onClick={onLogin} className="text-[#295e4f] font-semibold underline bg-transparent border-none cursor-pointer">
            Iniciá sesión
          </button>
        </p>
      </div>
    </div>
  )
}

function Paso2({ onNext }) {
  const [nombre, setNombre] = useState('')
  const [slug, setSlug] = useState('')
  const [color, setColor] = useState('#3872fa')
  const [logoUrl, setLogoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const logoRef = useRef()

  const handleNombre = (val) => { setNombre(val); setSlug(limpiarSlug(val)) }

  const subirLogo = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error } = await db.storage.from('logos').upload(path, file, { upsert: true })
      if (!error) setLogoUrl(`${SUPABASE_URL}/storage/v1/object/public/logos/${path}`)
    } finally {
      setUploading(false)
    }
  }

  const handleNext = () => {
    if (!nombre.trim()) { setError('El nombre es requerido'); return }
    onNext({ nombre, slug: slug || limpiarSlug(nombre), color, logo_url: logoUrl })
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-black text-[#111] mb-1">Tu empresa</h1>
      <p className="text-[#666] text-sm mb-8">Estos datos se muestran en tu catálogo público.</p>
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1.5">Nombre de la empresa</label>
          <input value={nombre} onChange={e => handleNombre(e.target.value)}
            placeholder="Nombre de tu empresa"
            className="w-full px-4 py-3 border border-[#e3e3e3] rounded-xl text-sm outline-none focus:border-[#295e4f] transition-colors bg-white" />
          {slug && <p className="text-xs text-[#aaa] mt-1">Tu link: ordo-herramienta.vercel.app/catalogo/<strong>{slug}</strong></p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1.5">Logo <span className="text-[#aaa] font-normal">(opcional)</span></label>
          <div onClick={() => logoRef.current?.click()}
            className="w-full h-28 border-2 border-dashed border-[#e3e3e3] rounded-xl flex items-center justify-center cursor-pointer hover:border-[#295e4f] transition-colors overflow-hidden bg-white">
            {uploading ? <Loader2 size={20} className="animate-spin text-[#aaa]" />
              : logoUrl ? <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain p-3" />
              : <div className="flex flex-col items-center gap-1.5 text-[#aaa]"><Upload size={20} /><span className="text-xs">PNG o SVG recomendado</span></div>}
          </div>
          <input ref={logoRef} type="file" accept="image/*,.svg,image/svg+xml" className="hidden"
            onChange={e => subirLogo(e.target.files[0])} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1.5">Color principal</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-11 rounded-xl cursor-pointer border border-[#e3e3e3]"
              style={{ background: color }} onClick={() => document.getElementById('ob-color').click()} />
            <input id="ob-color" type="color" value={color} onChange={e => setColor(e.target.value)} className="w-0 h-0 opacity-0 absolute" />
            <button onClick={() => document.getElementById('ob-color').click()}
              className="px-4 py-2.5 text-sm font-semibold border border-[#e3e3e3] rounded-xl bg-white cursor-pointer hover:bg-[#f8f8f8] transition-colors">
              Elegir
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 bg-[#111] text-white py-3.5 rounded-xl font-semibold text-sm cursor-pointer hover:opacity-85 transition-opacity border-none">
          Continuar <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function Paso3({ onFinish }) {
  const [bannerUrl, setBannerUrl] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pexelsOpen, setPexelsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const bannerRef = useRef()

  const subirBanner = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error } = await db.storage.from('banners').upload(path, file, { upsert: true })
      if (!error) setBannerUrl(`${SUPABASE_URL}/storage/v1/object/public/banners/${path}`)
    } finally {
      setUploading(false)
    }
  }

  const handleFinish = async (skip = false) => {
    setLoading(true)
    await onFinish(skip ? {} : { banner_url: bannerUrl, titulo, descripcion })
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-black text-[#111] mb-1">Banner del catálogo</h1>
      <p className="text-[#666] text-sm mb-8">La imagen o video de fondo que ven tus clientes.</p>
      <div className="space-y-4">
        <div className="relative rounded-xl overflow-hidden bg-[#35425F]" style={{ height: 160 }}>
          {isVideo(bannerUrl) && bannerUrl
            ? <video key={bannerUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover"><source src={bannerUrl} /></video>
            : bannerUrl
            ? <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bannerUrl})` }} />
            : <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-2"><Upload size={24} /><span className="text-xs">Elegí una imagen o video</span></div>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPexelsOpen(true)}
            className="flex-1 py-2.5 text-sm font-semibold border border-[#e3e3e3] rounded-xl bg-white cursor-pointer hover:bg-[#f8f8f8] transition-colors">
            Buscar en Pexels
          </button>
          <button onClick={() => bannerRef.current?.click()} disabled={uploading}
            className="flex-1 py-2.5 text-sm font-semibold border border-[#e3e3e3] rounded-xl bg-white cursor-pointer hover:bg-[#f8f8f8] transition-colors disabled:opacity-50">
            {uploading ? 'Subiendo…' : 'Subir archivo'}
          </button>
        </div>
        <input ref={bannerRef} type="file" accept="image/*,video/mp4,video/webm" className="hidden"
          onChange={e => subirBanner(e.target.files[0])} />
        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1.5">Título</label>
          <input value={titulo} onChange={e => setTitulo(e.target.value)}
            placeholder="Frase que represente tu producto"
            className="w-full px-4 py-3 border border-[#e3e3e3] rounded-xl text-sm outline-none focus:border-[#295e4f] transition-colors bg-white" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1.5">Párrafo</label>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
            placeholder="Explicá un poco más tu servicio" rows={3}
            className="w-full px-4 py-3 border border-[#e3e3e3] rounded-xl text-sm outline-none focus:border-[#295e4f] transition-colors bg-white resize-none" />
        </div>
        <button onClick={() => handleFinish(false)} disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#111] text-white py-3.5 rounded-xl font-semibold text-sm cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-50 border-none">
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Ir al panel'}
        </button>
        <button onClick={() => handleFinish(true)} disabled={loading}
          className="w-full py-2.5 text-sm text-[#aaa] hover:text-[#666] transition-colors bg-transparent border-none cursor-pointer">
          Saltar por ahora
        </button>
      </div>
      <PexelsPicker open={pexelsOpen} onClose={() => setPexelsOpen(false)}
        onSelect={({ url }) => setBannerUrl(url)} />
    </div>
  )
}

export function Onboarding({ onLogin }) {
  const [step, setStep] = useState(1)
  const [empresaData, setEmpresaData] = useState({})

  const handleStep1 = ({ email, user }) => {
    setEmpresaData(d => ({ ...d, email, userId: user?.id }))
    setStep(2)
  }

  const handleStep2 = (data) => {
    setEmpresaData(d => ({ ...d, ...data }))
    setStep(3)
  }

  const handleStep3 = async (bannerData) => {
    const { data: { user } } = await db.auth.getUser()
    const campos = {
      nombre: empresaData.nombre,
      slug: empresaData.slug,
      color: empresaData.color,
      logo_url: empresaData.logo_url,
      email: empresaData.email || user?.email,
      ...bannerData,
      user_id: user?.id,
    }
    const { data } = await db.from('empresas').insert(campos).select().single()
    if (data?.slug) {
      window.location.href = `/${data.slug}`
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-[18px] w-auto" />
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-1.5 text-sm text-[#666] hover:text-[#111] transition-colors bg-transparent border-none cursor-pointer">
            <ArrowLeft size={15} /> Volver
          </button>
        )}
      </nav>
      <StepBar step={step} />
      <div className="flex-1 flex items-start justify-center px-4 py-4">
        {step === 1 && <Paso1 onNext={handleStep1} onLogin={onLogin} />}
        {step === 2 && <Paso2 onNext={handleStep2} />}
        {step === 3 && <Paso3 onFinish={handleStep3} />}
      </div>
    </div>
  )
}
