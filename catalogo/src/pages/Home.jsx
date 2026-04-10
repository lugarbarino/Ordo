import { useNavigate } from 'react-router-dom'
import { ArrowRight, LayoutGrid, Brush } from 'lucide-react'

const OPCIONES = [
  {
    key: 'catalogo',
    label: 'Catálogo',
    sub: 'Para vendedores y distribuidores',
    desc: 'Creá tu catálogo digital, compartilo con clientes y recibí pedidos de presupuesto al instante.',
    icon: LayoutGrid,
    path: '/catalogo',
    iconClass: 'icon-catalogo',
    cardClass: 'card-catalogo',
    features: ['Catálogo con fotos y precios', 'Link público para compartir', 'Pedidos de presupuesto'],
    accent: '#1c1c1c',
  },
  {
    key: 'marca',
    label: 'Marca',
    sub: 'Para diseñadores y agencias',
    desc: 'Guiá a tu cliente por todo el proceso de identidad visual, desde el brief hasta el manual de marca.',
    icon: Brush,
    path: '/marca',
    iconClass: 'icon-marca',
    cardClass: 'card-marca',
    features: ['Brief guiado con el cliente', 'Exploración y finalistas', 'Manual de marca profesional'],
    accent: '#1c1c1c',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f5f5f3] flex flex-col">
      <style>{`
        @keyframes grid-pop {
          0%   { transform: scale(1) rotate(0deg); }
          30%  { transform: scale(1.22) rotate(-6deg); }
          60%  { transform: scale(1.18) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes brush-sweep {
          0%   { transform: rotate(0deg) translateY(0); }
          20%  { transform: rotate(-18deg) translateY(-3px); }
          50%  { transform: rotate(12deg) translateY(1px); }
          75%  { transform: rotate(-6deg) translateY(-1px); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        .card-catalogo:hover .icon-catalogo {
          animation: grid-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .card-marca:hover .icon-marca {
          animation: brush-sweep 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .tool-card {
          transition: transform 0.22s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.22s ease;
        }
        .tool-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.13);
        }
        .arrow-icon {
          transition: transform 0.2s ease;
        }
        .tool-card:hover .arrow-icon {
          transform: translateX(3px);
        }
      `}</style>

      {/* Nav */}
      <nav className="px-8 sm:px-12 py-6 flex items-center justify-between">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-5 w-auto" />
      </nav>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-16 pt-4">

        {/* Header */}
        <div className="text-center mb-14 max-w-[560px]">
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[#999] mb-4">Herramientas para tu negocio</p>
          <h1 className="text-[clamp(36px,5vw,58px)] font-black text-[#111] leading-[1.08] tracking-tight mb-4">
            ¿Qué querés hacer hoy?
          </h1>
          <p className="text-[clamp(15px,1.8vw,18px)] text-[#777] leading-relaxed">
            Elegí la herramienta que necesitás.
          </p>
        </div>

        {/* Cards */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-[820px]">
          {OPCIONES.map(({ key, label, sub, desc, icon: Icon, path, iconClass, cardClass, features }) => (
            <button
              key={key}
              onClick={() => navigate(path)}
              className={`${cardClass} tool-card flex-1 bg-white rounded-[24px] p-8 cursor-pointer border border-[#e8e8e6] text-left flex flex-col gap-6`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-[#f0f0ee] rounded-[14px] flex items-center justify-center">
                  <Icon size={22} strokeWidth={1.8} className={`${iconClass} text-[#1c1c1c]`} />
                </div>
                <ArrowRight size={18} className="arrow-icon text-[#bbb] mt-1" />
              </div>

              {/* Text */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-[#aaa] uppercase tracking-widest">{sub}</p>
                <h2 className="text-[clamp(24px,3vw,32px)] font-black text-[#111] leading-none tracking-tight">{label}</h2>
                <p className="text-sm text-[#777] leading-relaxed mt-1">{desc}</p>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-2 mt-auto pt-2 border-t border-[#f0f0ee]">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#555]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1c1c1c] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

      </div>

      <footer className="text-center pb-8 text-xs text-[#bbb]">
        Hecho en Argentina
      </footer>
    </div>
  )
}
