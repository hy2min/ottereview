import { useEffect } from 'react'

import { useAuthStore } from '@/features/auth/authStore'

import { fetchChat } from './chatApi'
import ChatRoomCard from './ChatRoomCard'
import { useChatStore } from './chatStore'

const ChatRoomList = () => {
  const rooms = useChatStore((state) => state.rooms)
  const setRooms = useChatStore((state) => state.setRooms)
  const accessToken = useAuthStore((state) => state.accessToken)

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const fetchedRooms = await fetchChat(accessToken)
        setRooms(fetchedRooms)
        console.log(fetchedRooms)
      } catch (err) {
        console.error('채팅방 목록 로딩 실패: ', err)
      }
    }
    if (accessToken) {
      fetchRooms()
    }
  }, [accessToken, setRooms])

  return (
    <div className="border p-2">
      <h2 className="mb-2">채팅방 목록</h2>
      {rooms.length === 0 ? (
        <p className="text-sm text-gray-500">채팅방 없음</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {rooms.map((room) => (
            <ChatRoomCard key={room.roomId} room={room} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ChatRoomList
