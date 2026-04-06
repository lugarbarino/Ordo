import { useEffect, useState } from 'react'
import { Receipt, Link, ExternalLink, Clock, TrendingUp } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'
import { useProductosStore } from '../../../store/useProductosStore'
import { db } from '../../../lib/supabase'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

function StatCard({ label, value, icon: Icon, onClick }) {
  return (
    <div
      className={`relative bg-white border border-[#e3e3e3] rounded-xl p-5 ${onClick ? 'cursor-pointer hover:border-[#ccc]' : ''} transition-colors`}
      onClick={onClick}
    >
      <div className="pr-12">
        <div className="text-2xl font-bold text-[#111]">{value ?? '—'}</div>
        <div className="text-sm text-[#666] mt-0.5">{label}</div>
      </div>
      <div className="absolute right-4 top-4 w-10 h-10 bg-[#eef3ff] rounded-lg flex items-center justify-center text-[var(--brand)]">
        <Icon size={22} />
      </div>
    </div>
  )
}

export function DashboardPanel() {
  const { empresa, setPanel, showToast } = useAppStore()
  const productos = useProductosStore(s => s.productos)
  const [pedidosPendientes, setPedidosPendientes] = useState(null)
  const [pedidosEsteMes, setPedidosEsteMes] = useState(null)
  const [visitasEsteMes, setVisitasEsteMes] = useState(null)
  const [masVistos, setMasVistos] = useState([])
  const [ultimosPedidos, setUltimosPedidos] = useState([])

  useEffect(() => {
    if (!empresa) return
    const inicioMes = new Date()
    inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0)
    const iso = inicioMes.toISOString()

    db.from('pedidos').select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa.id).eq('estado', 'Pendiente')
      .then(({ count }) => setPedidosPendientes(count || 0))

    db.from('pedidos').select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa.id).gte('created_at', iso)
      .then(({ count }) => setPedidosEsteMes(count || 0))

    db.from('visitas').select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa.id).is('producto_id', null).gte('created_at', iso)
      .then(({ count }) => setVisitasEsteMes(count || 0))

    // Productos más vistos este mes
    db.from('visitas').select('producto_id')
      .eq('empresa_id', empresa.id).not('producto_id', 'is', null).gte('created_at', iso)
      .then(async ({ data }) => {
        if (!data?.length) return
        const counts = {}
        data.forEach(v => { counts[v.producto_id] = (counts[v.producto_id] || 0) + 1 })
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3)
        const ids = top.map(([id]) => id)
        const { data: prods } = await db.from('productos').select('id, nombre').in('id', ids)
        setMasVistos(top.map(([id, n]) => ({ nombre: prods?.find(p => p.id === id)?.nombre || '—', visitas: n })))
      })

    db.from('pedidos').select('*').eq('empresa_id', empresa.id)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setUltimosPedidos(data || []))
  }, [empresa])

  const categorias = new Set(productos.map(p => p.categoria).filter(Boolean)).size
  const catalogoUrl = empresa?.slug ? `${window.location.origin.replace('5173', '3000')}/${empresa.slug}` : null

  const copiarLink = () => {
    if (!catalogoUrl) return
    navigator.clipboard.writeText(catalogoUrl)
    showToast('Link copiado')
  }

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div
        className="rounded-xl p-8 text-white flex items-center justify-between min-h-[190px] relative overflow-hidden"
        style={{ background: 'linear-gradient(110deg, rgba(0,0,0,.65) 0%, rgba(0,0,0,.3) 60%, transparent 100%), url(/banner-dash.png) center/cover no-repeat' }}
      >
        <div>
          <div className="text-xs text-white/70 uppercase tracking-wide mb-2">Compartí tu catálogo</div>
          <h2 className="text-2xl font-bold mb-1">
            Tu catálogo con {productos.length} productos<br />ya está disponible
          </h2>
          <p className="text-white/80 text-sm mb-4">
            Compartí tu link con tus clientes y recibí tus pedidos
          </p>
          <div className="flex gap-2">
            {catalogoUrl && (
              <button
                onClick={() => window.open(catalogoUrl, '_blank')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-[#111] hover:bg-white/90 transition-colors cursor-pointer border-none"
              >
                <ExternalLink size={13} /> Ver
              </button>
            )}
            <button
              onClick={copiarLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-white/40 text-white hover:bg-white/10 transition-colors cursor-pointer bg-transparent"
            >
              <Link size={13} /> Copiar link
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="text-xs font-bold text-[#666] uppercase tracking-wide mb-3">Este mes</div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Visitas al catálogo" value={visitasEsteMes} icon={TrendingUp} />
          <StatCard label="Presupuestos" value={pedidosEsteMes} icon={Receipt} onClick={() => setPanel('pedidos')} />
          <StatCard label="Pendientes" value={pedidosPendientes} icon={Clock} onClick={() => setPanel('pedidos')} />
        </div>
      </div>

      {/* Más vistos + Últimos pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-6">
          <h3 className="text-base font-bold mb-4">Productos más vistos</h3>
          {!masVistos.length ? (
            <p className="text-sm text-[#888]">Todavía no hay visitas registradas.</p>
          ) : (
            <div className="space-y-2">
              {masVistos.map(({ nombre, visitas }, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#f8f9fa]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#aaa] w-4">{i + 1}</span>
                    <span className="text-sm font-medium text-[#111] truncate max-w-[180px]">{nombre}</span>
                  </div>
                  <span className="text-sm font-bold text-[#666]">{visitas} vista{visitas !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-bold mb-4">Últimos pedidos</h3>
          {!ultimosPedidos.length ? (
            <p className="text-sm text-[#888]">Todavía no recibiste pedidos.</p>
          ) : (
            <div className="space-y-3">
              {ultimosPedidos.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 py-2 border-b border-[#f0f0f0] last:border-0">
                  <div>
                    <div className="text-sm font-semibold">{p.nombre_cliente || 'Cliente'}</div>
                    <div className="text-xs text-[#888]">
                      {p.productos?.length || 0} producto{p.productos?.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <Badge variant={p.estado === 'Respondido' ? 'respondido' : 'pendiente'}>
                    {p.estado || 'Pendiente'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
