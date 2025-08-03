import { LiveKitRoom } from '@livekit/components-react'
import { createLocalAudioTrack, Room, RoomEvent } from 'livekit-client'
import { useState } from 'react'

const APPLICATION_SERVER_URL = 'http://localhost:4000/api/'
const LIVEKIT_URL = 'ws://localhost:7880'

const AudioComponent = () => {
  const [participantName, setParticipantName] = useState(
    'Participant' + Math.floor(Math.random() * 100)
  )
  const [roomName, setRoomName] = useState('TestRoom')
  const [token, setToken] = useState('')
  const [room, setRoom] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [localTrack, setLocalTrack] = useState(undefined)
  const [remoteTracks, setRemoteTracks] = useState([])

  const getTokenFromServer = async () => {
    const response = await fetch(`${APPLICATION_SERVER_URL}get-token`, {
      method: 'POST',
      body: JSON.stringify({ identity: participantName, roomName }),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await response.json()
    setToken(data.token)
  }

  const connectToRoom = async () => {
    const newRoom = new Room()
    const audioTrack = await createLocalAudioTrack()
    await newRoom.connect(LIVEKIT_URL, token, {
      audio: true,
      video: false,
      tracks: [audioTrack],
    })

    // 원격 오디오 트랙 핸들링 (선택)
    newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === 'audio') {
        track.attach(document.createElement('audio')).play()
      }
    })

    setRoom(newRoom)
    setLocalTrack(audioTrack)
    setIsConnected(true)
  }

  const leaveRoom = async () => {
    await room?.disconnect()
    setRoom(null)
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
        onDisconnected={leaveRoom}
      >
        <div style={{ padding: '1rem' }}>
          <h2>🟢 오디오 연결됨</h2>
          <button onClick={leaveRoom}>🚪 Leave Room</button>
        </div>
      </LiveKitRoom>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>🔊 오디오 테스트</h2>
      <input
        placeholder="이름"
        value={participantName}
        onChange={(e) => setParticipantName(e.target.value)}
      />
      <input placeholder="방 이름" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
      <button onClick={getTokenFromServer}>토큰 요청</button>
      <button onClick={connectToRoom} disabled={!token}>
        회의 시작
      </button>
    </div>
  )
}

export default AudioComponent
