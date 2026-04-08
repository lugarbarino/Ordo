import { useNavigate } from 'react-router-dom'

const OPCIONES = [
  {
    key: 'catalogo',
    label: 'Catálogo',
    desc: 'Creá y compartí tu catálogo digital con clientes',
    emoji: null,
    path: '/catalogo',
    dark: true,
  },
  {
    key: 'marca',
    label: 'Marca',
    desc: 'Construí y gestioná la identidad de tu marca',
    emoji: null,
    path: '/marca',
    dark: false,
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f5f5f3] flex flex-col">

      {/* Nav */}
      <nav className="px-8 py-6">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-6 w-auto" />
      </nav>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-[42px] font-black text-[#1c1c1c] leading-tight tracking-tight">
            ¿Qué querés hacer hoy?
          </h1>
          <p className="text-[#888] text-base mt-3">Elegí una herramienta para empezar</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-[560px]">
          {OPCIONES.map(op => (
            <button
              key={op.key}
              onClick={() => navigate(op.path)}
              className={`flex-1 text-left rounded-[20px] p-7 cursor-pointer border-none transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl group ${
                op.dark
                  ? 'bg-[#1c1c1c] text-white shadow-[0_8px_32px_rgba(0,0,0,0.18)]'
                  : 'bg-white text-[#1c1c1c] shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#e8e8e8]'
              }`}
            >
              <div className={`text-xl font-black mb-2 ${op.dark ? 'text-white' : 'text-[#1c1c1c]'}`}>
                {op.label}
              </div>
              <div className={`text-sm leading-relaxed ${op.dark ? 'text-white/60' : 'text-[#888]'}`}>
                {op.desc}
              </div>
              <div className={`mt-6 text-sm font-semibold flex items-center gap-1.5 transition-gap group-hover:gap-2.5 ${op.dark ? 'text-white/80' : 'text-[#1c1c1c]'}`}>
                Ir a {op.label} <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center pb-8 text-xs text-[#bbb]">
        Hecho en Argentina
      </footer>
    </div>
  )
}
