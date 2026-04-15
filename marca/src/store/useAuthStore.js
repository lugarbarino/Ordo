import { create } from 'zustand'
import { db } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await db.auth.getSession()
    set({ user: session?.user || null, loading: false })
    db.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user || null })
    })
  },

  login: async (email, password) => {
    const { data, error } = await db.auth.signInWithPassword({ email, password })
    if (error) throw error
    set({ user: data.user })
  },

  logout: async () => {
    await db.auth.signOut()
    set({ user: null })
  },
}))
