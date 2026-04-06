import { LayoutDashboard, Upload, Package, Receipt, Building2, LogOut, X, UserCircle } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'
import { db } from '../../../lib/supabase'
import { clsx } from '../../../lib/utils'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { type: 'section', label: 'CATÁLOGO' },
  { id: 'pdf', label: 'Cargar productos', icon: Upload },
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'pedidos', label: 'Pedidos', icon: Receipt },
  { id: 'config', label: 'Mi empresa', icon: Building2 },
  { id: 'cuenta', label: 'Mi cuenta', icon: UserCircle },
]

function NavItem({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative flex items-center gap-2.5 w-full px-5 py-2 text-[0.88rem] font-medium transition-colors border-none bg-transparent cursor-pointer text-left',
        active ? 'text-[#111] font-semibold' : 'text-[#333] hover:bg-[#f8f9fa] hover:text-[#111]'
      )}
    >
      {active && (
        <span className="absolute left-0 top-[15%] bottom-[15%] w-1 bg-[#111] rounded-r-[4px]" />
      )}
      <Icon size={16} className="flex-shrink-0" />
      <span>{item.label}</span>
    </button>
  )
}

export function Sidebar({ onClose }) {
  const { panel, setPanel, empresa, user } = useAppStore()

  const handleLogout = async () => {
    await db.auth.signOut()
    window.location.reload()
  }

  const navigate = (id) => {
    setPanel(id)
    onClose?.()
  }

  const initial = empresa?.nombre?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'O'

  return (
    <aside className="w-[220px] bg-white border-r-2 border-[#f1f1f1] flex flex-col flex-shrink-0 h-screen sticky top-0 overflow-y-auto">
      {/* Logo row — with close button on mobile/tablet */}
      <div className="h-[52px] flex items-center px-5 justify-between">
        <img src="/logo-ordo.svg" alt="ORDO" className="h-[18px] w-auto" />
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors cursor-pointer bg-transparent border-none lg:hidden"
          >
            <X size={18} className="text-[#666]" />
          </button>
        )}
      </div>

      {/* Company selector */}
      <button
        onClick={() => navigate('config')}
        className="mx-3 border border-[#e3e3e3] rounded-lg px-2.5 py-2 cursor-pointer flex items-center gap-2.5 hover:bg-[#f8f9fa] transition-colors bg-transparent text-left"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 overflow-hidden"
          style={{ background: 'var(--brand)' }}
        >
          {empresa?.logo_url
            ? <img src={empresa.logo_url} alt="" className="w-full h-full object-cover" />
            : initial
          }
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-[#111] truncate">
            {empresa?.nombre || 'Mi empresa'}
          </div>
          {empresa?.nombre && (
            <div className="text-[0.7rem] text-[#888] truncate">{user?.email}</div>
          )}
        </div>
      </button>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {NAV.map((item, i) => {
          if (item.type === 'section') {
            return (
              <div key={i} className="px-5 pt-3.5 pb-1 text-[0.7rem] font-bold text-[#666] tracking-[1.2px] uppercase">
                {item.label}
              </div>
            )
          }
          return (
            <NavItem
              key={item.id}
              item={item}
              active={panel === item.id}
              onClick={() => navigate(item.id)}
            />
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 pb-4 pt-3 border-t border-[#e3e3e3]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2 py-2 text-xs text-[#888] hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
