import { MessageCircle, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ChatRoomCard = ({ room }) => {
  const navigate = useNavigate()

  return (
    <div
      className="soft-card p-3 sm:p-4 cursor-pointer w-[180px] sm:w-[200px] h-[90px] sm:h-[100px] flex flex-col justify-between hover:scale-102 transition-all duration-200 border-l-2 border-l-blue-600"
      onClick={() => navigate(`/chatroom/${room.roomId}`)}
    >
      <div className="flex items-center gap-2">
        <MessageCircle size={18} className="text-blue-600 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium theme-text line-clamp-1">
            {room.roomName}
          </h4>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Users size={12} className="text-blue-500" />
          <span className="text-xs theme-text-secondary">활성</span>
        </div>
        <div className="text-xs text-blue-600 font-medium">
          입장 →
        </div>
      </div>
    </div>
  )
}

export default ChatRoomCard;
