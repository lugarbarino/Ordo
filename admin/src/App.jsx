import { useEffect } from 'react'
import { db } from './lib/supabase'
import { useAppStore } from './store/useAppStore'
import { useProductosStore } from './store/useProductosStore'
import { usePedidosStore } from './store/usePedidosStore'
import { Layout } from './components/layout/Layout'
import { Landing } from './components/Landing'
import { Onboarding } from './components/Onboarding'
import { DashboardPanel } from './components/panels/DashboardPanel'
import { ProductosPanel } from './components/panels/ProductosPanel'
import { PedidosPanel } from './components/panels/PedidosPanel'
import { ConfigPanel } from './components/panels/ConfigPanel'
import { PdfPanel } from './components/panels/PdfPanel'

function PanelContent({ panel }) {
  switch (panel) {
    case 'dashboard': return <DashboardPanel />
    case 'productos': return <ProductosPanel />
    case 'pedidos': return <PedidosPanel />
    case 'config': return <ConfigPanel />
    case 'pdf': return <PdfPanel />
    default: return <DashboardPanel />
  }
}

export default function App() {
  const { user, empresa, panel, setUser, cargarEmpresa } = useAppStore()
  const cargarProductos = useProductosStore(s => s.cargar)
  const cargarPedidos = usePedidosStore(s => s.cargar)

  useEffect(() => {
    const { data: { subscription } } = db.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user || null
      setUser(u)
      if (u) {
        const emp = await cargarEmpresa()
        if (emp) {
          cargarProductos(emp.id)
          cargarPedidos(emp.id)
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (empresa) {
      cargarProductos(empresa.id)
      cargarPedidos(empresa.id)
    }
  }, [empresa?.id])

  if (!user) return <Landing />
  if (!empresa) return <Onboarding initialStep={2} />

  return (
    <Layout>
      <PanelContent panel={panel} />
    </Layout>
  )
}
