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

// 레포의 PR 목록 (커서 기반)
export const fetchRepoPRList = async (repoId, { limit = 20, cursor = null } = {}) => {
  const res = await api.get(`/api/repositories/${repoId}/pull-requests`, {
    params: {
      limit,
      cursor, // null이면 첫 페이지
    },
  })
  return res.data
}

// PR 상세 정보
export const fetchPRDetail = async ({ repoId, prId }) => {
  const res = await api.get(`/api/repositories/${repoId}/pull-requests/${prId}`)
  return res.data
}

// PR 생성
export const submitPR = async ({
  source,
  target,
  repoId,
  reviewComments = [],
  audioFiles = [],
}) => {
  const formDataObj = new FormData()

  const pullRequestData = {
    source,
    target,
    reviewComments,
  }

  // Blob으로 JSON 데이터 생성
  const pullRequestBlob = new Blob([JSON.stringify(pullRequestData)], {
    type: 'application/json',
  })

  formDataObj.append('pullRequest', pullRequestBlob)

  // 음성 파일들을 mediaFiles로 추가
  if (audioFiles && audioFiles.length > 0) {
    audioFiles.forEach((file) => {
      formDataObj.append('mediaFiles', file)
    })
  }

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
  console.log(payload)
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
  console.log(payload)
  const res = await api.post('/api/ai/all', payload)
  return res.data
}

// PR 리뷰 제출
export const submitReview = async ({ accountId, repoId, prId, reviewData }) => {
  const formData = new FormData()

  // reviewRequest를 JSON Blob으로 추가
  const reviewRequestBlob = new Blob([JSON.stringify(reviewData.reviewRequest)], {
    type: 'application/json',
  })
  formData.append('reviewRequest', reviewRequestBlob)

  // 음성 파일들을 추가
  if (reviewData.files && reviewData.files.length > 0) {
    reviewData.files.forEach((file) => {
      formData.append('files', file)
    })
  }

  const res = await api.post(
    `/api/accounts/${accountId}/repositories/${repoId}/pull-requests/${prId}/review`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return res.data
}

// PR 준비 정보 저장 (전체 formData)
export const savePRAdditionalInfo = async (repoId, formData) => {
  console.log('savePRAdditionalInfo payload:', formData)
  const res = await api.post(
    `/api/repositories/${repoId}/pull-requests/preparation/additional-info`,
    formData
  )
  return res.data
}

// AI 요약 생성
export const generateAISummary = async ({ source, target, repoId }) => {
  const payload = {
    source,
    target,
    repo_id: repoId,
  }
  const res = await api.post(`/api/ai/summary`, payload)
  return res.data
}

// PR 리뷰 목록 가져오기
export const fetchPRReviews = async ({ accountId, repoId, prId }) => {
  const res = await api.get(
    `/api/accounts/${accountId}/repositories/${repoId}/pull-requests/${prId}/review`
  )
  return res.data
}

export const IsMergable = async ({ repoId, prId }) => {
  const res = await api.get(`/api/repositories/${repoId}/pull-requests/${prId}/merges`)
  return res.data
}

export const doMerge = async ({ repoId, prId }) => {
  const res = await api.get(`/api/repositories/${repoId}/pull-requests/${prId}/merges/doing`)
  return res.data
}

export const closePR = async ({ repoId, prId }) => {
  const res = await api.put(`/api/repositories/${repoId}/pull-requests/${prId}/close`)
  return res.data
}

export const reopenPR = async ({ repoId, prId }) => {
  const res = await api.put(`/api/repositories/${repoId}/pull-requests/${prId}/reopen`)
  return res.data
}

// PR descriptions 가져오기
export const fetchPRDescriptions = async (prId) => {
  const res = await api.get(`/api/pull-requests/${prId}/descriptions`)
  return res.data
}
