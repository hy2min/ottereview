import { useParams } from 'react-router-dom'

import ChatRoomDetail from '../../features/chat/ChatRoomDetail'

const ChatRoom = () => {
  const { roomId } = useParams()

  return (
    <div className="space-y-4 py-4">
      <ChatRoomDetail roomId={Number(roomId)} />
    </div>
  )
}

export default ChatRoom
