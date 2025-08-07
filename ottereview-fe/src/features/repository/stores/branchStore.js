import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useBranchStore = create(
  persist(
    (set) => ({
      branchesByRepo: {},
      setBranchesForRepo: (repoId, branches) =>
        set((state) => ({
          branchesByRepo: {
            ...state.branchesByRepo,
            [repoId]: branches,
          },
        })),
    }),
    {
      name: 'branch-storage',
    }
  )
)
