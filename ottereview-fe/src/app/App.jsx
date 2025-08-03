import { useState } from 'react'
import { Room, createLocalAudioTrack } from 'livekit-client'
import { LiveKitRoom } from '@livekit/components-react'

const APPLICATION_SERVER_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:6080/'
    : `https://${window.location.hostname}:6443/`

const LIVEKIT_URL =
  window.location.hostname === 'localhost'
    ? 'ws://localhost:7880'
    : `wss://${window.location.hostname}:7443`

const App = () => {
  const [participantName, setParticipantName] = useState(
    'Participant' + Math.floor(Math.random() * 100)
  )
  const [roomName, setRoomName] = useState('TestRoom')
  const [token, setToken] = useState('')
  const [room, setRoom] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [localTrack, setLocalTrack] = useState(undefined)
  const [remoteTracks, setRemoteTracks] = useState([])

  // ✅ 토큰 요청
  const getTokenFromServer = async () => {
    const response = await fetch(`${APPLICATION_SERVER_URL}get-token`, {
      method: 'POST',
      body: JSON.stringify({ identity: participantName, roomName }),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await response.json()
    setToken(data.token)
  }

  // ✅ 방 입장
  const connectToRoom = async () => {
    const newRoom = new Room()
    const audioTrack = await createLocalAudioTrack()
    await newRoom.connect(LIVEKIT_URL, token, {
      audio: true,
      video: false,
      tracks: [audioTrack],
    })
    setRoom(newRoom)
    setLocalTrack(audioTrack)
    setIsConnected(true)
  }

  // ✅ 방 나가기 (튜토리얼 설명 부분)
  const leaveRoom = async () => {
    await room?.disconnect()
    setRoom(undefined)
    setLocalTrack(undefined)
    setRemoteTracks([])
    setIsConnected(false)
  }

  if (isConnected && room) {
    return (
      <LiveKitRoom
        room={room}
        connect={false}
        serverUrl={LIVEKIT_URL}
        token={token}
        onDisconnected={leaveRoom} // 연결 종료 시 자동 호출
      >
        <div style={{ padding: '1rem' }}>
          <h2>회의 중입니다</h2>
          <button onClick={leaveRoom}>🚪 Leave Room</button>
        </div>
      </LiveKitRoom>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>🔊 LiveKit 오디오 회의 입장</h1>
      <input
        placeholder="참여자 이름"
        value={participantName}
        onChange={(e) => setParticipantName(e.target.value)}
      />
      <input placeholder="방 이름" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
      <button onClick={getTokenFromServer}>토큰 요청</button>
      <button onClick={connectToRoom} disabled={!token}>
        회의 입장
      </button>
    </div>
  )
}

export default App
