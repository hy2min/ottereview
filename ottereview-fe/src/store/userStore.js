import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { useAuthStore } from '../features/auth/authStore'
import { api } from '../lib/api'

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (userData) => set({ user: userData }),
      clearUser: () => set({ user: null }),
      logout: async () => {
        try {
          await api.post('/api/auth/logout', null, { withCredentials: true })
        } catch (e) {
          console.error('로그아웃 요청 실패:', e)
        }
        console.log('로그아웃 전 user:', useUserStore.getState().user)
        useAuthStore.getState().clearTokens()
        set({ user: null })
        console.log('로그아웃 후 user:', useUserStore.getState().user)
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
