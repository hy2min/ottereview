import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usePRStore = create(
  persist(
    (set) => ({
      // 나와 관련된 PR
      authoredPRs: [],
      reviewerPRs: [],
      setAuthoredPRs: (prs) => set({ authoredPRs: prs }),
      setReviewerPRs: (prs) => set({ reviewerPRs: prs }),

      // 레포에 종속된 PR
      repoPRs: [],
      setRepoPRs: (prs) => set({ repoPRs: prs }),

      // PR 상세 정보 (prId 기준으로 저장)
      prDetails: {},
      setPRDetail: (prId, detail) =>
        set((state) => ({
          prDetails: {
            ...state.prDetails,
            [prId]: detail, // 새로운 prId 추가 or 기존 갱신
          },
        })),
    }),
    {
      name: 'pr-storage',
    }
  )
)
