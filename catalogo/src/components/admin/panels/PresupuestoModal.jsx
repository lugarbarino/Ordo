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
  const { presupCache, guardarPresupCache, responder } = usePedidosStore()
  const [precios, setPrecios] = useState([])
  const [nota, setNota] = useState('')
  const [generando, setGenerando] = useState(false)

  useEffect(() => {
    if (!open || !pedido) return
    // Primero intentar cargar desde Supabase (respuesta guardada), luego desde cache local
    let saved = {}
    if (pedido.respuesta) {
      try { saved = JSON.parse(pedido.respuesta) } catch {}
    }
    if (!saved.precios) saved = presupCache[pedido.id] || {}
    const items = pedido.productos || []
    setPrecios(items.map((_, i) => saved.precios?.[i] ?? ''))
    setNota(saved.nota || '')
  }, [open, pedido])

  const total = precios.reduce((sum, v, i) => {
    const n = parseFloat(v)
    const cantidad = pedido?.productos?.[i]?.cantidad || 1
    return isNaN(n) ? sum : sum + n * cantidad
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

      // Logo (left) — canvas para soportar PNG/JPEG/SVG/WebP
      if (empresa?.logo_url) {
        try {
          const b64 = await imgToB64(empresa.logo_url)
          const img = new Image()
          await new Promise(r => { img.onload = img.onerror = r; img.src = b64 })
          const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 3
          const logoW = Math.min(100, img.naturalWidth || 100)
          const logoH = logoW / ratio
          const canvas = document.createElement('canvas')
          canvas.width = logoW * 3
          canvas.height = logoH * 3
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
          doc.addImage(canvas.toDataURL('image/png'), 'PNG', 40, 44, logoW, logoH, '', 'FAST')
        } catch (e) {}
      }

      const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      doc.setFontSize(10).setTextColor(100).setFont(undefined, 'italic')
      doc.text(empresa?.nombre || '', W - 40, 38, { align: 'right' })
      doc.text(`fecha: ${fecha}`, W - 40, 52, { align: 'right' })

      let y = 100
      const clientLines = [pedido.empresa_cliente, pedido.email_cliente, pedido.telefono_cliente].filter(Boolean)
      const hasMensaje = !!pedido.mensaje
      const BOX_GAP = 10
      const BOX_W = hasMensaje ? (W - 80 - BOX_GAP) / 2 : W - 80
      const CLIENT_BOX_H = Math.max(18 + 20 + clientLines.length * 16 + 18, 95)

      // Caja CLIENTE
      doc.setFillColor(247, 248, 250).roundedRect(40, y, BOX_W, CLIENT_BOX_H, 6, 6, 'F')
      doc.setFontSize(9).setTextColor(80).setFont(undefined, 'bold')
      doc.text('CLIENTE', 56, y + 18)
      doc.setFontSize(13).setTextColor(20).setFont(undefined, 'bold')
      doc.text(pedido.nombre_cliente || '', 56, y + 34)
      doc.setFontSize(11).setFont(undefined, 'normal').setTextColor(90)
      let cy = y + 52
      clientLines.forEach(line => { doc.text(line, 56, cy); cy += 16 })

      // Caja NOTA (mensaje del cliente)
      if (hasMensaje) {
        const nX = 40 + BOX_W + BOX_GAP
        doc.setDrawColor(210).setLineWidth(0.5).roundedRect(nX, y, BOX_W, CLIENT_BOX_H, 6, 6, 'S')
        doc.setFontSize(9).setTextColor(80).setFont(undefined, 'bold')
        doc.text('NOTA', nX + 16, y + 18)
        doc.setFontSize(11).setFont(undefined, 'normal').setTextColor(80)
        const msgLines = doc.splitTextToSize(pedido.mensaje, BOX_W - 32)
        let my = y + 34
        msgLines.forEach(line => { doc.text(line, nX + 16, my); my += 16 })
      }

      y += CLIENT_BOX_H + 28

      // Title
      doc.setFontSize(16).setTextColor(40).setFont(undefined, 'bold')
      doc.text('PRESUPUESTO', 40, y)
      y += 22

      // Table header
      const colX = { prod: 40, cant: W - 250, unit: W - 175, sub: W - 52 }
      doc.setFillColor(br, bg, bb).rect(40, y, W - 80, 32, 'F')
      doc.setFontSize(9.5).setTextColor(255).setFont(undefined, 'bold')
      doc.text('PRODUCTO', colX.prod + 8, y + 20)
      doc.text('CANT.', colX.cant, y + 20, { align: 'right' })
      doc.text('P. UNIT.', colX.unit, y + 20, { align: 'right' })
      doc.text('SUBTOTAL', colX.sub, y + 20, { align: 'right' })
      y += 32

      // Precargar imágenes de productos
      const items = pedido.productos || []
      const prodImgs = {}
      await Promise.all(items.map(async (item) => {
        const prod = productos.find(p => String(p.id) === String(item.id))
        if (prod?.imagen_url) {
          try {
            const b64 = await imgToB64(prod.imagen_url)
            const img = new Image()
            await new Promise(r => { img.onload = img.onerror = r; img.src = b64 })
            const canvas = document.createElement('canvas')
            const size = 120
            canvas.width = size; canvas.height = size
            const ctx = canvas.getContext('2d')
            const iw = img.naturalWidth, ih = img.naturalHeight
            const scale = Math.max(size / iw, size / ih)
            const sw = size / scale, sh = size / scale
            const sx = (iw - sw) / 2, sy = (ih - sh) / 2
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size)
            prodImgs[item.id] = canvas.toDataURL('image/png')
          } catch (e) {}
        }
      }))

      // Rows
      const ROW_H = 52
      const IMG_SIZE = 38
      items.forEach((item, i) => {
        const precioUnit = parseFloat(precios[i])
        const cantidad = item.cantidad || 1
        const subtotal = !isNaN(precioUnit) ? precioUnit * cantidad : null
        const bgRow = i % 2 === 0 ? [255, 255, 255] : [249, 250, 252]
        doc.setFillColor(...bgRow).rect(40, y, W - 80, ROW_H, 'F')
        const imgX = colX.prod + 8
        const textX = prodImgs[item.id] ? imgX + IMG_SIZE + 8 : imgX
        if (prodImgs[item.id]) {
          doc.addImage(prodImgs[item.id], 'PNG', imgX, y + (ROW_H - IMG_SIZE) / 2, IMG_SIZE, IMG_SIZE, '', 'FAST')
        }
        doc.setFontSize(10).setTextColor(20).setFont(undefined, 'normal')
        doc.text(item.nombre, textX, y + ROW_H / 2 + 4)
        doc.text(String(cantidad), colX.cant, y + ROW_H / 2 + 4, { align: 'right' })
        if (!isNaN(precioUnit)) {
          doc.text(precioUnit.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }), colX.unit, y + ROW_H / 2 + 4, { align: 'right' })
          doc.setFont(undefined, 'bold')
          doc.text(subtotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }), colX.sub, y + ROW_H / 2 + 4, { align: 'right' })
          doc.setFont(undefined, 'normal')
        }
        y += ROW_H
      })

      // Total row
      y += 16
      doc.setDrawColor(220).line(40, y, W - 40, y)
      y += 26
      doc.setFontSize(13).setTextColor(20).setFont(undefined, 'bold')
      doc.text('Total estimado', 40, y)
      if (hayTotal) {
        doc.setFontSize(22).setFont(undefined, 'bold').setTextColor(20)
        doc.text(total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }), colX.precio, y, { align: 'right' })
      }

      // Consideraciones (nota de empresa)
      const notaText = nota.trim()
      if (notaText) {
        y += 38
        doc.setFontSize(9).setTextColor(40).setFont(undefined, 'bold')
        doc.text('CONSIDERACIONES', 40, y)
        y += 15
        doc.setFontSize(11).setFont(undefined, 'normal').setTextColor(70)
        const noteLines = doc.splitTextToSize(notaText, W - 80)
        noteLines.forEach(line => { doc.text(line, 40, y); y += 15 })
      }

      // Footer
      doc.setFillColor(246, 247, 249).rect(0, H - 56, W, 56, 'F')
      doc.setFontSize(9).setTextColor(150).setFont(undefined, 'italic')
      doc.text('Validez del presupuesto: 15 días hábiles a partir de la fecha de emisión.', 40, H - 33)
      doc.setFont(undefined, 'normal')
      doc.text(empresa?.nombre || '', 40, H - 19)

      const nombre = pedido.nombre_cliente?.replace(/\s+/g, '_') || 'cliente'
      doc.save(`presupuesto_${nombre}.pdf`)
    } catch (e) {
      console.error('Error generando PDF:', e)
      setGenerando(false)
      return
    }

    // Marcar pedido como respondido — fuera del try del PDF para que siempre se ejecute
    try {
      await responder(pedido.id, JSON.stringify({ precios, nota }), empresa?.id)
    } catch (e) {
      console.error('Error al marcar como respondido:', e)
    }
    setGenerando(false)
    onClose()
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
                  <div className="text-xs text-[#999]">{prod.codigo && <span className="font-mono mr-1.5">{prod.codigo}</span>}x{item.cantidad}</div>
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
