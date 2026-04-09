import { useNavigate } from 'react-router-dom'
import { LayoutGrid, Brush } from 'lucide-react'

const OPCIONES = [
  {
    key: 'catalogo',
    label: 'Catálogo',
    desc: 'Creá y compartí tu catálogo digital en minutos',
    icon: LayoutGrid,
    path: '/catalogo',
    iconClass: 'icon-catalogo',
    cardClass: 'card-catalogo',
  },
  {
    key: 'marca',
    label: 'Marca',
    desc: 'Gestioná la identidad de tus clientes y compartiles cada paso',
    icon: Brush,
    path: '/marca',
    iconClass: 'icon-marca',
    cardClass: 'card-marca',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#efefef] flex flex-col">
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
      `}</style>

      {/* Nav */}
      <nav className="px-10 py-7">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-6 w-auto" />
      </nav>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-[900px] text-center mb-12">
          <h1 className="text-[clamp(48px,8vw,96px)] font-medium text-[#111] leading-[1.1] mb-4">
            ¿Qué necesitas hacer hoy?
          </h1>
          <p className="text-[clamp(16px,2vw,24px)] text-[#60606f]">
            Elegí una herramienta para arrancar.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 w-full max-w-[900px]">
          {OPCIONES.map(({ key, label, desc, icon: Icon, path, iconClass, cardClass }) => (
            <button
              key={key}
              onClick={() => navigate(path)}
              className={`${cardClass} flex-1 bg-white rounded-[22px] py-16 px-10 cursor-pointer border-none text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col items-center gap-4`}
            >
              <Icon size={40} strokeWidth={1.5} className={`${iconClass} text-[#111]`} />
              <div className="text-[clamp(28px,3.5vw,48px)] font-medium text-[#111] capitalize">{label}</div>
              <div className="text-[clamp(14px,1.5vw,20px)] text-[#60606f] leading-[1.45] max-w-[280px]">{desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
