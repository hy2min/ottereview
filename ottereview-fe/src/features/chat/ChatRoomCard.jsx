import { useNavigate } from 'react-router-dom'

const ChatRoomCard = ({ room }) => {
  const navigate = useNavigate()

  return (
    <div
      className="border p-3 rounded hover:bg-gray-100 cursor-pointer"
      onClick={() => navigate(`/chatroom/${room.id}`)}
    >
      <div className="text-sm font-medium">채팅방 #{room.id}</div>
      <div className="text-xs text-gray-600">참여자: {room.members.join(', ')}</div>
    </div>
  )
}

export default ChatRoomCard
