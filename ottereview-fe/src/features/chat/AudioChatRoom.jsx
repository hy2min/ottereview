import { OpenVidu } from 'openvidu-browser'
import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom' // URL 파라미터를 가져오기 위해 import

const BACKEND_URL = 'http://localhost:8080' // Spring 백엔드 주소

const AudioChatRoom = () => {
  // OpenVidu 관련 상태
  const [OV, setOV] = useState(undefined)
  const [session, setSession] = useState(undefined)
  const [isSessionJoined, setIsSessionJoined] = useState(false) // 세션 참여 여부 상태
  const [subscribers, setSubscribers] = useState([])

  // 채팅방 정보 관련 상태
  const { roomId: paramRoomId } = useParams() // URL에서 roomId 파라미터 가져오기
  const [roomId, setRoomId] = useState(paramRoomId)
  const [roomName, setRoomName] = useState('')
  const [myUserName, setMyUserName] = useState('Participant' + Math.floor(Math.random() * 100))

  // --- 채팅방 생성 UI를 위한 상태 ---
  const [prId, setPrId] = useState(1) // 기본 PR ID
  const [prUsers, setPrUsers] = useState([]) // PR에 참여한 사용자 목록
  const [inviteeIds, setInviteeIds] = useState([]) // 초대할 사용자 ID 목록

  const audioContainer = useRef(null)

  // --- Mock Functions ---
  // TODO: 실제 API로 교체해야 합니다.
  const fetchPrUsers = async () => {
    // 예시: PR 참여자 목록을 가져오는 API 호출
    // 실제로는 토큰을 헤더에 담아 요청해야 합니다.
    console.log('PR 참여자 목록을 가져옵니다...')
    // 임시 데이터
    const mockUsers = [
      { id: 2, name: 'user2' },
      { id: 3, name: 'user3' },
      { id: 4, name: 'user4' },
    ]
    setPrUsers(mockUsers)
  }

  // 컴포넌트 마운트 시 실행
  useEffect(() => {
    // PR 참여자 목록을 불러옵니다.
    fetchPrUsers()

    // URL에 roomId가 있으면 바로 세션에 참여합니다.
    if (paramRoomId) {
      joinSession(paramRoomId)
    }

    // 컴포넌트 언마운트 시 세션 연결 해제
    return () => {
      if (session) {
        leaveSession()
      }
    }
  }, []) // 최초 1회만 실행

  // 초대할 사용자 선택 핸들러
  const handleInviteeChange = (userId) => {
    setInviteeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  // 세션 생성 및 참여
  const createAndJoinSession = async () => {
    if (!roomName) {
      alert('채팅방 이름을 입력하세요.')
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('로그인이 필요합니다. 로그인 후 다시 시도해주세요.')
        // TODO: 로그인 페이지로 리디렉션 하는 로직을 추가할 수 있습니다.
        // window.location.href = '/login';
        return
      }

      // 1. 백엔드에 채팅방(세션) 생성 요청
      const response = await fetch(`${BACKEND_URL}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prId: prId, // 입력된 PR ID 사용
          roomName: roomName,
          inviteeIds: inviteeIds, // 초대할 사용자 ID 목록
        }),
      })

      if (!response.ok) {
        const msg = await response.text()
        console.error(`채팅방 생성 실패 (status=${response.status}): ${msg}`)
        // 500 에러인 경우, 토큰 만료 또는 무효 가능성을 안내
        if (response.status === 500) {
          alert(
            '채팅방 생성에 실패했습니다. (서버 오류) 세션이 만료되었을 수 있으니, 다시 로그인한 후 시도해주세요.'
          )
        } else {
          alert(`채팅방 생성 실패: ${msg}`)
        }
        return // 에러 발생 시 여기서 중단
      }

      const roomData = await response.json()
      const newRoomId = roomData.roomId
      setRoomId(newRoomId)

      // 2. 생성된 채팅방에 즉시 참여
      await joinSession(newRoomId)
    } catch (error) {
      console.error('채팅방 생성 및 참여 중 오류 발생:', error)
      alert(error.message)
    }
  }

  // 기존 세션에 참여
  const joinSession = async (targetRoomId) => {
    if (!targetRoomId) {
      alert('Room ID를 입력하세요.')
      return
    }
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) throw new Error('Access token not found')

      // 1. 백엔드에 토큰 요청
      const response = await fetch(`${BACKEND_URL}/api/meetings/${targetRoomId}/join`, {
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
      const openviduToken = tokenData.openviduToken

      // 2. OpenVidu 세션 초기화 및 연결
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
        audioContainer.current.appendChild(audio)
        console.log('상대방의 오디오 스트림을 받았습니다.')
      })

      mySession.on('streamDestroyed', (event) => {
        setSubscribers((prev) =>
          prev.filter((sub) => sub.stream.streamId !== event.stream.streamId)
        )
      })

      await mySession.connect(openviduToken, { clientData: myUserName })

      // 3. 내 오디오/비디오 장치 설정 및 퍼블리시
      const publisher = await OVInstance.initPublisherAsync(undefined, {
        audioSource: undefined, // 기본 마이크
        videoSource: false, // 비디오는 사용 안 함
        publishAudio: true,
        publishVideo: false,
      })

      mySession.publish(publisher)
      setIsSessionJoined(true) // 세션 참여 상태로 변경
      console.log('세션에 성공적으로 참여했습니다.')
    } catch (error) {
      console.error('세션 참여 중 오류 발생:', error)
      alert(error.message)
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
    setRoomId(undefined)
    if (audioContainer.current) {
      audioContainer.current.innerHTML = ''
    }
    console.log('세션을 떠났습니다.')
  }

  // --- UI 렌더링 ---
  // 세션에 참여한 경우, 음성 채팅 UI를 보여줍니다.
  if (isSessionJoined) {
    return (
      <div style={{ padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>🟢 음성 채팅방 ({roomId})</h2>
        <p>
          <strong>{myUserName}</strong>님, 환영합니다!
        </p>
        <button onClick={leaveSession}>🚪 나가기</button>

        <div style={{ marginTop: '1rem' }}>
          <h4>참여자 목록</h4>
          <ul>
            <li>{myUserName} (나)</li>
            {subscribers.map((sub, i) => (
              <li key={i}>{JSON.parse(sub.stream.connection.data).clientData}</li>
            ))}
          </ul>
        </div>

        {/* 다른 참여자들의 오디오가 여기에 추가됩니다. */}
        <div ref={audioContainer} style={{ marginTop: '1rem' }}>
          <p>참여자 오디오:</p>
        </div>
      </div>
    )
  }

  // 세션에 참여하지 않은 경우, 채팅방 생성 또는 참여 UI를 보여줍니다.
  return (
    <div style={{ padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      {/* 회의 생성 섹션 */}
      <div style={{ marginBottom: '2rem' }}>
        <h2>🔊 음성 회의실 생성</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            <strong>PR ID: </strong>
            <input
              type="number"
              placeholder="PR ID"
              value={prId}
              onChange={(e) => setPrId(parseInt(e.target.value, 10))}
              style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            <strong>채팅방 이름: </strong>
            <input
              type="text"
              placeholder="채팅방 이름을 입력하세요"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            <strong>내 이름: </strong>
            <input
              type="text"
              placeholder="참가자 이름"
              value={myUserName}
              onChange={(e) => setMyUserName(e.target.value)}
              style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>초대할 참여자 (이메일 전송):</strong>
          <div style={{ marginTop: '0.5rem' }}>
            {prUsers.length > 0 ? (
              prUsers.map((user) => (
                <label key={user.id} style={{ marginRight: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={inviteeIds.includes(user.id)}
                    onChange={() => handleInviteeChange(user.id)}
                  />
                  {user.name}
                </label>
              ))
            ) : (
              <p>PR 참여자를 불러오는 중...</p>
            )}
          </div>
        </div>
        <button
          onClick={createAndJoinSession}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          회의 생성 및 참가
        </button>
      </div>

      {/* 구분선 */}
      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '2rem 0' }} />

      {/* 기존 회의 참가 섹션 */}
      <div>
        <h2>🤝 기존 회의에 참가</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            <strong>참가할 Room ID: </strong>
            <input
              type="text"
              placeholder="Room ID 입력"
              value={roomId || ''}
              onChange={(e) => setRoomId(e.target.value)}
              style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
            />
          </label>
        </div>
        <button
          onClick={() => joinSession(roomId)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          기존 회의 참가
        </button>
      </div>
    </div>
  )
}

export default AudioChatRoom
