import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usePRStore = create(
  persist(
    (set) => ({
      pullRequests: [],
      setPullRequests: (prs) => set({ pullRequests: prs }),
    }),
    {
      name: 'pr-storage',
    }
  )
)
