import { api } from '@/lib/api'

// 멤버 목록
export const fetchMemberList = async ({ repoId }) => {
  const res = await api.get(`/api/accounts/repositories/${repoId}/users`)
  return res.data.map((entry) => entry.githubUsername)
}

// 충돌 목록
export const fetchConflictFile = async ({ repoId, prId }) => {
  const res = await api.get(`/api/repositories/${repoId}/pull-requests/${prId}`)
  return res.data
}
