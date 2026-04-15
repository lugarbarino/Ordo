import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { ExploracionPage } from './pages/ExploracionPage'
import { FinalistasPage } from './pages/FinalistasPage'
import { ManualPage } from './pages/ManualPage'
import { LoginPage } from './pages/admin/LoginPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { ProyectosPage } from './pages/admin/ProyectosPage'
import { ProyectoEditor } from './pages/admin/ProyectoEditor'

export default function App() {
  const { init } = useAuthStore()

  useEffect(() => { init() }, [])

  return (
    <Routes>
      {/* Vistas públicas */}
      <Route path="/:slug/exploracion" element={<ExploracionPage />} />
      <Route path="/:slug/finalistas" element={<FinalistasPage />} />
      <Route path="/:slug/manual" element={<ManualPage />} />

      {/* Admin */}
      <Route path="/admin">
        <Route index element={<LoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="proyectos" element={<ProyectosPage />} />
          <Route path="proyectos/:id" element={<ProyectoEditor />} />
        </Route>
      </Route>

      <Route path="*" element={
        <div className="flex items-center justify-center min-h-screen text-[#888] text-sm">
          Página no encontrada
        </div>
      } />
    </Routes>
  )
}
