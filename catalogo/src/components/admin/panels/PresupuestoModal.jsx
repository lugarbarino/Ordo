import { useState, useEffect } from 'react'
import { Download, Receipt } from 'lucide-react'
// jsPDF loaded dynamically in generarPDF
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useAppStore } from '../../../store/useAppStore'
import { usePedidosStore } from '../../../store/usePedidosStore'

function imgToB64(url) {
  return fetch(url).then(r => r.blob()).then(blob => new Promise(res => {
    const reader = new FileReader()
    reader.onload = e => res(e.target.result)
    reader.readAsDataURL(blob)
  }))
}

export function PresupuestoModal({ open, onClose, pedido, productos }) {
  const { empresa } = useAppStore()
  const { presupCache, guardarPresupCache } = usePedidosStore()
  const [precios, setPrecios] = useState([])
  const [nota, setNota] = useState('')
  const [generando, setGenerando] = useState(false)

  useEffect(() => {
    if (!open || !pedido) return
    const saved = presupCache[pedido.id] || {}
    const items = pedido.productos || []
    setPrecios(items.map((_, i) => saved.precios?.[i] ?? ''))
    setNota(saved.nota || '')
  }, [open, pedido])

  const total = precios.reduce((sum, v) => {
    const n = parseFloat(v)
    return isNaN(n) ? sum : sum + n
  }, 0)
  const hayTotal = precios.some(v => !isNaN(parseFloat(v)))

  const handleClose = () => {
    if (pedido) guardarPresupCache(pedido.id, precios, nota)
    onClose()
  }

  const generarPDF = async () => {
    if (!pedido) return
    setGenerando(true)
    try {
      const { jsPDF: PDF } = await import('jspdf')
      const doc = new PDF({ unit: 'pt', format: 'a4' })
      const W = doc.internal.pageSize.getWidth()
      const H = doc.internal.pageSize.getHeight()

      const brandHex = empresa?.color || '#3872fa'
      const br = parseInt(brandHex.slice(1, 3), 16)
      const bg = parseInt(brandHex.slice(3, 5), 16)
      const bb = parseInt(brandHex.slice(5, 7), 16)

      // Logo
      let logoW = 0
      if (empresa?.logo_url) {
        try {
          const b64 = await imgToB64(empresa.logo_url)
          const ext = empresa.logo_url.split('.').pop().split('?')[0].toUpperCase().replace('JPG', 'JPEG')
          const logoExt = ['PNG', 'JPEG'].includes(ext) ? ext : 'PNG'
          const img = new Image()
          await new Promise(r => { img.onload = img.onerror = r; img.src = b64 })
          const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 3
          const logoH = 40
          logoW = Math.min(logoH * ratio, 160)
          doc.addImage(b64, logoExt, 40, 36, logoW, logoH, '', 'FAST')
        } catch (e) {}
      }

      const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      doc.setFontSize(10).setTextColor(80).setFont(undefined, 'italic')
      doc.text(empresa?.nombre || '', W - 40, 48, { align: 'right' })
      doc.setFontSize(9).setTextColor(120)
      doc.text(`fecha: ${fecha}`, W - 40, 64, { align: 'right' })

      let y = 110
      const BOX_W = (W - 100) / 2
      const notaText = nota.trim()
      const noteLines = notaText ? doc.setFontSize(10).splitTextToSize(notaText, BOX_W - 24) : []
      const clientLines = [pedido.empresa_cliente, pedido.email_cliente, pedido.telefono_cliente].filter(Boolean)
      const BOX_H = Math.max(20 + 16 + clientLines.length * 14 + 16, 20 + (noteLines.length || 0) * 14 + 32, 80)

      // Client box
      doc.setFillColor(247, 248, 250).roundedRect(40, y, BOX_W, BOX_H, 6, 6, 'F')
      doc.setFontSize(8).setTextColor(40).setFont(undefined, 'bold')
      doc.text('CLIENTE', 56, y + 18)
      doc.setFontSize(11).setTextColor(20).setFont(undefined, 'bold')
      doc.text(pedido.nombre_cliente, 56, y + 34)
      doc.setFontSize(9.5).setFont(undefined, 'normal').setTextColor(90)
      let cy = y + 50
      clientLines.forEach(line => { doc.text(line, 56, cy); cy += 14 })

      // Note box
      if (notaText) {
        const nx = 40 + BOX_W + 20
        doc.setFillColor(247, 248, 250).roundedRect(nx, y, BOX_W, BOX_H, 6, 6, 'F')
        doc.setFontSize(8).setTextColor(40).setFont(undefined, 'bold')
        doc.text('NOTA', nx + 16, y + 18)
        doc.setFontSize(9.5).setFont(undefined, 'normal').setTextColor(70)
        let ny = y + 34
        noteLines.forEach(line => { doc.text(line, nx + 16, ny); ny += 14 })
      }

      y += BOX_H + 28

      // Title
      doc.setFontSize(13).setTextColor(20).setFont(undefined, 'bold')
      doc.text('PRESUPUESTO', 40, y)
      doc.text(`Validez: 15 días`, W - 40, y, { align: 'right' })
      y += 16

      // Table header
      const colX = { prod: 40, cant: W - 170, precio: W - 52 }
      doc.setFillColor(br, bg, bb).rect(40, y, W - 80, 30, 'F')
      doc.setFontSize(8.5).setTextColor(255).setFont(undefined, 'bold')
      doc.text('PRODUCTO', colX.prod + 8, y + 19)
      doc.text('CANT.', colX.cant, y + 19, { align: 'right' })
      doc.text('PRECIO', colX.precio, y + 19, { align: 'right' })
      y += 30

      // Rows
      const items = pedido.productos || []
      items.forEach((item, i) => {
        const precio = parseFloat(precios[i])
        const bgRow = i % 2 === 0 ? [255, 255, 255] : [249, 250, 252]
        doc.setFillColor(...bgRow).rect(40, y, W - 80, 28, 'F')
        doc.setFontSize(9).setTextColor(20).setFont(undefined, 'normal')
        doc.text(item.nombre, colX.prod + 8, y + 18)
        doc.text(String(item.cantidad), colX.cant, y + 18, { align: 'right' })
        if (!isNaN(precio)) {
          doc.text(precio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }), colX.precio, y + 18, { align: 'right' })
        }
        y += 28
      })

      // Total
      y += 12
      doc.setFontSize(10).setTextColor(100).setFont(undefined, 'normal')
      doc.text('TOTAL', colX.cant, y + 2, { align: 'right' })
      if (hayTotal) {
        doc.setFontSize(22).setFont(undefined, 'bold').setTextColor(20)
        doc.text(total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }), colX.precio, y + 2, { align: 'right' })
      }

      // Footer
      doc.setFillColor(246, 247, 249).rect(0, H - 52, W, 52, 'F')
      doc.setFontSize(8).setTextColor(160).setFont(undefined, 'normal')
      doc.text(`Generado con Ordo · ${empresa?.nombre || ''}`, W / 2, H - 24, { align: 'center' })

      const nombre = pedido.nombre_cliente?.replace(/\s+/g, '_') || 'cliente'
      doc.save(`presupuesto_${nombre}.pdf`)
    } catch (e) {
      console.error(e)
    }
    setGenerando(false)
  }

  if (!pedido) return null

  const items = pedido.productos || []

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Armar presupuesto"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" loading={generando} onClick={generarPDF}>
            <Download size={14} /> Descargar PDF
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="text-sm text-[#666]">
          <strong className="text-[#111]">{pedido.nombre_cliente}</strong>
          {[pedido.email_cliente, pedido.telefono_cliente, pedido.empresa_cliente].filter(Boolean).length > 0 && (
            <span> — {[pedido.email_cliente, pedido.telefono_cliente, pedido.empresa_cliente].filter(Boolean).join(' · ')}</span>
          )}
        </div>

        {/* Items */}
        <div className="border border-[#e3e3e3] rounded-xl overflow-hidden">
          {items.map((item, i) => {
            const prod = productos.find(p => String(p.id) === String(item.id)) || {}
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#f1f1f1] last:border-0">
                <div className="w-9 h-9 rounded-md bg-[#f1f1f1] flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {prod.imagen_url
                    ? <img src={prod.imagen_url} alt="" className="w-full h-full object-contain" />
                    : <Receipt size={14} className="text-[#bbb]" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{item.nombre}</div>
                  <div className="text-xs text-[#999]">x{item.cantidad}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#999]">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={precios[i] ?? ''}
                    onChange={e => setPrecios(prev => {
                      const next = [...prev]
                      next[i] = e.target.value
                      return next
                    })}
                    className="w-24 px-2 py-1.5 text-sm text-right border border-[#e3e3e3] rounded-lg outline-none focus:border-[var(--brand)]"
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-1">
          <span className="text-sm font-semibold text-[#666]">Total</span>
          <span className="text-lg font-bold text-[#111]">
            {hayTotal ? total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '—'}
          </span>
        </div>

        {/* Nota */}
        <textarea
          value={nota}
          onChange={e => setNota(e.target.value)}
          placeholder="Nota adicional (opcional)..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-[#e3e3e3] rounded-xl outline-none resize-none focus:border-[var(--brand)] placeholder:text-[#bbb]"
        />
      </div>
    </Modal>
  )
}
