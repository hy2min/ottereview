import ChatRoomCard from './ChatRoomCard'
import { useChatStore } from './chatStore'

const ChatRoomList = () => {
  const rooms = useChatStore((state) => state.rooms)

  return (
    <div className="border p-2">
      <h2 className="mb-2">채팅방 목록</h2>
      {rooms.length === 0 ? (
        <p className="text-sm text-gray-500">채팅방 없음</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {rooms.map((room) => (
            <ChatRoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ChatRoomList
