import { useState, useEffect } from 'react'
import { useAppStore } from '../../../store/useAppStore'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Tabs } from '../ui/Tabs'

const FONT_FAMILIES = [
  { label: 'Inter',                  body: "'Inter', sans-serif",  heading: null,                    sample: 'Inter',       sub: 'Todo Inter'           },
  { label: 'Geist',                  body: "'Geist', sans-serif",  heading: null,                    sample: 'Geist',       sub: 'Todo Geist'           },
  { label: 'Lora + Inter',           body: "'Inter', sans-serif",  heading: "'Lora', serif",         sample: 'Lora',        sub: 'Títulos serif'        },
  { label: 'Geist Mono + Geist',     body: "'Geist', sans-serif",  heading: "'Geist Mono', monospace", sample: 'Geist Mono', sub: 'Títulos mono'       },
]

const FONT_SCALES = [
  { label: 'Pequeño', value: '0.88' },
  { label: 'Normal',  value: '1'    },
  { label: 'Grande',  value: '1.13' },
]

const RADIUS_PRESETS = [
  { label: 'Recto',   card: '4px',  btn: '4px'  },
  { label: 'Suave',   card: '12px', btn: '8px'  },
  { label: 'Redondo', card: '20px', btn: '50px' },
]

function SectionTitle({ children }) {
  return (
    <div className="text-xs font-bold text-[#666] uppercase tracking-[1px] mb-4">{children}</div>
  )
}

export function DesignPanel() {
  const { empresa, guardarEmpresa, showToast } = useAppStore()
  const tokens = empresa?.tokens || {}

  const [color,     setColor]     = useState(empresa?.color || '#285576')
  const [fontPreset,        setFontPreset]        = useState(tokens.fontPreset        || 'Inter')
  const [fontFamily,        setFontFamily]        = useState(tokens.fontFamily        || "'Inter', sans-serif")
  const [fontFamilyHeading, setFontFamilyHeading] = useState(tokens.fontFamilyHeading || null)
  const [fontScale,  setFontScale]  = useState(tokens.fontScale  || '1')
  const [radius,    setRadius]    = useState(tokens.radiusCard || '12px')
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    setColor(empresa?.color || '#285576')
    const t = empresa?.tokens || {}
    setFontPreset(t.fontPreset || 'Inter')
    setFontFamily(t.fontFamily || "'Inter', sans-serif")
    setFontFamilyHeading(t.fontFamilyHeading || null)
    setFontScale(t.fontScale  || '1')
    setRadius(t.radiusCard || '12px')
  }, [empresa])

  const applyColor = (c) => {
    setColor(c)
    document.documentElement.style.setProperty('--brand', c)
  }

  const applyFamily = (opt) => {
    setFontPreset(opt.label)
    setFontFamily(opt.body)
    setFontFamilyHeading(opt.heading)
    document.documentElement.style.setProperty('--font-family', opt.body)
    document.documentElement.style.setProperty('--font-family-heading', opt.heading || opt.body)
  }

  const applyScale = (s) => {
    setFontScale(s)
    document.documentElement.style.setProperty('--font-scale', s)
  }

  const applyRadius = (preset) => {
    setRadius(preset.card)
    document.documentElement.style.setProperty('--radius-card', preset.card)
    document.documentElement.style.setProperty('--radius-btn',  preset.btn)
  }

  const guardar = async () => {
    setSaving(true)
    const preset = RADIUS_PRESETS.find(r => r.card === radius) || RADIUS_PRESETS[1]
    const tokens = { fontPreset, fontFamily, fontFamilyHeading, fontScale, radiusCard: radius, radiusBtn: preset.btn }
    await guardarEmpresa({ color, tokens })
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold">Apariencia</h2>
        <p className="text-sm text-[#888] mt-1">Personalizá los colores, tipografía y forma del panel.</p>
      </div>

      {/* Color */}
      <Card className="p-6 space-y-4">
        <SectionTitle>Color de marca</SectionTitle>
        <div className="flex items-center gap-4">
          <div className="relative w-10 h-10 rounded-lg border border-[#e3e3e3] overflow-hidden cursor-pointer flex-shrink-0" style={{ background: color }}>
            <input
              type="color"
              value={color}
              onChange={e => applyColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
          <span className="text-sm font-mono text-[#666]">{color.toUpperCase()}</span>
        </div>
        <div className="flex gap-2 pt-1 flex-wrap">
          <Button variant="primary">Botón primario</Button>
          <Button variant="secondary">Botón secundario</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Eliminar</Button>
        </div>
      </Card>

      {/* Tipografía */}
      <Card className="p-6 space-y-5">
        <div>
          <SectionTitle>Fuente</SectionTitle>
          <div className="flex gap-3 flex-wrap">
            {FONT_FAMILIES.map(opt => (
              <button
                key={opt.label}
                onClick={() => applyFamily(opt)}
                className={`px-5 py-3 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                  fontPreset === opt.label
                    ? 'border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]'
                    : 'border-[#e3e3e3] bg-white text-[#444] hover:border-[#bbb]'
                }`}
                style={{ fontFamily: opt.heading || opt.body }}
              >
                {opt.sample}
                <span className="block text-xs font-normal opacity-60 mt-0.5" style={{ fontFamily: opt.body }}>
                  {opt.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Tamaño de fuente</SectionTitle>
        <Tabs
          tabs={FONT_SCALES.map(o => ({ value: o.value, label: o.label }))}
          active={fontScale}
          onChange={applyScale}
        />
        <div className="mt-4 space-y-3">
          <h2 className="text-2xl font-bold m-0">Título principal</h2>
          <div className="text-base font-medium text-[#444]">Subtítulo de sección</div>
          <div className="text-sm text-[#888]">Texto de cuerpo y descripciones del contenido.</div>
          <div className="text-xs text-[#aaa]">Texto pequeño · etiquetas · metadatos</div>
        </div>
        </div>
      </Card>

      {/* Forma */}
      <Card className="p-6 space-y-4">
        <SectionTitle>Cards e inputs</SectionTitle>
        <Tabs
          tabs={RADIUS_PRESETS.map(o => ({ value: o.card, label: o.label }))}
          active={radius}
          onChange={v => applyRadius(RADIUS_PRESETS.find(r => r.card === v))}
        />
        <div className="flex gap-4 items-center pt-1 flex-wrap">
          <div className="w-24 h-16 bg-white border border-[#e3e3e3]" style={{ borderRadius: radius }} />
          <Button variant="primary">Guardar</Button>
          <Button variant="secondary">Cancelar</Button>
          <input
            readOnly
            value="Input de texto"
            className="px-3 py-2 text-sm border border-[#e3e3e3] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 transition-all"
            style={{ borderRadius: 'var(--radius-btn)' }}
          />
        </div>
      </Card>

      <div className="flex justify-end">
      <Button variant="primary" size="md" loading={saving} onClick={guardar}>
        Guardar apariencia
      </Button>
      </div>
    </div>
  )
}
