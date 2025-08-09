// import { useState } from 'react'
import { useParams } from 'react-router-dom'; // 새로 추가된 코드: URL 파라미터에서 roomId를 가져오기 위해 import

import AudioChatRoom from '@/features/webrtc/AudioChatRoom'
import Chat from '@/features/webrtc/Chat'
import CodeEditor from '@/features/webrtc/CodeEditor'
import Whiteboard from '@/features/webrtc/Whiteboard'

const ChatRoom = () => {
  // const [roomIdInput, setRoomIdInput] = useState('')
  // const [roomId, setRoomId] = useState('')

  // const handleJoinRoom = () => {
  //   if (!roomIdInput.trim()) return
  //   setRoomId(roomIdInput.trim())
  // }

  // 새로 추가된 코드: URL 파라미터에서 roomId를 가져옵니다.
  const { roomId } = useParams();

  return (
    <div style={{ padding: '2rem' }}>
      <h2>🧪 채팅방 </h2>

      {/* <div style={{ marginBottom: '1rem' }}>
        <input
          placeholder="roomId 입력 (예: 1)"
          value={roomIdInput}
          onChange={(e) => setRoomIdInput(e.target.value)}
        />
        <button onClick={handleJoinRoom} style={{ marginLeft: '0.5rem' }}>
          입장
        </button>
      </div> */}

      {roomId && (
        <>
          <p>
            🔒 현재 roomId: <strong>{roomId}</strong>
          </p>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <AudioChatRoom roomId={roomId} />
              <Chat roomId={roomId} />
            </div>
            <div style={{ flex: 2 }}>
              <CodeEditor roomId={roomId} />
            </div>
          </div>

          <div style={{ marginTop: '2rem', height: '500px', border: '1px solid #ccc' }}>
            <Whiteboard roomId={roomId} />
          </div>
        </>
      )}
    </div>
  )
}

export default ChatRoom
