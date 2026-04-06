import { create } from 'zustand'
import { db } from '../lib/supabase'

export const useAppStore = create((set, get) => ({
  user: null,
  empresa: null,
  panel: 'dashboard',
  toast: null,

  setUser: (user) => set({ user }),
  setPanel: (panel) => set({ panel }),

  showToast: (message, type = 'ok') => {
    set({ toast: { message, type } })
    setTimeout(() => set({ toast: null }), 3000)
  },

  cargarEmpresa: async () => {
    const { user } = get()
    if (!user) return
    const { data } = await db.from('empresas').select('*').eq('user_id', user.id).single()
    set({ empresa: data || null })
    // Apply brand color
    if (data?.color) {
      document.documentElement.style.setProperty('--brand', data.color)
    }
    return data
  },

  guardarEmpresa: async (campos) => {
    const { user, empresa, showToast } = get()
    let result
    if (empresa) {
      const { data, error } = await db.from('empresas').update(campos).eq('id', empresa.id).select().single()
      if (error) { showToast('Error al guardar: ' + error.message, 'err'); return null }
      result = data
    } else {
      const { data, error } = await db.from('empresas').insert({ ...campos, user_id: user.id }).select().single()
      if (error) { showToast('Error al guardar: ' + error.message, 'err'); return null }
      result = data
    }
    set({ empresa: result })
    if (result?.color) document.documentElement.style.setProperty('--brand', result.color)
    showToast('Guardado')
    return result
  },
}))
