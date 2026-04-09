import { create } from 'zustand'
import { db } from '../lib/supabase'

function applyTokens(tokens) {
  if (!tokens) return
  const root = document.documentElement
  if (tokens.fontFamily)        root.style.setProperty('--font-family', tokens.fontFamily)
  if (tokens.fontFamilyHeading) root.style.setProperty('--font-family-heading', tokens.fontFamilyHeading)
  if (tokens.fontScale)      root.style.setProperty('--font-scale', tokens.fontScale)
  if (tokens.radiusCard)     root.style.setProperty('--radius-card', tokens.radiusCard)
  if (tokens.radiusBtn)      root.style.setProperty('--radius-btn',  tokens.radiusBtn)
  if (tokens.colorText)      root.style.setProperty('--color-text',  tokens.colorText)
  if (tokens.colorBorder)    root.style.setProperty('--color-border', tokens.colorBorder)
  if (tokens.colorBgSoft)    root.style.setProperty('--color-bg-soft', tokens.colorBgSoft)
}

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
    const { data } = await db.from('empresas').select('*').eq('user_id', user.id).limit(1)
    const empresa = data?.[0] || null
    set({ empresa })
    if (empresa?.color) document.documentElement.style.setProperty('--brand', empresa.color)
    applyTokens(empresa?.tokens)
    return empresa
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
    if (campos.tokens) applyTokens(campos.tokens)
    showToast('Guardado')
    return result
  },
}))
