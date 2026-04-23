import { useEffect, useState } from 'react'
import { Receipt, Link, ExternalLink, Clock, TrendingUp } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'
import { useProductosStore } from '../../../store/useProductosStore'
import { db } from '../../../lib/supabase'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

function StatCard({ label, shortLabel, value, icon: Icon, onClick }) {
  return (
    <div
      className={`bg-white border border-[#e3e3e3] rounded-xl transition-colors ${onClick ? 'cursor-pointer hover:border-[#ccc]' : ''}
        flex flex-col p-3 gap-2 min-h-[90px]
        md:relative md:p-5 md:min-h-0 md:block md:gap-0`}
      onClick={onClick}
    >
      {/* Mobile layout */}
      <div className="flex items-center justify-between md:hidden">
        <div className="text-3xl font-bold text-[#111]">{value ?? '—'}</div>
        <div className="w-8 h-8 bg-[var(--brand-light)] rounded-lg flex items-center justify-center text-[var(--brand)]">
          <Icon size={17} />
        </div>
      </div>
      <div className="text-xs text-[#666] text-center md:hidden">{shortLabel || label}</div>

      {/* Desktop layout */}
      <div className="hidden md:block pr-12">
        <div className="text-2xl font-bold text-[#111]">{value ?? '—'}</div>
        <div className="text-sm text-[#666] mt-0.5">{label}</div>
      </div>
      <div className="hidden md:flex absolute right-4 top-4 w-10 h-10 bg-[var(--brand-light)] rounded-lg items-center justify-center text-[var(--brand)]">
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
      .then(({ count, error }) => setPedidosPendientes(error ? 0 : (count ?? 0)))

    db.from('pedidos').select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa.id).gte('created_at', iso)
      .then(({ count, error }) => setPedidosEsteMes(error ? 0 : (count ?? 0)))

    db.from('visitas').select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa.id).is('producto_id', null).gte('created_at', iso)
      .then(({ count, error }) => setVisitasEsteMes(error ? 0 : (count ?? 0)))

    // Productos más presupuestados
    db.from('pedidos').select('productos')
      .eq('empresa_id', empresa.id)
      .then(({ data }) => {
        if (!data?.length) return
        const counts = {}
        data.forEach(p => (p.productos || []).forEach(item => {
          counts[item.id] = (counts[item.id] || 0) + 1
        }))
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
        setMasVistos(top.map(([id, n]) => {
          const prod = productos.find(p => String(p.id) === String(id))
          return { nombre: prod?.nombre || '—', imagen: prod?.imagen || null, codigo: prod?.codigo || null, visitas: n }
        }))
      })

    db.from('pedidos').select('*').eq('empresa_id', empresa.id)
      .order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => {
        if (!data) return setUltimosPedidos([])
        const sorted = [...data].sort((a, b) => {
          if (a.estado === 'Pendiente' && b.estado !== 'Pendiente') return -1
          if (a.estado !== 'Pendiente' && b.estado === 'Pendiente') return 1
          return 0
        })
        setUltimosPedidos(sorted.slice(0, 5))
      })
  }, [empresa, productos])

  const categorias = new Set(productos.map(p => p.categoria).filter(Boolean)).size
  const catalogoUrl = empresa?.slug ? `${window.location.origin}/catalogo/${empresa.slug}` : null
  const brandColor = empresa?.color || null

  const copiarLink = () => {
    if (!catalogoUrl) return
    navigator.clipboard.writeText(catalogoUrl)
    showToast('Link copiado')
  }

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div
        className="rounded-xl p-8 pt-[100px] md:pt-8 text-white flex items-end justify-between min-h-[400px] md:min-h-[240px] relative overflow-hidden"
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
                className="flex items-center gap-1.5 md:gap-1.5 px-4 py-2.5 md:px-3 md:py-1.5 rounded-lg md:rounded-md text-sm md:text-xs font-semibold bg-white text-[#111] hover:bg-white/90 transition-colors cursor-pointer border-none"
              >
                <ExternalLink size={15} className="md:hidden" /><ExternalLink size={13} className="hidden md:block" /> Ver
              </button>
            )}
            <button
              onClick={copiarLink}
              className="flex items-center gap-1.5 px-4 py-2.5 md:px-3 md:py-1.5 rounded-lg md:rounded-md text-sm md:text-xs font-semibold border border-white/40 text-white hover:bg-white/10 transition-colors cursor-pointer bg-transparent"
            >
              <Link size={15} className="md:hidden" /><Link size={13} className="hidden md:block" /> Copiar link
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 md:mt-0">
        <div className="text-xs font-bold text-[#666] uppercase tracking-wide mb-3">Este mes</div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Visitas al catálogo" shortLabel="Visitas" value={visitasEsteMes} icon={TrendingUp} />
          <StatCard label="Presupuestos" value={pedidosEsteMes} icon={Receipt} onClick={() => setPanel('pedidos')} />
          <StatCard label="Pendientes" value={pedidosPendientes} icon={Clock} onClick={() => setPanel('pedidos')} />
        </div>
      </div>

      {/* Más vistos + Últimos pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-6">
          <h3 className="text-base font-bold mb-4">Productos más presupuestados</h3>
          {!masVistos.length ? (
            <p className="text-sm text-[#888]">Todavía no hay presupuestos generados.</p>
          ) : (
            <div className="space-y-1">
              {masVistos.map(({ nombre, imagen, codigo, visitas }, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-white border border-[#e3e3e3] flex-shrink-0 flex items-center justify-center">
                    {imagen
                      ? <img src={imagen} alt={nombre} className="w-full h-full object-cover" />
                      : <Receipt size={18} className="text-[#ccc]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#111] truncate">{nombre}</div>
                    {codigo && <div className="text-xs text-[#888]">{codigo}</div>}
                  </div>
                  <span className="text-sm font-semibold text-[#888] flex-shrink-0">x{visitas}</span>
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
