import { api } from '@/lib/api'

export const chatApi = {
  // 채팅방 생성
  create: async ({ prId, roomName, inviteeIds, files }) => {
    try {
      const res = await api.post('/api/meetings', {
        prId,
        roomName,
        inviteeIds,
        files,
      })
      return res.data
    } catch (error) {
      console.error('채팅방 생성 실패:', error)
      throw error
    }
  },

  // 전체 채팅방 조회
  fetchAll: async () => {
    try {
      const res = await api.get('/api/users/me/meetingroom')
      return res.data
    } catch (error) {
      console.error('채팅방 목록 조회 실패:', error)
      throw error
    }
  },

  // 채팅방 상세 조회
  fetchDetail: async (meetingroomId) => {
    try {
      const res = await api.get(`/api/meetings/${meetingroomId}`)
      return res.data
    } catch (error) {
      console.error('채팅방 상세 조회 실패:', error)
      throw error
    }
  },

  // 채팅방 삭제
  delete: async (meetingroomId) => {
    try {
      const res = await api.delete(`/api/meetings/${meetingroomId}`)
      return res.data
    } catch (error) {
      console.error('채팅방 삭제 실패:', error)
      throw error
    }
  },

  // WebRTC 세션 참여
  joinSession: async (roomId) => {
    try {
      const res = await api.post(`/api/meetings/${roomId}/join`)
      return res.data
    } catch (error) {
      console.error('WebRTC 세션 참여 실패:', error)
      throw error
    }
  },

  // WebRTC 세션 종료
  closeSession: async (roomId) => {
    try {
      const res = await api.delete(`/api/meetings/${roomId}/close`)
      return res.data
    } catch (error) {
      console.error('WebRTC 세션 종료 실패:', error)
      throw error
    }
  }
}

// 기존 함수들을 유지 (하위 호환성)
export const createChat = chatApi.create
export const fetchChat = chatApi.fetchAll
export const fetchChatDetail = chatApi.fetchDetail
export const deleteChatRoom = chatApi.delete
