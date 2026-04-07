import { useEffect, useRef, useState } from 'react'
import { Search, Plus, Trash2, Download, Pencil } from 'lucide-react'
import { useProductosStore } from '../../../store/useProductosStore'
import { useAppStore } from '../../../store/useAppStore'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { ProductoModal } from './ProductoModal'

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
  const headerRef = useRef()
  const tableWrapRef = useRef()

  const productos = productosFiltrados()
  const todos = seleccionados.size === productos.length && productos.length > 0

  useEffect(() => {
    const calcHeight = () => {
      if (!headerRef.current || !tableWrapRef.current) return
      const bottom = headerRef.current.getBoundingClientRect().bottom
      const isMob = window.innerWidth < 768
      const bottomNav = isMob ? 56 : 0
      tableWrapRef.current.style.height = `${window.innerHeight - bottom - bottomNav}px`
    }
    calcHeight()
    window.addEventListener('resize', calcHeight)
    return () => window.removeEventListener('resize', calcHeight)
  }, [seleccionados.size])

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
    <div className="flex flex-col -mx-4 md:-mx-7 -mt-4 md:-mt-7 h-screen">

      {/* Header bar */}
      <div ref={headerRef} className="flex-shrink-0 bg-white border-b border-[#e3e3e3]">
        <div className="flex items-center gap-2 px-4 md:px-7 py-3 flex-wrap">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#e3e3e3] rounded-lg outline-none focus:border-[var(--brand)]"
            />
          </div>
          <Button variant="primary" size="sm" onClick={abrirNuevo}>
            <Plus size={14} /> <span className="hidden sm:inline">Agregar producto</span><span className="sm:hidden">Agregar</span>
          </Button>
        </div>

        {/* Bulk bar */}
        {seleccionados.size > 0 && (
          <div className="flex items-center gap-3 px-4 md:px-7 py-2 bg-[#f8f9fa] border-t border-[#e3e3e3]">
            <span className="text-xs text-[#666]">{seleccionados.size} seleccionado{seleccionados.size !== 1 ? 's' : ''}</span>
            <button onClick={() => descargarCSV(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#111] hover:bg-[#eee] rounded-md transition-colors cursor-pointer bg-transparent border-none">
              <Download size={13} /> CSV
            </button>
            <button onClick={() => handleEliminar(seleccionados)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer bg-transparent border-none">
              <Trash2 size={13} /> Eliminar
            </button>
            <button onClick={limpiarSeleccion} className="ml-auto text-xs text-[#888] hover:text-[#111] cursor-pointer bg-transparent border-none">
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Table — single scrollable container with sticky thead */}
      <div ref={tableWrapRef} className="overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#888]">Cargando...</div>
        ) : !productos.length ? (
          <div className="px-4 md:px-7">
            <EmptyState
              icon="📦"
              title={busqueda ? 'Sin resultados' : 'No hay productos todavía'}
              description={busqueda ? 'Intentá con otra búsqueda' : 'Agregá tu primer producto para empezar'}
              action={!busqueda && <Button variant="primary" size="sm" onClick={abrirNuevo}><Plus size={13} /> Agregar producto</Button>}
            />
          </div>
        ) : (
          <table style={{ minWidth: 580, tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: 52 }} />
              <col />
              <col style={{ width: 180 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 90 }} />
            </colgroup>
            <thead>
              <tr className="bg-white border-b border-[#e3e3e3] sticky top-0 z-10">
                <th className="py-2.5 pl-4 md:pl-7 pr-1 text-left">
                  <input type="checkbox" checked={todos} onChange={toggleTodos} className="cursor-pointer" />
                </th>
                <th />
                {[['Producto'], ['Categoría'], ['Precio'], ['Stock'], ['Acciones']].map(([label]) => (
                  <th key={label} className="py-2.5 px-2 text-left text-[0.72rem] font-semibold text-[#888] uppercase tracking-wide whitespace-nowrap">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <tr key={p.id} className="border-b border-[#f0f0f0] transition-colors hover:bg-[#f5f7fa]" style={{ background: productos.indexOf(p) % 2 === 0 ? 'white' : '#fafbfc' }}>
                  <td className="py-3 pl-4 md:pl-7 pr-1">
                    <input type="checkbox" checked={seleccionados.has(p.id)} onChange={() => toggleSeleccion(p.id)} className="cursor-pointer" />
                  </td>
                  <td className="py-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#e3e3e3] overflow-hidden flex items-center justify-center">
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
                      className="flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-none"
                    >
                      <Pencil size={12} /> Editar
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
