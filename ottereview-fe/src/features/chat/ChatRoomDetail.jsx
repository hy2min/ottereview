import Card from '../../components/Card'
import Section from '../../components/Section'
import { useChatStore } from './chatStore'

const ChatRoomDetail = ({ roomId }) => {
  const room = useChatStore((state) => state.rooms.find((r) => r.id === roomId))

  if (!room) return <p className="text-red-500">존재하지 않는 채팅방입니다.</p>

  return (
    <div className="space-y-4">
      <Card>
        <h2 className=" mb-2">참여자</h2>
        <ul className="list-disc list-inside text-sm">
          {room.members.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className=" mb-2">충돌 파일</h2>
        <ul className="list-disc list-inside text-sm">
          {room.conflictFiles.map((file) => (
            <li key={file}>{file}</li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

export default ChatRoomDetail
