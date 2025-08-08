import { create } from 'zustand'

export const usePRCreateStore = create((set) => ({
  formData: {
    sourceBranch: '',
    targetBranch: '',
    title: '',
    description: '',
    reviewers: [],
  },
  validationResult: null,
  aiConvention: null,
  aiOthers: null,

  setFormData: (partial) =>
    set((state) => ({
      formData: { ...state.formData, ...partial },
    })),
  setValidationResult: (result) => set({ validationResult: result }),

  // AI 결과 저장
  setAIConvention: (data) => set({ aiConvention: data }),
  setAIOthers: (data) => set({ aiOthers: data }),
}))
