import { create } from 'zustand'

export const usePRCreateStore = create((set) => ({
  formData: {
    title: '',
    description: '',
    targetBranch: '',
    reviewers: [],
  },
  setFormData: (partial) =>
    set((state) => ({
      formData: { ...state.formData, ...partial },
    })),
}))
