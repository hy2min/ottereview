import { useNavigate, useParams } from 'react-router-dom'

import ChatRoomDetail from '../../features/chat/ChatRoomDetail'

const ChatRoom = () => {
  const navigate = useNavigate()
  const { roomId } = useParams()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button className="border px-4 py-1" onClick={() => navigate(-1)}>
          ← 뒤로가기
        </button>
        <h1 className="text-2xl font-bold">채팅방</h1>
      </div>

      <ChatRoomDetail roomId={Number(roomId)} />
    </div>
  )
}

export default ChatRoom
