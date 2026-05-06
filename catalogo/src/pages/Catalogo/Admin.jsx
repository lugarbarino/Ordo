import { useState, useEffect } from 'react'
import { db } from '../../lib/supabase'
import { useAppStore } from '../../store/useAppStore'
import { useProductosStore } from '../../store/useProductosStore'
import { usePedidosStore } from '../../store/usePedidosStore'
import { Layout } from '../../components/admin/layout/Layout'
import { Onboarding as AdminOnboarding } from '../../components/admin/Onboarding'
import { DashboardPanel } from '../../components/admin/panels/DashboardPanel'
import { ProductosPanel } from '../../components/admin/panels/ProductosPanel'
import { PedidosPanel } from '../../components/admin/panels/PedidosPanel'
import { ConfigPanel } from '../../components/admin/panels/ConfigPanel'
import { PdfPanel } from '../../components/admin/panels/PdfPanel'
import { CuentaPanel } from '../../components/admin/panels/CuentaPanel'
import { DesignPanel } from '../../components/admin/panels/DesignPanel'

function PanelContent({ panel }) {
  switch (panel) {
    case 'dashboard': return <DashboardPanel />
    case 'productos': return <ProductosPanel />
    case 'pedidos': return <PedidosPanel />
    case 'config': return <ConfigPanel />
    case 'pdf': return <PdfPanel />
    case 'cuenta': return <CuentaPanel />
    case 'design': return <DesignPanel />
    default: return <DashboardPanel />
  }
}

const PANEL_TITLES_CAT = {
  dashboard: 'Dashboard', productos: 'Productos', pedidos: 'Pedidos',
  config: 'Mi empresa', pdf: 'Cargar productos', cuenta: 'Mi cuenta', design: 'Apariencia',
}

function AdminApp() {
  const { user, empresa, panel, setUser, cargarEmpresa } = useAppStore()

  useEffect(() => {
    document.title = `Catálogo — ${PANEL_TITLES_CAT[panel] || 'Dashboard'}`
  }, [panel])
  const cargarProductos = useProductosStore(s => s.cargar)
  const cargarPedidos = usePedidosStore(s => s.cargar)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const { data: { session } } = await db.auth.getSession()
      if (!mounted) return
      const u = session?.user || null
      setUser(u)
      if (u) {
        const emp = await cargarEmpresa()
        if (emp && mounted) {
          cargarProductos(emp.id)
          cargarPedidos(emp.id)
        }
      }
      if (mounted) setCargando(false)
    }

    init()

    const { data: { subscription } } = db.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return
      if (!mounted) return
      const u = session?.user || null
      setUser(u)
      if (u) {
        const emp = await cargarEmpresa()
        if (emp && mounted) {
          cargarProductos(emp.id)
          cargarPedidos(emp.id)
        }
      } else {
        if (mounted) setCargando(false)
      }
    })

    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (empresa) {
      cargarProductos(empresa.id)
      cargarPedidos(empresa.id)
    }
  }, [empresa?.id])

  if (cargando) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-[#e3e3e3] border-t-[#111] animate-spin" />
    </div>
  )

  if (user === null) return null
  if (!empresa) return <AdminOnboarding initialStep={2} />

  return (
    <Layout>
      <PanelContent panel={panel} />
    </Layout>
  )
}

export default function CatalogoAdmin() {
  const [authChecked, setAuthChecked] = useState(false)
  const [initialUser, setInitialUser] = useState(undefined)

  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      setInitialUser(session?.user || null)
      setAuthChecked(true)
    })
  }, [])

  if (!authChecked) return null

  if (initialUser === null) {
    window.location.href = '/catalogo'
    return null
  }

  return <AdminApp />
}
