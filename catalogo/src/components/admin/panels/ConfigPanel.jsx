import { useState, useEffect, useRef } from 'react'
import { Upload, Building2, Search, ExternalLink } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'
import { db, SUPABASE_URL } from '../../../lib/supabase'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { PexelsPicker } from '../../PexelsPicker'

const DEFAULT_SERVICIOS = ['Entrega a domicilio', 'Envíos a todo el país', 'Todos los medios de pago']

function limpiarSlug(v) {
  return v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function isVideo(url) {
  if (!url) return false
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url) || url.includes('/video-files/')
}

export function ConfigPanel() {
  const { empresa, user, guardarEmpresa, showToast } = useAppStore()
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingBannerServicio, setUploadingBannerServicio] = useState(false)
  const [uploadingBannerNosotros, setUploadingBannerNosotros] = useState(false)
  const [pexelsOpen, setPexelsOpen] = useState(false)
  const [pexelsServicioOpen, setPexelsServicioOpen] = useState(false)
  const [pexelsNosotrosOpen, setPexelsNosotrosOpen] = useState(false)
  const logoRef = useRef()
  const bannerRef = useRef()
  const bannerServicioRef = useRef()
  const bannerNosotrosRef = useRef()

  useEffect(() => {
    if (empresa) {
      setForm({
        nombre: empresa.nombre || '',
        slug: empresa.slug || '',
        email_contacto: empresa.email_contacto || empresa.email || user?.email || '',
        whatsapp: empresa.whatsapp || '',
        color: empresa.color || '#3872fa',
        logo_url: empresa.logo_url || '',
        banner_url: empresa.banner_url || '',
        titulo: empresa.titulo || '',
        descripcion: empresa.descripcion || '',
        tokens: empresa.tokens || {},
      })
    } else {
      setForm({ color: '#3872fa', email_contacto: user?.email || '', whatsapp: '', nombre: '', slug: '', logo_url: '', banner_url: '', titulo: '', descripcion: '', tokens: {} })
    }
  }, [empresa, user])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const setToken = (key, val) => setForm(f => ({ ...f, tokens: { ...f.tokens, [key]: val } }))

  const setServicio = (i, val) => setForm(f => ({
    ...f,
    tokens: {
      ...f.tokens,
      servicios: Object.assign(
        [...((f.tokens?.servicios) || ['', '', ''])],
        { [i]: val }
      )
    }
  }))

  const buildCampos = (f) => ({
    nombre:         f.nombre,
    slug:           f.slug,
    email_contacto: f.email_contacto,
    color:          f.color,
    logo_url:       f.logo_url,
    banner_url:     f.banner_url,
    titulo:         f.titulo,
    descripcion:    f.descripcion,
    tokens:         f.tokens || {},
    ...(f.whatsapp !== undefined ? { whatsapp: f.whatsapp } : {}),
  })

  const subirArchivo = async (file, bucket, setLoading, field) => {
    if (!file) return
    setLoading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error } = await db.storage.from(bucket).upload(path, file, { upsert: true })
      if (error) { showToast('Error al subir: ' + error.message, 'err'); return }
      const url = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
      const newForm = { ...form, [field]: url }
      setForm(newForm)
      await guardarEmpresa(buildCampos(newForm))
    } catch (e) {
      showToast('Error al subir: ' + e.message, 'err')
    } finally {
      setLoading(false)
    }
  }

  const subirToken = async (file, bucket, setLoading, tokenKey) => {
    if (!file) return
    setLoading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error } = await db.storage.from(bucket).upload(path, file, { upsert: true })
      if (error) { showToast('Error al subir: ' + error.message, 'err'); return }
      const url = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
      // Usar setter funcional para leer el form más reciente y evitar closure stale
      setForm(prev => {
        const newForm = { ...prev, tokens: { ...(prev.tokens || {}), [tokenKey]: url } }
        guardarEmpresa(buildCampos(newForm))
        return newForm
      })
    } catch (e) {
      showToast('Error al subir: ' + e.message, 'err')
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    if (!form.nombre?.trim()) { showToast('El nombre de empresa es requerido', 'err'); return }
    setSaving(true)
    await guardarEmpresa(buildCampos(form))
    setSaving(false)
  }

  const slugPreview = form.slug ? `${window.location.origin}/catalogo/${form.slug}` : '—'
  const bannerIsVideo = isVideo(form.banner_url)

  const serviciosForm = form.tokens?.servicios || DEFAULT_SERVICIOS

  return (
    <div className="pb-12">

      {/* ── Fondo full-width 300px ──────────────────────── */}
      <div className="-mx-4 md:-mx-7 -mt-4 md:-mt-7 mb-0 xl:rounded-b-3xl overflow-hidden" style={{ height: 300, position: 'relative' }}>
        {bannerIsVideo && form.banner_url ? (
          <video key={form.banner_url} autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover">
            <source src={form.banner_url} />
          </video>
        ) : (
          <div className="absolute inset-0" style={{
            background: form.banner_url
              ? `url(${form.banner_url}) center/cover no-repeat`
              : 'linear-gradient(135deg, #35425F 0%, #495A82 100%)'
          }} />
        )}
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute top-8 left-6">
          <h2 className="text-2xl font-bold text-white drop-shadow">Mi empresa</h2>
          <p className="text-sm text-white/70 mt-0.5">Configurá tu empresa y catálogo</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto -mt-40 relative z-10 space-y-6">

      {/* ── 1. Formulario principal ─────────────────────── */}
      <Card className="p-6 space-y-5">
        <Input
          label="Nombre de tu empresa"
          value={form.nombre || ''}
          onChange={e => set('nombre', e.target.value)}
          placeholder="Nombre de tu empresa"
        />

        <div className="flex flex-col gap-1">
          <Input
            label="Link público de tu catálogo"
            value={form.slug || ''}
            onChange={e => set('slug', limpiarSlug(e.target.value))}
            placeholder="tumarca"
          />
          <span className="text-xs text-[#888]">Tu link: {slugPreview}</span>
        </div>

        {/* Logo */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#666] uppercase tracking-wide">Logo de la empresa</label>
          <p className="text-sm text-[#6b7a90]">Usá una versión en PNG sin fondo para que se vea limpia sobre fondos claros. También puede estar en .svg, que queda nítido en cualquier tamaño.</p>
          <div
            className="w-full max-w-[200px] h-24 border-2 border-dashed border-[#e3e3e3] rounded-xl flex items-center justify-center cursor-pointer hover:border-[var(--brand)] transition-colors overflow-hidden"
            onClick={() => logoRef.current?.click()}
          >
            {form.logo_url
              ? <img src={form.logo_url} alt="Logo" className="max-h-full max-w-full object-contain p-4" />
              : <Building2 size={32} className="text-[#d8dee6]" />
            }
          </div>
          <input type="file" ref={logoRef} accept="image/*,.svg,image/svg+xml" className="hidden"
            onChange={e => subirArchivo(e.target.files[0], 'logos', setUploadingLogo, 'logo_url')} />
          <p className="text-xs text-[#999]">PNG o SVG · máx 2MB</p>
        </div>

        <Input
          label="Mail para recibir presupuestos"
          type="email"
          value={form.email_contacto || ''}
          onChange={e => set('email_contacto', e.target.value)}
          placeholder="tumail@gmail.com"
        />

        {/* Color */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#666] uppercase tracking-wide">Color principal</label>
          <p className="text-sm text-[#6b7a90]">Para detalles clave de tu catálogo</p>
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-12 rounded-xl cursor-pointer border border-[#e3e3e3]"
              style={{ background: form.color }}
              onClick={() => document.getElementById('inputColor').click()}
            />
            <input id="inputColor" type="color" value={form.color || '#3872fa'}
              onChange={e => set('color', e.target.value)}
              className="w-0 h-0 opacity-0 absolute" />
            <Button size="sm" variant="secondary" onClick={() => document.getElementById('inputColor').click()}>
              Elegir color
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="lg" loading={saving || uploadingLogo} onClick={handleGuardar}>
            Guardar
          </Button>
        </div>
      </Card>

      {/* ── 2. Banner card ─────────────────────────────── */}
      <Card className="p-6 space-y-5">
        <div>
          <h3 className="text-base font-bold mb-1">Banner del catálogo</h3>
          <p className="text-sm text-[#666]">Imagen o video de fondo para tu catálogo público.</p>
        </div>

        {/* Preview */}
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            height: 160,
            background: form.banner_url && !bannerIsVideo
              ? `url(${form.banner_url}) center/cover no-repeat`
              : 'linear-gradient(135deg, #35425F 0%, #495A82 100%)'
          }}
        >
          {bannerIsVideo && form.banner_url && (
            <video key={form.banner_url} autoPlay muted loop playsInline
              className="absolute inset-0 w-full h-full object-cover">
              <source src={form.banner_url} />
            </video>
          )}
          {!form.banner_url && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
              <Upload size={24} className="mb-1.5" />
              <span className="text-xs">Elegí una imagen o video</span>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPexelsOpen(true)}>
            <Search size={13} /> Buscar en Pexels
          </Button>
          <Button size="sm" variant="secondary" loading={uploadingBanner}
            onClick={() => bannerRef.current?.click()}>
            <Upload size={13} /> {uploadingBanner ? 'Subiendo…' : 'Subir archivo'}
          </Button>
        </div>
        <input type="file" ref={bannerRef} accept="image/*,video/mp4,video/webm" className="hidden"
          onChange={e => subirArchivo(e.target.files[0], 'banners', setUploadingBanner, 'banner_url')} />

        <Input
          label="Título"
          value={form.titulo || ''}
          onChange={e => set('titulo', e.target.value)}
          placeholder="Frase que represente tu producto"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#666] uppercase tracking-wide">Párrafo</label>
          <textarea
            value={form.descripcion || ''}
            onChange={e => set('descripcion', e.target.value)}
            placeholder="Explicá un poco más tu servicio"
            rows={3}
            className="w-full px-4 py-2.5 text-sm border border-[#e3e3e3] focus:outline-none focus:border-[var(--brand)] resize-none bg-white text-[#111] placeholder-[#aaa] transition-colors rounded-xl"
          />
        </div>

        <div className="flex justify-end">
          <Button variant="primary" loading={saving} onClick={handleGuardar}>
            Guardar
          </Button>
        </div>
      </Card>

      {/* ── 3. Quiénes somos card ──────────────────────── */}
      <Card className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold mb-1">Quiénes somos</h3>
            <p className="text-sm text-[#666]">Información que aparece en la página pública de presentación de tu empresa.</p>
          </div>
          {form.slug && (
            <a
              href={`/catalogo/${form.slug}/nosotros`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold shrink-0 px-3 h-8 rounded-lg border border-[#e3e3e3] text-[#444] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
            >
              <ExternalLink size={12} /> Ver página
            </a>
          )}
        </div>

        {/* Preview */}
        <div className="rounded-xl overflow-hidden border border-[#e8ecf2]" style={{ height: 120 }}>
          <div className="flex h-full">
            <div className="flex-1 flex flex-col justify-center px-4 py-3"
              style={{ backgroundColor: form.color || '#3872fa' }}>
              {form.logo_url
                ? <img src={form.logo_url} alt="logo" className="h-6 w-auto object-contain mb-2 brightness-0 invert max-w-[80px]" />
                : <div className="h-5 w-16 rounded bg-white/30 mb-2" />
              }
              <p className="text-white text-xs font-black leading-snug line-clamp-2">
                {form.nombre || 'Tu empresa'}
              </p>
              {form.descripcion && (
                <p className="text-white/60 text-[10px] mt-0.5 line-clamp-1">{form.descripcion}</p>
              )}
            </div>
            <div className="w-1/3 relative overflow-hidden">
              {(form.tokens?.banner_nosotros_url || form.banner_url)
                ? <img src={form.tokens?.banner_nosotros_url || form.banner_url} alt="banner" className="absolute inset-0 w-full h-full object-cover" />
                : <div className="absolute inset-0" style={{ backgroundColor: form.color ? form.color + '44' : '#3872fa22' }} />
              }
            </div>
          </div>
        </div>

        {/* Título y párrafo del hero */}
        <Input
          label="Título de Quiénes somos"
          value={form.tokens?.titulo_nosotros || ''}
          onChange={e => setToken('titulo_nosotros', e.target.value)}
          placeholder={form.titulo || form.nombre || 'Título del hero'}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#666] uppercase tracking-wide">Párrafo de Quiénes somos</label>
          <textarea
            value={form.tokens?.descripcion_nosotros || ''}
            onChange={e => setToken('descripcion_nosotros', e.target.value)}
            placeholder={form.descripcion || 'Párrafo del hero'}
            rows={3}
            className="w-full px-4 py-2.5 text-sm border border-[#e3e3e3] focus:outline-none focus:border-[var(--brand)] resize-none bg-white text-[#111] placeholder-[#aaa] transition-colors rounded-xl"
          />
        </div>

        {/* Banner de Quiénes somos */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#666] uppercase tracking-wide">Banner de Quiénes somos</label>
          <p className="text-xs text-[#999]">Imagen o video exclusivo para la página Quiénes somos. Si no subís uno se usa el banner del catálogo.</p>
          {form.tokens?.banner_nosotros_url && (
            <div className="rounded-xl overflow-hidden border border-[#e8ecf2]" style={{ height: 100 }}>
              {isVideo(form.tokens.banner_nosotros_url)
                ? <video key={form.tokens.banner_nosotros_url} autoPlay muted loop playsInline className="w-full h-full object-cover"><source src={form.tokens.banner_nosotros_url} /></video>
                : <img src={form.tokens.banner_nosotros_url} alt="Banner nosotros" className="w-full h-full object-cover" />
              }
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setPexelsNosotrosOpen(true)}>
              <Search size={13} /> Buscar en Pexels
            </Button>
            <Button size="sm" variant="secondary" loading={uploadingBannerNosotros}
              onClick={() => bannerNosotrosRef.current?.click()}>
              <Upload size={13} /> {uploadingBannerNosotros ? 'Subiendo…' : 'Subir archivo'}
            </Button>
          </div>
          <input type="file" ref={bannerNosotrosRef} accept="image/*,video/mp4,video/webm" className="hidden"
            onChange={e => subirToken(e.target.files[0], 'banners', setUploadingBannerNosotros, 'banner_nosotros_url')} />
        </div>

        <Input
          label="WhatsApp"
          value={form.whatsapp || ''}
          onChange={e => set('whatsapp', e.target.value.replace(/\D/g, ''))}
          placeholder="5491112345678 (código de país sin +)"
        />

        <Input
          label="Mail de contacto"
          type="email"
          value={form.email_contacto || ''}
          onChange={e => set('email_contacto', e.target.value)}
          placeholder="tumail@gmail.com"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#666] uppercase tracking-wide">Descripción de la empresa</label>
          <p className="text-xs text-[#999]">Aparece en el hero del catálogo y en la página Quiénes somos.</p>
          <textarea
            value={form.descripcion || ''}
            onChange={e => set('descripcion', e.target.value)}
            placeholder="Contá quiénes son, qué hacen y por qué elegirlos"
            rows={4}
            className="w-full px-4 py-2.5 text-sm border border-[#e3e3e3] focus:outline-none focus:border-[var(--brand)] resize-none bg-white text-[#111] placeholder-[#aaa] transition-colors"
            style={{ borderRadius: 'var(--radius-btn)' }}
          />
        </div>

        {/* Párrafo Quiénes somos */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#666] uppercase tracking-wide">Párrafo "Quiénes somos"</label>
          <p className="text-xs text-[#999]">Texto más largo que aparece en la sección Quiénes somos de la página pública.</p>
          <textarea
            value={form.tokens?.quienes_somos || ''}
            onChange={e => setToken('quienes_somos', e.target.value)}
            placeholder="Contá la historia de tu empresa, sus valores y misión…"
            rows={4}
            className="w-full px-4 py-2.5 text-sm border border-[#e3e3e3] focus:outline-none focus:border-[var(--brand)] resize-none bg-white text-[#111] placeholder-[#aaa] transition-colors"
            style={{ borderRadius: 'var(--radius-btn)' }}
          />
        </div>

        {/* Servicios destacados */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#666] uppercase tracking-wide">Servicios destacados</label>
          <p className="text-xs text-[#999]">Tres servicios que se muestran con íconos en la página Sobre nosotros.</p>
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map(i => (
              <Input
                key={i}
                value={serviciosForm[i] ?? DEFAULT_SERVICIOS[i]}
                onChange={e => setServicio(i, e.target.value)}
                placeholder={DEFAULT_SERVICIOS[i]}
              />
            ))}
          </div>
        </div>

        {/* Banner de servicio */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#666] uppercase tracking-wide">Banner de servicio</label>
          <p className="text-xs text-[#999]">Imagen decorativa que aparece entre los servicios y el mapa.</p>
          {form.tokens?.banner_servicio_url && (
            <div className="rounded-xl overflow-hidden border border-[#e8ecf2]" style={{ height: 100 }}>
              <img
                src={form.tokens.banner_servicio_url}
                alt="Banner servicio"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setPexelsServicioOpen(true)}>
              <Search size={13} /> Buscar en Pexels
            </Button>
            <Button size="sm" variant="secondary" loading={uploadingBannerServicio}
              onClick={() => bannerServicioRef.current?.click()}>
              <Upload size={13} /> {uploadingBannerServicio ? 'Subiendo…' : 'Subir imagen'}
            </Button>
          </div>
          <input type="file" ref={bannerServicioRef} accept="image/*" className="hidden"
            onChange={e => subirToken(e.target.files[0], 'banners', setUploadingBannerServicio, 'banner_servicio_url')} />
        </div>

        {/* Dirección */}
        <Input
          label="Dirección"
          value={form.tokens?.direccion || ''}
          onChange={e => setToken('direccion', e.target.value)}
          placeholder="Av. Corrientes 1234, Buenos Aires"
        />

        {/* Instagram */}
        <Input
          label="Instagram"
          value={form.tokens?.instagram || ''}
          onChange={e => setToken('instagram', e.target.value)}
          placeholder="tucuenta o URL completa"
        />

        {/* Facebook */}
        <Input
          label="Facebook"
          value={form.tokens?.facebook || ''}
          onChange={e => setToken('facebook', e.target.value)}
          placeholder="URL de tu página"
        />

        <div className="flex justify-end">
          <Button variant="primary" loading={saving} onClick={handleGuardar}>
            Guardar
          </Button>
        </div>
      </Card>

      {/* Pexels picker — banner principal */}
      <PexelsPicker
        open={pexelsOpen}
        onClose={() => setPexelsOpen(false)}
        onSelect={({ url }) => set('banner_url', url)}
      />

      {/* Pexels picker — banner de servicio */}
      <PexelsPicker
        open={pexelsServicioOpen}
        onClose={() => setPexelsServicioOpen(false)}
        onSelect={async ({ url }) => {
          const newForm = { ...form, tokens: { ...(form.tokens || {}), banner_servicio_url: url } }
          setForm(newForm)
          await guardarEmpresa(buildCampos(newForm))
        }}
      />

      {/* Pexels picker — banner de Quiénes somos */}
      <PexelsPicker
        open={pexelsNosotrosOpen}
        onClose={() => setPexelsNosotrosOpen(false)}
        onSelect={async ({ url }) => {
          const newForm = { ...form, tokens: { ...(form.tokens || {}), banner_nosotros_url: url } }
          setForm(newForm)
          await guardarEmpresa(buildCampos(newForm))
        }}
      />

      </div>{/* end max-w-xl */}
    </div>
  )
}
