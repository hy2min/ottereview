import { useState } from 'react'

import Chat from '../../features/chat/Chat'
import CodeEditor from '../../features/chat/CodeEditor'
// import Whiteboard from '../../features/chat/Whiteboard'

const ChatRoom = () => {
  const [roomIdInput, setRoomIdInput] = useState('')
  const [roomId, setRoomId] = useState('')

  const handleJoinRoom = () => {
    if (!roomIdInput.trim()) return
    setRoomId(roomIdInput.trim())
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>🧪 WebSocket 채팅 + Yorkie 코드 공유 + 화이트보드</h2>

      <div style={{ marginBottom: '1rem' }}>
        <input
          placeholder="roomId 입력 (예: 1)"
          value={roomIdInput}
          onChange={(e) => setRoomIdInput(e.target.value)}
        />
        <button onClick={handleJoinRoom} style={{ marginLeft: '0.5rem' }}>
          입장
        </button>
      </div>

      {roomId && (
        <>
          <p>
            🔒 현재 roomId: <strong>{roomId}</strong>
          </p>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
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
