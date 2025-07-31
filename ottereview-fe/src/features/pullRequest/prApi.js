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
      additions: 5,
      deletions: 1,
      changes: 6,
      files: {
        'src/auth/jwt.js': {
          additions: 45,
          deletions: 12,
          patch:
            '@@ -10,7 +10,9 @@ function signToken() {\n' +
            '-  return jwt.sign(payload, secret);\n' +
            "+  if (!secret) throw new Error('No secret');\n" +
            "+  return jwt.sign(payload, secret, { expiresIn: '1h' });\n" +
            '}\n',
        },
        'src/middleware/auth.js': {
          additions: 23,
          deletions: 8,
          patch:
            '@@ -5,6 +5,8 @@ function authenticate(req, res, next) {\n' +
            '-  if (!req.headers.token) return res.status(401).send();\n' +
            '+  const token = req.headers.token;\n' +
            "+  if (!verify(token)) return res.status(401).json({ error: 'Invalid' });\n" +
            '  next();\n' +
            '}\n',
        },
      },
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
      additions: 3,
      deletions: 3,
      changes: 6,
      files: {
        'src/conflict/handler.js': {
          additions: 3,
          deletions: 3,
          patch:
            '@@ -45,6 +45,9 @@ function handleConflict() {\n' +
            "-  console.log('Conflict detected');\n" +
            "+  showAlert('Conflict detected');\n" +
            '+  // TODO: integrate with retry logic\n' +
            '+  retryMerge();\n' +
            '}\n',
        },
      },
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
      additions: 2,
      deletions: 0,
      changes: 2,
      files: {
        'src/ai/promptBuilder.js': {
          additions: 2,
          deletions: 0,
          patch:
            '@@ -22,6 +22,8 @@ const buildPrompt = (data) => {\n' +
            "+  prompt += '\\nPlease focus on edge cases.';\n" +
            "+  prompt += '\\nEnsure formatting is JSON.';\n" +
            '  return prompt;\n' +
            '}\n',
        },
      },
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
      additions: 8,
      deletions: 4,
      changes: 12,
      files: {
        'src/auth/AuthService.js': {
          additions: 8,
          deletions: 4,
          patch:
            '@@ -5,9 +5,12 @@ class AuthService {\n' +
            '-  this.validateCredentials = validateCredentials;\n' +
            '+  // extract validation into separate module\n' +
            '+  this.validator = new CredentialValidator();\n' +
            '+  this.validateCredentials = this.validator.validate;\n' +
            '\n' +
            '-  this.generateToken = generateToken;\n' +
            '+  this.tokenService = new TokenService();\n' +
            '+  this.generateToken = this.tokenService.generate;\n' +
            '\n' +
            '  this.authenticate = async (user) => {\n' +
            '    // ...\n' +
            '  };\n' +
            '}\n',
        },
      },
    },
  ]
}

export const submitPR = async (prData) => {
  console.log('[MOCK POST]', prData)

  return { success: true }
}
