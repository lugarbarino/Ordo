import { create } from 'zustand'
import { db } from '../lib/supabase'

export const useProductosStore = create((set, get) => ({
  productos: [],
  loading: false,
  busqueda: '',
  seleccionados: new Set(),

  setBusqueda: (busqueda) => set({ busqueda }),

  toggleSeleccion: (id) => {
    const sel = new Set(get().seleccionados)
    sel.has(id) ? sel.delete(id) : sel.add(id)
    set({ seleccionados: sel })
  },

  toggleTodos: () => {
    const { productos, seleccionados } = get()
    if (seleccionados.size === productos.length) {
      set({ seleccionados: new Set() })
    } else {
      set({ seleccionados: new Set(productos.map(p => p.id)) })
    }
  },

  limpiarSeleccion: () => set({ seleccionados: new Set() }),

  cargar: async (empresaId) => {
    if (!empresaId) { set({ productos: [] }); return }
    set({ loading: true })
    const { data } = await db.from('productos').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: true })
    set({ productos: data || [], loading: false })
  },

  guardar: async (datos, id, empresaId) => {
    if (id) {
      const { error } = await db.from('productos').update(datos).eq('id', id)
      if (error) return error
      await get().cargar(empresaId)
    } else {
      const { data, error } = await db.from('productos').insert({ ...datos, empresa_id: empresaId }).select().single()
      if (error) return error
      await get().cargar(empresaId)
      return null
    }
    return null
  },

  eliminar: async (ids, empresaId) => {
    const { error } = await db.from('productos').delete().in('id', [...ids])
    if (error) return error
    await get().cargar(empresaId)
    return null
  },

  productosFiltrados: () => {
    const { productos, busqueda } = get()
    if (!busqueda.trim()) return productos
    const q = busqueda.toLowerCase()
    return productos.filter(p =>
      p.nombre?.toLowerCase().includes(q) ||
      p.categoria?.toLowerCase().includes(q) ||
      p.codigo?.toLowerCase().includes(q)
    )
  },
}))
