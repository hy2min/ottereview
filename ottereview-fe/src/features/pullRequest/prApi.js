export const fetchPR = async () => {
  return [
    {
      id: 101,
      githubPrId: 9001,
      author: { id: 1, name: 'heejoo' },
      title: 'Fix login bug',
      description: '로그인 시 간헐적으로 발생하는 인증 오류를 수정했습니다.',
      aiSummary: '로그인 로직 개선 및 인증 오류 해결.',
      headBranch: 'fix/login-bug',
      baseBranch: 'main',
      status: 'OPEN',
      currentApprovals: 1,
      mergeable: true,
      repo: { id: 1, name: 'ottereview-fe' },
      comments: 2,
    },
    {
      id: 102,
      githubPrId: 9002,
      author: { id: 1, name: 'heejoo' },
      title: 'Add conflict handler',
      description: '충돌 발생 시 자동 메시지를 표시하는 핸들러를 추가했습니다.',
      aiSummary: '충돌 감지 및 사용자 피드백 핸들러 구현.',
      headBranch: 'feature/conflict-handler',
      baseBranch: 'develop',
      status: 'CONFLICT',
      currentApprovals: 0,
      mergeable: false,
      repo: { id: 2, name: 'ottereview-be' },
      comments: 5,
    },
    {
      id: 103,
      githubPrId: 9003,
      author: { id: 2, name: 'alice' },
      title: 'Improve AI prompt',
      description: 'AI 응답의 정확도를 높이기 위해 프롬프트 구조를 개선했습니다.',
      aiSummary: '프롬프트 개선으로 모델 응답 신뢰도 향상.',
      headBranch: 'enhance/ai-prompt',
      baseBranch: 'main',
      status: 'OPEN',
      currentApprovals: 2,
      mergeable: true,
      repo: { id: 3, name: 'ottereview-ai' },
      comments: 1,
    },
    {
      id: 104,
      githubPrId: 9004,
      author: { id: 3, name: 'bob' },
      title: 'Refactor auth logic',
      description: '인증 관련 로직을 모듈화하여 유지보수성을 향상시켰습니다.',
      aiSummary: '인증 코드 리팩토링 및 책임 분리 적용.',
      headBranch: 'refactor/auth',
      baseBranch: 'main',
      status: 'APPROVED',
      currentApprovals: 3,
      mergeable: true,
      repo: { id: 1, name: 'ottereview-fe' },
      comments: 4,
    },
  ]
}

export const submitPR = async (prData) => {
  console.log('[MOCK POST]', prData)

  return { success: true }
}
