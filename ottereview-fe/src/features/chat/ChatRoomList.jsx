import ChatRoomCard from './ChatRoomCard'
import { useChatStore } from './chatStore'

const ChatRoomList = () => {
  const rooms = useChatStore((state) => state.rooms)

  return (
    <div className="space-y-2">
      <h2 className="font-semibold">채팅방 목록</h2>
      {rooms.length === 0 && <p className="text-sm text-gray-500">채팅방 없음</p>}
      {rooms.map((room) => (
        <ChatRoomCard key={room.id} room={room} />
      ))}
    </div>
  )
}

export default ChatRoomList
