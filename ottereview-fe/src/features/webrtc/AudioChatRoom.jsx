import { OpenVidu } from 'openvidu-browser'
import React, { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/features/auth/authStore'

const BACKEND_URL = 'http://i13c108.p.ssafy.io:8080' // Spring 백엔드 주소

const AudioChatRoom = ({ roomId }) => {
  // roomId는 이제 방 이름 생성에만 사용됩니다.
  // OpenVidu 관련 상태
  const [OV, setOV] = useState(undefined)
  const [session, setSession] = useState(undefined)
  const [isSessionJoined, setIsSessionJoined] = useState(false)
  const [subscribers, setSubscribers] = useState([])
  const [myUserName, setMyUserName] = useState('Participant' + Math.floor(Math.random() * 100))

  // 세션 생성 및 참여를 위한 상태
  const [prId, setPrId] = useState('')
  const [voiceRoomId, setVoiceRoomId] = useState(null) // 생성된 음성 채팅방의 ID

  const audioContainer = useRef(null)

  // 컴포넌트 언마운트 시 세션 연결 해제
  useEffect(() => {
    return () => {
      if (session) {
        leaveSession()
      }
    }
  }, [session])

  // 세션 생성 함수
  const createSession = async () => {
    if (!prId) {
      alert('PR ID를 입력하세요.')
      return
    }
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) throw new Error('Access token not found')

      const response = await fetch(`${BACKEND_URL}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prId: parseInt(prId, 10),
          roomName: `Voice for Room ${roomId}`,
          inviteeIds: [],
        }),
      })

      if (!response.ok) {
        const msg = await response.text()
        if (response.status === 409) {
          alert('이미 해당 PR에 대한 음성 채팅방이 존재합니다. 기존 방에 참여하세요.')
          return
        }
        throw new Error(`세션 생성 실패 (status=${response.status}): ${msg}`)
      }

      const roomData = await response.json()
      setVoiceRoomId(roomData.roomId) // 새로 생성된 roomId를 상태에 저장
      alert(`음성 세션(ID: ${roomData.roomId})이 생성되었습니다. 이제 참여할 수 있습니다.`)
    } catch (error) {
      console.error('세션 생성 중 오류 발생:', error)
      alert(`세션 생성에 실패했습니다: ${error.message}`)
    }
  }

  // 세션에 참여
  const joinSession = async () => {
    if (!voiceRoomId) {
      alert('먼저 음성 세션을 생성하거나, 기존 세션 ID를 입력해주세요.')
      return
    }
    try {
      const token = useAuthStore.getState().accessToken
      if (!token) throw new Error('Access token not found')

      const response = await fetch(`${BACKEND_URL}/api/meetings/${voiceRoomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const msg = await response.text()
        throw new Error(`토큰 요청 실패 (status=${response.status}): ${msg}`)
      }

      const tokenData = await response.json()
      console.log(tokenData)
      const openviduToken = tokenData.openviduToken

      const OVInstance = new OpenVidu()
      setOV(OVInstance)

      const mySession = OVInstance.initSession()
      setSession(mySession)

      mySession.on('streamCreated', (event) => {
        const subscriber = mySession.subscribe(event.stream, undefined)
        setSubscribers((prev) => [...prev, subscriber])

        const audio = document.createElement('audio')
        audio.autoplay = true
        audio.controls = false
        subscriber.addVideoElement(audio)
        if (audioContainer.current) {
          audioContainer.current.appendChild(audio)
        }
      })

      mySession.on('streamDestroyed', (event) => {
        setSubscribers((prev) =>
          prev.filter((sub) => sub.stream.streamId !== event.stream.streamId)
        )
      })

      await mySession.connect(openviduToken, { clientData: myUserName })

      const publisher = await OVInstance.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: false,
        publishAudio: true,
        publishVideo: false,
      })

      mySession.publish(publisher)
      setIsSessionJoined(true)
    } catch (error) {
      console.error('세션 참여 중 오류 발생:', error)
      alert(`음성 채팅 참여에 실패했습니다: ${error.message}`)
    }
  }

  // 세션 떠나기
  const leaveSession = () => {
    if (session) {
      session.disconnect()
    }
    setOV(undefined)
    setSession(undefined)
    setIsSessionJoined(false)
    setSubscribers([])
    setVoiceRoomId(null) // 세션을 떠나면 ID도 초기화
    if (audioContainer.current) {
      audioContainer.current.innerHTML = ''
    }
  }

  if (!roomId) {
    return null
  }

  if (isSessionJoined) {
    return (
      <div
        style={{
          padding: '1rem',
          border: '1px solid #ccc',
          borderRadius: '8px',
          marginBottom: '1rem',
        }}
      >
        <h5>🟢 음성 채팅 중... (Room: {voiceRoomId})</h5>
        <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>
          <strong>{myUserName}</strong> (나)
        </p>
        <div style={{ marginTop: '0.5rem' }}>
          <h6 style={{ fontSize: '0.9rem' }}>참여자 목록</h6>
          <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '0.8rem' }}>
            {subscribers.map((sub, i) => (
              <li key={i}>{JSON.parse(sub.stream.connection.data).clientData}</li>
            ))}
          </ul>
        </div>
        <button onClick={leaveSession} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
          🚪 나가기
        </button>
        <div ref={audioContainer} style={{ display: 'none' }}></div>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '1rem',
        border: '1px solid #ccc',
        borderRadius: '8px',
        marginBottom: '1rem',
      }}
    >
      <h5>🔊 음성 채팅</h5>
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>
          1. 음성 채팅을 시작할 PR ID를 입력 후 세션을 생성하세요.
        </p>
        <input
          type="text"
          placeholder="PR ID 입력"
          value={prId}
          onChange={(e) => setPrId(e.target.value)}
          style={{ marginRight: '0.5rem', padding: '0.25rem' }}
        />
        <button onClick={createSession} style={{ padding: '0.25rem 0.5rem' }}>
          🛠️ 세션 생성
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '1rem 0' }} />

      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>
          2. 생성된 세션에 참여하거나, 기존 세션 ID를 입력하여 참여하세요.
        </p>
        <input
          type="text"
          placeholder="참여할 Room ID"
          value={voiceRoomId || ''} // 생성된 ID를 보여주거나 직접 입력 가능
          onChange={(e) => setVoiceRoomId(e.target.value)}
          style={{ marginRight: '0.5rem', padding: '0.25rem' }}
        />
        <button onClick={joinSession} style={{ padding: '0.5rem 1rem' }}>
          🎙️ 참여하기
        </button>
      </div>
    </div>
  )
}

export default AudioChatRoom
