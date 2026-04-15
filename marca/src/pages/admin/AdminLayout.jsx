import { useEffect } from 'react'
import { useNavigate, Outlet, NavLink } from 'react-router-dom'
import { LogOut, FolderOpen } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'

export function AdminLayout() {
  const { user, loading, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) navigate('/admin')
  }, [user, loading])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#888] text-sm">Cargando…</div>
  if (!user) return null

  const handleLogout = async () => {
    await logout()
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* Sidebar */}
      <aside className="w-[200px] bg-white border-r border-[#e3e3e3] flex flex-col flex-shrink-0 h-screen sticky top-0">
        <div className="h-14 flex items-center px-5 border-b border-[#f1f1f1]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#191A23]" />
            <span className="text-sm font-bold">Marca</span>
          </div>
        </div>

        <nav className="flex-1 py-3">
          <NavLink
            to="/admin/proyectos"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-5 py-2 text-sm font-medium transition-colors ${
                isActive ? 'text-[#111] font-semibold' : 'text-[#555] hover:text-[#111]'
              }`
            }
          >
            <FolderOpen size={15} />
            Proyectos
          </NavLink>
        </nav>

        <div className="px-4 pb-4 pt-3 border-t border-[#e3e3e3]">
          <div className="text-[10px] text-[#aaa] truncate mb-2">{user.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-[#888] hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 p-8">
        <Outlet />
      </main>
    </div>
  )
}
