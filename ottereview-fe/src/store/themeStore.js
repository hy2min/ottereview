import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme })
        document.documentElement.setAttribute('data-theme', theme)
      },
      toggleTheme: () => {
        const currentTheme = get().theme
        const newTheme = currentTheme === 'light' ? 'dark' : 'light'
        get().setTheme(newTheme)
      },
      initTheme: () => {
        const theme = get().theme
        document.documentElement.setAttribute('data-theme', theme)
      }
    }),
    {
      name: 'ottereview-theme',
      partialize: (state) => ({ theme: state.theme })
    }
  )
)

export { useThemeStore }