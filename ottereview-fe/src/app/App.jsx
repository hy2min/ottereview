import { useState } from 'react'

import Chat from '../features/chat/Chat'

function App() {
  const [roomIdInput, setRoomIdInput] = useState('')
  const [roomId, setRoomId] = useState('')

  const handleJoinRoom = () => {
    if (!roomIdInput.trim()) return
    setRoomId(roomIdInput.trim())
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>🧪 WebSocket 채팅 테스트</h2>

      <input
        placeholder="roomId 입력 (예: 1)"
        value={roomIdInput}
        onChange={(e) => setRoomIdInput(e.target.value)}
      />
      <button onClick={handleJoinRoom}>입장</button>

      {roomId && (
        <>
          <p>
            🔒 현재 roomId: <strong>{roomId}</strong>
          </p>
          <Chat roomId={roomId} />
        </>
      )}
    </div>
  )
}

export default App
