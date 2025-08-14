import { api } from '@/lib/api'

// 채팅방 생성
export const createChat = async ({ prId, roomName, inviteeIds, files }) => {
  const res = await api.post('api/meetings', {
    prId,
    roomName,
    inviteeIds,
    files,
  })
  return res.data
}

// 전체 채팅방 조회
export const fetchChat = async () => {
  const res = await api.get('api/users/me/meetingroom')
  return res.data
}

// 채팅방 조회
export const fetchChatDetail = async (meetingroomId) => {
  const res = await api.get(`api/meetings/${meetingroomId}`)
  return res.data
}

// 채팅방 삭제
export const deleteChatRoom = async (meetingroomId) => {
  const res = await api.delete(`/api/meetings/${meetingroomId}`)
  return res.data
}
