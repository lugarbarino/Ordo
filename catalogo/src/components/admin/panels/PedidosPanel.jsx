import { useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'
import { usePedidosStore } from '../../../store/usePedidosStore'
import { useProductosStore } from '../../../store/useProductosStore'
import { useAppStore } from '../../../store/useAppStore'
import { Tabs } from '../ui/Tabs'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { PresupuestoModal } from './PresupuestoModal'

const TABS = [
  { value: 'Pendiente', label: 'Pendientes' },
  { value: 'Respondido', label: 'Respondidos' },
]

function PedidoCard({ pedido, productos, onResponder }) {
  const fecha = new Date(pedido.created_at).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="bg-white border border-[#e3e3e3] rounded-xl p-5 mb-3">
      <div className="flex justify-between items-start gap-3 flex-wrap mb-3">
        <div>
          <div className="font-bold text-base">{pedido.nombre_cliente}</div>
          <div className="text-xs text-[#666] mt-0.5">
            {[pedido.email_cliente, pedido.telefono_cliente, pedido.empresa_cliente].filter(Boolean).join(' · ')}
          </div>
          <div className="text-xs text-[#999] mt-0.5">{fecha}</div>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge variant={pedido.estado === 'Respondido' ? 'respondido' : 'pendiente'}>
            {pedido.estado || 'Pendiente'}
          </Badge>
          <Button
            size="sm"
            variant={pedido.estado === 'Respondido' ? 'secondary' : 'primary'}
            onClick={() => onResponder(pedido)}
          >
            {pedido.estado === 'Respondido' ? 'Reenviar' : 'Responder'}
          </Button>
        </div>
      </div>

      {/* Products list */}
      <div>
        {(pedido.productos || []).map((item, i) => {
          const prod = productos.find(p => String(p.id) === String(item.id)) || {}
          return (
            <div key={i} className="flex items-center gap-2.5 py-2 border-b border-[#f1f1f1] last:border-0">
              <div className="w-10 h-10 rounded-md bg-[#f1f1f1] flex-shrink-0 overflow-hidden flex items-center justify-center">
                {prod.imagen_url
                  ? <img src={prod.imagen_url} alt="" className="w-full h-full object-contain" />
                  : <Receipt size={16} className="text-[#bbb]" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{item.nombre}</div>
                {prod.codigo && <div className="text-xs text-[#999]">{prod.codigo}</div>}
              </div>
              <div className="text-sm text-[#666] whitespace-nowrap">x{item.cantidad}</div>
            </div>
          )
        })}
      </div>

      {pedido.mensaje && (
        <div className="text-sm text-[#666] italic border-t border-[#e3e3e3] pt-2 mt-2">
          "{pedido.mensaje}"
        </div>
      )}
    </div>
  )
}

export function PedidosPanel() {
  const { empresa } = useAppStore()
  const { loading, tabActivo, setTab, cargar, pedidosFiltrados } = usePedidosStore()
  const productos = useProductosStore(s => s.productos)
  const [presupPedido, setPresupPedido] = useState(null)

  useEffect(() => {
    if (empresa) cargar(empresa.id)
  }, [empresa])

  const pedidos = pedidosFiltrados()

  return (
    <div className="max-w-2xl">
      {/* Sticky tabs */}
      <div className="sticky top-0 z-10 bg-[#f8f9fa] -mx-7 px-7 pt-7 pb-4 mb-2">
        <Tabs tabs={TABS} active={tabActivo} onChange={setTab} />
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-sm text-[#888] py-8 text-center">Cargando...</div>
      )}

      {/* Empty */}
      {!loading && !pedidos.length && (
        <EmptyState
          icon={<Receipt size={40} className="text-[#ccc]" />}
          title="No hay pedidos en esta categoría"
        />
      )}

      {/* List */}
      {!loading && pedidos.map(p => (
        <PedidoCard
          key={p.id}
          pedido={p}
          productos={productos}
          onResponder={setPresupPedido}
        />
      ))}

      <PresupuestoModal
        open={!!presupPedido}
        pedido={presupPedido}
        productos={productos}
        onClose={() => setPresupPedido(null)}
      />
    </div>
  )
}
