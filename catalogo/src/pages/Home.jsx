import { useNavigate } from 'react-router-dom'
import { LayoutGrid, Brush } from 'lucide-react'

const OPCIONES = [
  {
    key: 'catalogo',
    label: 'Catálogo',
    desc: 'Creá y compartí tu catálogo digital en minutos',
    icon: LayoutGrid,
    path: '/catalogo',
  },
  {
    key: 'marca',
    label: 'Marca',
    desc: 'Gestioná la identidad de tus clientes y compartiles cada paso',
    icon: Brush,
    path: '/marca',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#efefef] flex flex-col">

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
          {OPCIONES.map(({ key, label, desc, icon: Icon, path }) => (
            <button
              key={key}
              onClick={() => navigate(path)}
              className="flex-1 bg-white rounded-[22px] py-16 px-10 cursor-pointer border-none text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col items-center gap-4"
            >
              <Icon size={40} strokeWidth={1.5} className="text-[#111]" />
              <div className="text-[clamp(28px,3.5vw,48px)] font-medium text-[#111] capitalize">{label}</div>
              <div className="text-[clamp(14px,1.5vw,20px)] text-[#60606f] leading-[1.45] max-w-[280px]">{desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
