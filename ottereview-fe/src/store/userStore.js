import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
