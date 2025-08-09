import { create } from 'zustand'

export const usePRCreateStore = create((set) => ({
  formData: {
    sourceBranch: '',
    targetBranch: '',
    title: '',
    description: '',
    reviewers: [],
  },
  ValidationPR: null,
  ValidationBranches: null,
  aiConvention: null,
  aiOthers: null,

  setFormData: (partial) =>
    set((state) => ({
      formData: { ...state.formData, ...partial },
    })),

  setValidationPR: (data) => set({ ValidationPR: data }),
  setValidationBranches: (data) => set({ ValidationBranches: data }),

  setAIConvention: (data) => set({ aiConvention: data }),
  setAIOthers: (data) => set({ aiOthers: data }),
}))
