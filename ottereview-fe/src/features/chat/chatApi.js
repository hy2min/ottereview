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
