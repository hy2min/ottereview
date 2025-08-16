import { MessageCircle, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ChatRoomCard = ({ room }) => {
  const navigate = useNavigate()

  return (
    <div
      className="soft-card p-4 cursor-pointer w-[180px] sm:w-[200px] h-[100px] sm:h-[110px] flex flex-col justify-between hover:scale-102 transition-all duration-200 border-l-4 border-l-orange-600 glow-on-hover"
      onClick={() => navigate(`/chatroom/${room.roomId}`)}
    >
      <div className="flex items-center gap-2">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
          <MessageCircle size={16} className="text-orange-600 flex-shrink-0" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold theme-text line-clamp-1">
            {room.roomName}
          </h4>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Users size={12} className="text-orange-500" />
          <span className="text-xs theme-text-secondary font-medium">실시간</span>
        </div>
        <div className="px-2 py-1 bg-orange-600 text-white text-xs font-medium rounded-md hover:bg-orange-700 transition-colors">
          입장
        </div>
      </div>
    </div>
  )
}

export default ChatRoomCard;
