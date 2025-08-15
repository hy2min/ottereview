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
          console.log('🔄 토큰 갱신으로 인한 SSE 재연결 트리거')
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
