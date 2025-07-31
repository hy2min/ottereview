import { useParams } from 'react-router-dom'

import Box from '../../components/Box'
import ChatRoomDetail from '../../features/chat/ChatRoomDetail'

const ChatRoom = () => {
  const { roomId } = useParams()

  return (
    <div className="space-y-4 py-4">
      <Box shadow>
        <ChatRoomDetail roomId={Number(roomId)} />
      </Box>
    </div>
  )
}

export default ChatRoom
