import { useState } from 'react'
import { Menu, X, LayoutDashboard, Upload, Package, Receipt, Building2 } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Toast } from '../ui/Toast'
import { useAppStore } from '../../../store/useAppStore'
import { clsx } from '../../../lib/utils'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  productos: 'Productos',
  pedidos: 'Pedidos',
  config: 'Mi empresa',
  pdf: 'Cargar productos',
}

const BOTTOM_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'pedidos', label: 'Pedidos', icon: Receipt },
  { id: 'config', label: 'Empresa', icon: Building2 },
]

export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { panel, setPanel } = useAppStore()

  return (
    <div className="flex h-screen overflow-hidden bg-white lg:[zoom:1.19]">

      {/* ── Desktop sidebar (lg+) ─────────────────────── */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* ── Mobile/Tablet drawer overlay ─────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-0 top-0 h-full" onClick={e => e.stopPropagation()}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main area ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar — tablet + mobile only */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-[#e3e3e3] flex items-center gap-3 px-4 h-13 flex-shrink-0" style={{ height: 52 }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors cursor-pointer bg-transparent border-none"
          >
            <Menu size={20} className="text-[#111]" />
          </button>
          <span className="text-base font-bold text-[#111]">{PAGE_TITLES[panel] || 'Dashboard'}</span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-7 max-w-5xl mx-auto pb-24 md:pb-24 lg:pb-7">
            {children}
          </div>
        </main>

        {/* ── Bottom nav — mobile only (< md) ──────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#e3e3e3] flex">
          {BOTTOM_NAV.map(item => {
            const Icon = item.icon
            const active = panel === item.id
            return (
              <button
                key={item.id}
                onClick={() => setPanel(item.id)}
                className={clsx(
                  'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 cursor-pointer bg-transparent border-none transition-colors',
                  active ? 'text-[var(--brand)]' : 'text-[#888]'
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </button>
            )
          })}
        </nav>

      </div>

      <Toast />
    </div>
  )
}
