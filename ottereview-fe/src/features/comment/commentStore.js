import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { fetchComments, postComment } from './commentApi'

export const useCommentStore = create(
  persist(
    (set, get) => ({
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

      loadPRComments: async (prId) => {
        const comments = await fetchComments(prId)
        get().setPRComments(prId, comments)
      },

      submitPRComment: async (prId, comment) => {
        const newComment = await postComment(prId, comment)
        get().addPRComment(prId, newComment)
      },
    }),
    {
      name: 'comment-store',
      partialize: (state) => ({
        prComments: state.prComments,
        codeComments: state.codeComments,
      }),
    }
  )
)
