import { create } from 'zustand'

export const useCommentStore = create((set) => ({
  prComments: {}, // key: prId, value: comment[]
  codeComments: {}, // key: `${filePath}:${lineNumber}`, value: comment[]

  setPRComments: (prId, comments) =>
    set((state) => ({
      prComments: { ...state.prComments, [prId]: comments },
    })),

  addPRComment: (prId, comment) =>
    set((state) => ({
      prComments: {
        ...state.prComments,
        [prId]: [...(state.prComments[prId] || []), comment],
      },
    })),

  setCodeComments: (fileKey, comments) =>
    set((state) => ({
      codeComments: { ...state.codeComments, [fileKey]: comments },
    })),

  addCodeComment: (fileKey, comment) =>
    set((state) => ({
      codeComments: {
        ...state.codeComments,
        [fileKey]: [...(state.codeComments[fileKey] || []), comment],
      },
    })),
}))
