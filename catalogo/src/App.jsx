import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const Home = lazy(() => import('./pages/Home'))
const CatalogoLanding = lazy(() => import('./pages/Catalogo/Landing'))
const CatalogoAdmin = lazy(() => import('./pages/Catalogo/Admin'))
const CatalogoPublic = lazy(() => import('./pages/Catalogo/Public'))
const MarcaLanding = lazy(() => import('./pages/Marca/Landing'))
const MarcaAdmin = lazy(() => import('./pages/Marca/Admin'))
const MarcaManual = lazy(() => import('./pages/Marca/Cliente/Manual'))
const Brief = lazy(() => import('./pages/Marca/Cliente/Brief'))
const Exploracion = lazy(() => import('./pages/Marca/Cliente/Exploracion'))
const Finalista = lazy(() => import('./pages/Marca/Cliente/Finalista'))

function Spinner() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-[#e3e3e3] border-t-[#111] animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Catálogo */}
          <Route path="/catalogo" element={<CatalogoLanding />} />
          <Route path="/catalogo/admin" element={<CatalogoAdmin />} />
          <Route path="/catalogo/:slug" element={<CatalogoPublic />} />

          {/* Marca */}
          <Route path="/marca" element={<MarcaLanding />} />
          <Route path="/marca/admin" element={<MarcaAdmin />} />
          <Route path="/marca/:nombre" element={<MarcaManual />} />
          <Route path="/marca/:nombre/brief" element={<Brief />} />
          <Route path="/marca/:nombre/exploracion" element={<Exploracion />} />
          <Route path="/marca/:nombre/finalista" element={<Finalista />} />

          {/* Compatibilidad rutas viejas */}
          <Route path="/admin" element={<Navigate to="/catalogo/admin" replace />} />
          <Route path="/admin/*" element={<Navigate to="/catalogo/admin" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
