import { api } from '@/lib/api'

// 내가 작성한 PR 목록
export const fetchAuthoredPRs = async () => {
  const res = await api.get(`/api/repositories/pull-requests/me`)
  return res.data
}

// 내가 리뷰어인 PR 목록
export const fetchReviewerPRs = async () => {
  const res = await api.get(`/api/reviewers/my/pull-requests`)
  return res.data
}

// 레포에 있는 전체 PR 목록
export const fetchPRList = async (repoId) => {
  const res = await api.get(`/api/repositories/${repoId}/pull-requests`)
  return res.data
}

// PR 상세 정보
export const fetchPRDetail = async ({ repoId, prId }) => {
  const res = await api.get(`/api/repositories/${repoId}/pull-requests/${prId}`)
  return res.data
}

// PR 생성
export const submitPR = async ({ formData, repoId }) => {
  const formDataObj = new FormData()

  const pullRequestData = {
    source: formData.source,
    target: formData.target,
  }

  // Blob으로 JSON 데이터 생성
  const pullRequestBlob = new Blob([JSON.stringify(pullRequestData)], {
    type: 'application/json',
  })

  formDataObj.append('pullRequest', pullRequestBlob)

  const res = await api.post(`/api/repositories/${repoId}/pull-requests`, formDataObj, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return res.data
}

export const validatePR = async ({ repoId, source, target }) => {
  const res = await api.get(`/api/repositories/${repoId}/pull-requests/search`, {
    params: { source, target },
  })
  return res.data
}

export const validateBranches = async ({ repoId, source, target }) => {
  const res = await api.post(`/api/repositories/${repoId}/pull-requests/preparation/validation`, {
    source,
    target,
  })
  return res.data
}

// AI 컨벤션 요청
export const requestAIConvention = async ({ repoId, source, target, rules }) => {
  const payload = {
    repo_id: repoId,
    source,
    target,
    rules,
  }
  const res = await api.post('/api/ai/conventions/check', payload)
  return res.data
}

export const requestAIOthers = async ({ repoId, source, target, rules }) => {
  const payload = {
    repo_id: repoId,
    source,
    target,
    rules,
  }
  const res = await api.post('/api/ai/all', payload)
  return res.data
}
