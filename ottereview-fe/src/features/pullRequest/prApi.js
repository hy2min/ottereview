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
export const fetchRepoPRList = async (repoId) => {
  const res = await api.get(`/api/repositories/${repoId}/pull-requests`)
  return res.data
}

// PR 상세 정보
export const fetchPRDetail = async ({ repoId, prId }) => {
  const res = await api.get(`/api/repositories/${repoId}/pull-requests/${prId}`)
  return res.data
}

// PR 생성
export const submitPR = async ({ source, target, repoId }) => {
  const formDataObj = new FormData()

  const pullRequestData = {
    source,
    target,
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
    reviewData.files.forEach((file, index) => {
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

// PR 리뷰 목록 가져오기
export const fetchPRReviews = async ({ accountId, repoId, prId }) => {
  const res = await api.get(
    `/api/accounts/${accountId}/repositories/${repoId}/pull-requests/${prId}/review`
  )
  return res.data
}
