import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      sseReconnectCallback: null,
      setAccessToken: (token) => set({ accessToken: token }),
      clearTokens: () => set({ accessToken: null }),
      setSseReconnectCallback: (callback) => set({ sseReconnectCallback: callback }),
      triggerSseReconnect: () => {
        const callback = get().sseReconnectCallback
        if (callback) {
          callback()
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
)
1
