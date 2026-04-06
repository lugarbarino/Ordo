import { useState, useEffect, useRef } from 'react'
import { Camera } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { useProductosStore } from '../../../store/useProductosStore'
import { useAppStore } from '../../../store/useAppStore'
import { db, SUPABASE_URL } from '../../../lib/supabase'

const STOCK_OPTS = ['Disponible', 'Consultar', 'Sin stock']

export function ProductoModal({ open, onClose, producto }) {
  const { empresa, showToast } = useAppStore()
  const { guardar, cargar } = useProductosStore()
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    if (open) {
      setForm(producto ? {
        nombre: producto.nombre || '',
        codigo: producto.codigo || '',
        categoria: producto.categoria || '',
        precio: producto.precio || '',
        descripcion: producto.descripcion || '',
        stock: producto.stock || 'Disponible',
        imagen_url: producto.imagen_url || '',
      } : { stock: 'Disponible', nombre: '', codigo: '', categoria: '', precio: '', descripcion: '', imagen_url: '' })
    }
  }, [open, producto])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const subirFoto = async (file) => {
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${empresa.id}/${Date.now()}.${ext}`
    const { error } = await db.storage.from('productos').upload(path, file, { upsert: true })
    if (error) { showToast('Error al subir imagen', 'err'); setUploading(false); return }
    const url = `${SUPABASE_URL}/storage/v1/object/public/productos/${path}`
    set('imagen_url', url)
    setUploading(false)
  }

  const handleSubmit = async () => {
    if (!form.nombre?.trim()) { showToast('El nombre es requerido', 'err'); return }
    setLoading(true)
    const err = await guardar(form, producto?.id, empresa.id)
    setLoading(false)
    if (err) { showToast('Error: ' + err.message, 'err'); return }
    showToast(producto ? 'Producto actualizado' : 'Producto agregado')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={producto ? 'Editar producto' : 'Agregar producto'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>
            {producto ? 'Guardar cambios' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre *" value={form.nombre || ''} onChange={e => set('nombre', e.target.value)} placeholder="Nombre del producto" />
          <Input label="Código" value={form.codigo || ''} onChange={e => set('codigo', e.target.value)} placeholder="OC-101" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Categoría" value={form.categoria || ''} onChange={e => set('categoria', e.target.value)} placeholder="Laparoscópicos" />
          <Input label="Precio" value={form.precio || ''} onChange={e => set('precio', e.target.value)} placeholder="Consultar o 15000" />
        </div>
        <Textarea label="Descripción" value={form.descripcion || ''} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción del producto..." rows={3} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#666] uppercase tracking-wide">Stock</label>
          <select
            value={form.stock || 'Disponible'}
            onChange={e => set('stock', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#e3e3e3] rounded-lg bg-white outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
          >
            {STOCK_OPTS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#666] uppercase tracking-wide">Foto del producto</label>
          <div className="flex items-center gap-3">
            <div
              className="w-20 h-20 rounded-xl bg-[#f1f1f1] border border-[#e3e3e3] flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {form.imagen_url
                ? <img src={form.imagen_url} alt="" className="w-full h-full object-cover" />
                : <Camera size={24} className="text-[#aaa]" />
              }
            </div>
            <div>
              <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={e => subirFoto(e.target.files[0])} />
              <Button size="sm" variant="secondary" loading={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? 'Subiendo...' : 'Elegir foto'}
              </Button>
              <p className="text-xs text-[#888] mt-1.5">JPG, PNG, WEBP — máx 5MB</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
