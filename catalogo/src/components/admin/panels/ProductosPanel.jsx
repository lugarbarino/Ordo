import { useEffect, useState, useRef } from 'react'
import { Search, Plus, Trash2, Download } from 'lucide-react'
import { useProductosStore } from '../../../store/useProductosStore'
import { useAppStore } from '../../../store/useAppStore'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { ProductoModal } from './ProductoModal'

const COLS = [
  { key: 'check', w: 36 },
  { key: 'foto', w: 52 },
  { key: 'nombre', label: 'Producto' },
  { key: 'categoria', label: 'Categoría', w: 190 },
  { key: 'precio', label: 'Precio', w: 110 },
  { key: 'stock', label: 'Stock', w: 110 },
  { key: 'acciones', label: 'Acciones', w: 90 },
]

function Colgroup() {
  return (
    <colgroup>
      {COLS.map(c => <col key={c.key} style={c.w ? { width: c.w } : undefined} />)}
    </colgroup>
  )
}

function StockBadge({ stock }) {
  const styles = {
    'Disponible': 'bg-emerald-50 text-emerald-700',
    'Consultar': 'bg-orange-50 text-orange-700',
    'Sin stock': 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${styles[stock] || styles['Consultar']}`}>
      {stock}
    </span>
  )
}

export function ProductosPanel() {
  const { empresa, showToast } = useAppStore()
  const {
    loading, busqueda, setBusqueda,
    seleccionados, toggleSeleccion, toggleTodos, limpiarSeleccion,
    eliminar, productosFiltrados,
  } = useProductosStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const wrapRef = useRef()
  const headRef = useRef()

  const productos = productosFiltrados()
  const todos = seleccionados.size === productos.length && productos.length > 0

  useEffect(() => {
    const calcHeight = () => {
      if (!headRef.current) return
      const bottom = headRef.current.getBoundingClientRect().bottom
      if (wrapRef.current) wrapRef.current.style.height = `${window.innerHeight - bottom}px`
    }
    calcHeight()
    window.addEventListener('resize', calcHeight)
    return () => window.removeEventListener('resize', calcHeight)
  }, [])

  const handleEliminar = async (ids) => {
    if (!confirm(`¿Eliminás ${ids.size} producto${ids.size !== 1 ? 's' : ''}?`)) return
    const err = await eliminar(ids, empresa.id)
    if (err) { showToast('Error: ' + err.message, 'err'); return }
    showToast(`Eliminado${ids.size !== 1 ? 's' : ''} ${ids.size} producto${ids.size !== 1 ? 's' : ''}`)
    limpiarSeleccion()
  }

  const descargarCSV = (soloSel = false) => {
    const campos = ['codigo', 'nombre', 'categoria', 'descripcion', 'precio', 'stock', 'imagen_url']
    const esc = v => { const s = v == null ? '' : String(v); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s }
    const lista = soloSel
      ? productosFiltrados().filter(p => seleccionados.has(p.id))
      : productosFiltrados()
    const filas = [campos.join(','), ...lista.map(p => campos.map(c => esc(p[c])).join(','))]
    const blob = new Blob([filas.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `productos_${(empresa?.nombre || 'catalogo').replace(/\s+/g, '_')}.csv`
    a.click()
  }

  const abrirEditar = (p) => { setEditando(p); setModalOpen(true) }
  const abrirNuevo = () => { setEditando(null); setModalOpen(true) }

  return (
    <div className="flex flex-col -m-7 h-screen">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 px-7 py-4 border-b border-[#e3e3e3] bg-white flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar..."
            className="pl-9 pr-3 py-2 text-sm border border-[#e3e3e3] rounded-lg outline-none focus:border-[var(--brand)] w-56"
          />
        </div>
        <Button variant="primary" size="sm" onClick={abrirNuevo}>
          <Plus size={14} /> Agregar producto
        </Button>
      </div>

      {/* Bulk bar */}
      {seleccionados.size > 0 && (
        <div className="flex items-center gap-3 px-7 py-2 bg-[#f8f9fa] border-b border-[#e3e3e3] flex-shrink-0">
          <span className="text-xs text-[#666]">{seleccionados.size} seleccionado{seleccionados.size !== 1 ? 's' : ''}</span>
          <button onClick={() => descargarCSV(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#111] hover:bg-[#eee] rounded-md transition-colors cursor-pointer bg-transparent border-none">
            <Download size={13} /> Descargar CSV
          </button>
          <button onClick={() => handleEliminar(seleccionados)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer bg-transparent border-none">
            <Trash2 size={13} /> Eliminar
          </button>
          <button onClick={limpiarSeleccion} className="ml-auto text-xs text-[#888] hover:text-[#111] cursor-pointer bg-transparent border-none">
            Cancelar
          </button>
        </div>
      )}

      {/* Table head (sticky) */}
      <div ref={headRef} className="flex-shrink-0 border-b border-[#e3e3e3] bg-white px-7">
        <table className="w-full" style={{ tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
          <Colgroup />
          <thead>
            <tr>
              <th className="py-2.5 px-1">
                <input type="checkbox" checked={todos} onChange={toggleTodos} className="cursor-pointer" />
              </th>
              <th />
              {COLS.slice(2, 6).map(c => (
                <th key={c.key} className="py-2.5 px-2 text-left text-[0.72rem] font-semibold text-[#888] uppercase tracking-wide whitespace-nowrap">
                  {c.label}
                </th>
              ))}
              <th className="py-2.5 px-2 text-left text-[0.72rem] font-semibold text-[#888] uppercase tracking-wide">
                Acciones
              </th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Scrollable body */}
      <div ref={wrapRef} className="overflow-y-auto px-7">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#888]">Cargando...</div>
        ) : !productos.length ? (
          <EmptyState
            icon="📦"
            title={busqueda ? 'Sin resultados' : 'No hay productos todavía'}
            description={busqueda ? 'Intentá con otra búsqueda' : 'Agregá tu primer producto para empezar'}
            action={!busqueda && <Button variant="primary" size="sm" onClick={abrirNuevo}><Plus size={13} /> Agregar producto</Button>}
          />
        ) : (
          <table className="w-full" style={{ tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
            <Colgroup />
            <tbody>
              {productos.map(p => (
                <tr key={p.id} className="border-b border-[#f0f0f0] hover:bg-[#fafafa] transition-colors">
                  <td className="py-3 px-1">
                    <input type="checkbox" checked={seleccionados.has(p.id)} onChange={() => toggleSeleccion(p.id)} className="cursor-pointer" />
                  </td>
                  <td className="py-3">
                    <div className="w-10 h-10 rounded-lg bg-[#f1f1f1] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {p.imagen_url && <img src={p.imagen_url} alt="" className="w-full h-full object-contain" />}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-sm font-medium text-[#111] truncate">{p.nombre}</div>
                    {p.codigo && <div className="text-xs text-[#999] truncate">{p.codigo}</div>}
                  </td>
                  <td className="py-3 px-2 text-sm text-[#666] truncate">{p.categoria || '—'}</td>
                  <td className="py-3 px-2 text-sm text-[#111]">{p.precio || '—'}</td>
                  <td className="py-3 px-2"><StockBadge stock={p.stock} /></td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => abrirEditar(p)}
                      className="text-xs font-medium text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-none"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ProductoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        producto={editando}
      />
    </div>
  )
}
