import { useParams } from 'react-router-dom'

import Section from '../../components/Section'
import ChatRoomDetail from '../../features/chat/ChatRoomDetail'

const ChatRoom = () => {
  const { roomId } = useParams()

  return (
    <div className="space-y-4 py-4">
      <Section>
        <ChatRoomDetail roomId={Number(roomId)} />
      </Section>
    </div>
  )
}

export default ChatRoom
