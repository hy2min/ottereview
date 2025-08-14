import { api } from '@/lib/api'

export const conflictApi = {
  // 레포지토리 멤버 목록 조회
  fetchMembers: async (repoId) => {
    try {
      const res = await api.get(`/api/accounts/repositories/${repoId}/users`)
      return res.data
    } catch (error) {
      console.error('멤버 목록 조회 실패:', error)
      throw error
    }
  },

  // PR 정보 조회 (충돌 목록 포함)
  fetchPRInfo: async (repoId, prId) => {
    try {
      const res = await api.get(`/api/repositories/${repoId}/pull-requests/${prId}`)
      return res.data
    } catch (error) {
      console.error('PR 정보 조회 실패:', error)
      throw error
    }
  },

  // 충돌 데이터 상세 조회
  fetchConflictData: async (repoId, prId) => {
    try {
      const res = await api.get(`/api/repositories/${repoId}/pull-requests/${prId}/merges/conflicts`)
      return res.data
    } catch (error) {
      console.error('충돌 데이터 조회 실패:', error)
      throw error
    }
  },

  // 충돌 해결
  resolveConflict: async (repoId, prId, conflictData) => {
    try {
      const res = await api.post(`/api/repositories/${repoId}/pull-requests/${prId}/merges/conflicts/resolve`, conflictData)
      return res.data
    } catch (error) {
      console.error('충돌 해결 실패:', error)
      throw error
    }
  }
}

// 기존 함수들을 유지 (하위 호환성)
export const fetchMemberList = ({ repoId }) => conflictApi.fetchMembers(repoId)
export const fetchConflictFile = ({ repoId, prId }) => conflictApi.fetchPRInfo(repoId, prId)
export const fetchConflictData = (repoId, prId) => conflictApi.fetchConflictData(repoId, prId)
