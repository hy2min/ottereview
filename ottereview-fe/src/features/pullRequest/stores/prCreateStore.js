import { create } from 'zustand'

export const usePRCreateStore = create((set) => ({
  formData: {
    sourceBranch: '',
    targetBranch: '',
    title: '',
    description: '',
    reviewers: [],
  },
  validationResult: {},
  setFormData: (partial) =>
    set((state) => ({
      formData: { ...state.formData, ...partial },
    })),
  setValidationResult: (result) => set({ validationResult: result }),
}))
