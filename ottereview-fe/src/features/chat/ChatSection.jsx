import { useState } from 'react'
import Whiteboard from './components/Whiteboard'
import ChatSection from './components/ChatSection'
import { useSocketStore } from './store/socketStore'

const App = () => {
  const [roomId, setRoomId] = useState('')
  const [userId] = useState(() => crypto.randomUUID())
  const [color] = useState(() => {
    const hue = Math.floor(Math.random() * 360)
    return `hsl(${hue}, 100%, 40%)`
  })
  const connect = useSocketStore((state) => state.connect)

  const handleJoin = () => {
    if (!roomId) return alert('방 ID를 입력하세요')
    connect(roomId, localStorage.getItem('accessToken'))
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ position: 'absolute', top: 10, left: 10 }}>
        <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Room ID" />
        <button onClick={handleJoin}>입장</button>
      </div>

      {roomId && (
        <>
          <Whiteboard roomId={roomId} userId={userId} color={color} />
          <ChatSection roomId={roomId} userId={userId} />
        </>
      )}
    </div>
  )
}

export default App
