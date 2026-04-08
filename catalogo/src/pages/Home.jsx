import { useNavigate } from 'react-router-dom'
import { LayoutGrid, Pen } from 'lucide-react'

const OPCIONES = [
  {
    key: 'catalogo',
    label: 'Catalogo',
    desc: 'Creá y compartí tu catalogo digital en minutos',
    icon: LayoutGrid,
    path: '/catalogo',
  },
  {
    key: 'marca',
    label: 'Marca',
    desc: 'Gestioná la identidad tus clientes y compartiels cada paso',
    icon: Pen,
    path: '/marca',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f0f0ee] flex flex-col">

      {/* Nav */}
      <nav className="px-8 py-6">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-6 w-auto" />
      </nav>

      {/* Main */}
      <div className="flex-1 flex flex-col px-8 pt-8 pb-16">
        <div className="mb-10">
          <h1 className="text-[52px] font-black text-[#1c1c1c] leading-[1.05] tracking-tight mb-3">
            ¿Qué necesitas<br />hacer hoy?
          </h1>
          <p className="text-[#888] text-base">Elegí una herramienta para arrancar.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 max-w-[860px]">
          {OPCIONES.map(({ key, label, desc, icon: Icon, path }) => (
            <button
              key={key}
              onClick={() => navigate(path)}
              className="flex-1 bg-white rounded-[20px] p-10 cursor-pointer border-none text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center gap-3"
            >
              <Icon size={28} strokeWidth={1.8} className="text-[#295e4f]" />
              <div className="text-xl font-black text-[#1c1c1c]">{label}</div>
              <div className="text-sm text-[#888] leading-relaxed max-w-[200px]">{desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
