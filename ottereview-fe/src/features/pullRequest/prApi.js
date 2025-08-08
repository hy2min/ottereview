import { api } from '../../lib/api'

// 내가 작성한 PR 목록
export const fetchAuthoredPRs = async () => {
  const res = await api.get(`/api/repositories/1/pull-requests`)
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
export const submitPR = async (prData) => {
  return // 구현 예정
}

export const validateBranches = async ({ repoId, source, target }) => {
  const res = await api.post(`/api/repositories/${repoId}/pull-requests/preparation/validation`, {
    source,
    target,
  })
  return res.data // 이걸 그대로 validationResult에 세팅 가능
}
