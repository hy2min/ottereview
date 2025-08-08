import { api } from '@/lib/api'

// 채팅방 생성
export const createChat = async ({ prId, roomName, inviteeIds }) => {
  const res = await api.post('api/meetings', {
    prId,
    roomName,
    inviteeIds,
  })
  return res.data
}

// 채팅방 조회
export const fetchChat = async () => {
  const res = await api.get('api/users/me/meetingroom')
  return res.data
}
