import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '../lib/supabase'

export const usePedidosStore = create(persist((set, get) => ({
  pedidos: [],
  loading: false,
  tabActivo: 'Pendiente',
  presupCache: {},

  setTab: (tab) => set({ tabActivo: tab }),

  cargar: async (empresaId) => {
    if (!empresaId) return
    set({ loading: true })
    const { data } = await db.from('pedidos').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false })
    set({ pedidos: data || [], loading: false })
  },

  pedidosFiltrados: () => {
    const { pedidos, tabActivo } = get()
    return pedidos.filter(p =>
      tabActivo === 'Pendiente' ? p.estado !== 'Respondido' : p.estado === 'Respondido'
    )
  },

  responder: async (pedidoId, respuesta, empresaId) => {
    const { error } = await db.from('pedidos').update({ estado: 'Respondido', respuesta }).eq('id', pedidoId)
    if (error) return error
    await get().cargar(empresaId)
    return null
  },

  guardarPresupCache: (pedidoId, precios, nota) => {
    set(state => ({
      presupCache: { ...state.presupCache, [pedidoId]: { precios, nota } }
    }))
  },
}), {
  name: 'ordo-presup-cache',
  partialize: (state) => ({ presupCache: state.presupCache }),
}))
