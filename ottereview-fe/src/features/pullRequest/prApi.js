export const fetchPR = async () => {
  return [
    {
      id: 101,
      title: 'Fix login bug',
      repoId: 1,
      repo: 'ottereview-fe',
      author: 'heejoo',
    },
    {
      id: 102,
      title: 'Add conflict handler',
      repoId: 2,
      repo: 'ottereview-be',
      author: 'heejoo',
    },
    {
      id: 103,
      title: 'Improve AI prompt',
      repoId: 3,
      repo: 'ottereview-ai',
      author: 'alice',
    },
    {
      id: 104,
      title: 'Refactor auth logic',
      repoId: 1,
      repo: 'ottereview-fe',
      author: 'bob',
    },
    {
      id: 105,
      title: 'Fix login bug',
      repoId: 2,
      repo: 'ottereview-be',
      author: 'heejoo',
    },
    {
      id: 106,
      title: 'ABCDEFG',
      repoId: 3,
      repo: 'ottereview-ai',
      author: 'SSAFY',
    },
  ]
}

export const submitPR = async (prData) => {
  console.log('[MOCK POST]', prData)

  return { success: true }
}
