import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useRepoStore = create(
  persist(
    (set) => ({
      repos: [],
      setRepos: (repos) => set({ repos }),
    }),
    {
      name: 'repo-storage',
    }
  )
)
