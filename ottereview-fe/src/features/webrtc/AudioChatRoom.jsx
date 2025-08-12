import { OpenVidu } from 'openvidu-browser'
import React, { useEffect, useRef, useState } from 'react'

import { useAuthStore } from '@/features/auth/authStore'
import { useChatStore } from '@/features/chat/chatStore'

const BACKEND_URL = 'https://i13c108.p.ssafy.io' // Spring 백엔드 주소

const AudioChatRoom = ({ roomId }) => {
  // roomId는 이제 방 이름 생성에만 사용됩니다.
  // OpenVidu 관련 상태
  const [OV, setOV] = useState(undefined)
  const [session, setSession] = useState(undefined)
  const [publisher, setPublisher] = useState(undefined)
  const [isSessionJoined, setIsSessionJoined] = useState(false)
  const [subscribers, setSubscribers] = useState([])
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [isOwner, setIsOwner] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [myUserInfo, setMyUserInfo] = useState(null)
  const audioContainer = useRef(null)

  // 현재 사용자 정보와 Owner 여부 확인
  useEffect(() => {
    const user = useAuthStore.getState().user
    if (user) {
      setMyUserInfo({
        id: user.id,
        username: user.githubUsername || user.username || `User-${user.id}`,
        role: user.role,
      })
    }

    // Owner 권한 확인
    const checkOwnership = () => {
      const rooms = useChatStore.getState().rooms
      const currentRoom = rooms.find((r) => r.id === Number(roomId))

      if (currentRoom && user) {
        // 방 생성자이거나 관리자인 경우 owner
        const isRoomOwner =
          currentRoom.createdBy === user.id ||
          currentRoom.ownerId === user.id ||
          user.role === 'ADMIN'
        setIsOwner(isRoomOwner)
      }
    }

    if (user) {
      checkOwnership()
    }
  }, [roomId])

  useEffect(() => {
    if (roomId && myUserInfo) {
      joinSession(roomId)
    }
    return () => {
      if (session) {
        leaveSession()
      }
    }
  }, [roomId, myUserInfo])

  const joinSession = async (currentRoomId) => {
    try {
      setConnectionStatus('connecting')
      const accessToken = useAuthStore.getState().accessToken
      if (!accessToken) {
        console.error('음성 채팅 참여 실패: 액세스 토큰이 없습니다.')
        setConnectionStatus('error')
        return
      }

      const response = await fetch(`${BACKEND_URL}/api/meetings/${currentRoomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error('서버 응답 에러:', { status: response.status, body: errorBody })

        if (response.status === 404) {
          console.warn(`세션(ID: ${currentRoomId})을 찾을 수 없습니다.`)
          setConnectionStatus('error')
          return
        }
        throw new Error(`토큰 요청 실패 (status=${response.status}): ${errorBody}`)
      }

      const { openviduToken } = await response.json()

      const ov = new OpenVidu()
      const mySession = ov.initSession()
      setSession(mySession)

      mySession.on('streamCreated', (event) => {
        const subscriber = mySession.subscribe(event.stream, undefined)
        setSubscribers((prev) => [...prev, subscriber])
        const audio = document.createElement('audio')
        audio.autoplay = true
        audio.controls = false
        audio.muted = isSpeakerMuted
        subscriber.addVideoElement(audio)
        audioContainer.current?.appendChild(audio)
      })

      mySession.on('streamDestroyed', (event) => {
        setSubscribers((prev) =>
          prev.filter((sub) => sub.stream.streamId !== event.stream.streamId)
        )
        const audioElements = audioContainer.current?.querySelectorAll('audio')
        audioElements?.forEach((audio) => {
          if (audio.srcObject === event.stream.getMediaStream()) {
            audio.remove()
          }
        })
      })

      // 세션 종료 이벤트 감지
      mySession.on('sessionDisconnected', (event) => {
        console.log('세션이 종료되었습니다:', event.reason)
        if (event.reason === 'sessionClosedByServer') {
          alert('방장이 음성 채팅을 종료했습니다.')
        }
        handleSessionEnd()
      })

      // 참여자 변화 감지 - 방장이 나가면 자동으로 세션 정리
      mySession.on('connectionDestroyed', (event) => {
        const connectionData = JSON.parse(event.connection.data)
        console.log(`${connectionData.username}님이 나갔습니다.`)

        // 방장이 나간 경우 세션 정리
        if (connectionData.isOwner && !isOwner) {
          setTimeout(() => {
            alert('방장이 나가서 음성 채팅이 종료됩니다.')
            handleSessionEnd()
          }, 1000)
        }
      })

      // 실제 사용자 정보를 포함한 연결 데이터
      const connectionData = {
        username: myUserInfo.username,
        userId: myUserInfo.id,
        isOwner: isOwner,
      }

      await mySession.connect(openviduToken, {
        clientData: JSON.stringify(connectionData),
      })

      const myPublisher = await ov.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: false,
        publishAudio: true,
        publishVideo: false,
      })

      mySession.publish(myPublisher)
      setPublisher(myPublisher)
      setIsSessionJoined(true)
      setConnectionStatus('connected')
    } catch (error) {
      console.error('세션 참여 중 오류 발생:', error)
      setConnectionStatus('error')
    }
  }

  const handleSessionEnd = () => {
    setSession(undefined)
    setPublisher(undefined)
    setIsSessionJoined(false)
    setSubscribers([])
    setConnectionStatus('connecting')
    if (audioContainer.current) {
      audioContainer.current.innerHTML = '' // 오디오 요소들 제거
    }
  }

  const leaveSession = () => {
    if (session) {
      session.disconnect()
    }
    handleSessionEnd()
  }

  // Owner 전용: 전체 세션 종료 - OpenVidu 자동 삭제 방지
  const closeEntireSession = async () => {
    try {
      const accessToken = useAuthStore.getState().accessToken

      // 서버에 세션 종료 요청
      const response = await fetch(`${BACKEND_URL}/api/meetings/${roomId}/close`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        console.log('음성 세션이 성공적으로 종료되었습니다.')
        // 현재 사용자도 세션에서 나가기
        leaveSession()
        alert('음성 채팅이 종료되었습니다.')
      } else {
        console.error('세션 종료 실패:', response.status)
        alert('세션 종료에 실패했습니다.')
      }
    } catch (error) {
      console.error('세션 종료 중 오류:', error)
      alert('세션 종료 중 오류가 발생했습니다.')
    }
    setShowCloseConfirm(false)
  }

  const toggleMicrophone = () => {
    if (publisher) {
      publisher.publishAudio(!isMicMuted)
      setIsMicMuted(!isMicMuted)
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerMuted(!isSpeakerMuted)
    const audioElements = audioContainer.current?.querySelectorAll('audio')
    audioElements?.forEach((audio) => {
      audio.muted = !isSpeakerMuted
    })
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return { bg: '#d4edda', border: '#c3e6cb', text: '#155724' }
      case 'error':
        return { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' }
      default:
        return { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' }
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return '🟢'
      case 'error':
        return '🔴'
      default:
        return '🟡'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '음성 채팅 연결됨'
      case 'error':
        return '연결 실패'
      default:
        return '연결 중...'
    }
  }

  const colors = getStatusColor()

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: '1rem',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: '0.875rem',
              fontWeight: '600',
              color: colors.text,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {getStatusIcon()} {getStatusText()}
            {isOwner && (
              <span
                style={{
                  fontSize: '0.625rem',
                  padding: '0.125rem 0.375rem',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  borderRadius: '9999px',
                  fontWeight: '600',
                }}
              >
                방장
              </span>
            )}
          </h4>

          {isSessionJoined && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!isOwner && (
                <button
                  onClick={leaveSession}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#4b5563')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = '#6b7280')}
                >
                  🚪 나가기
                </button>
              )}

              {isOwner && (
                <button
                  onClick={() => setShowCloseConfirm(true)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#dc2626')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = '#ef4444')}
                >
                  🛑 세션 종료
                </button>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: '0.75rem',
            color: colors.text,
            opacity: 0.8,
          }}
        >
          Room ID: {roomId}
        </div>
      </div>

      {/* 세션 종료 확인 모달 */}
      {showCloseConfirm && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              maxWidth: '300px',
              textAlign: 'center',
            }}
          >
            <h3
              style={{
                margin: '0 0 1rem 0',
                fontSize: '1rem',
                color: '#1f2937',
              }}
            >
              🛑 음성 세션 종료
            </h3>
            <p
              style={{
                margin: '0 0 1.5rem 0',
                fontSize: '0.875rem',
                color: '#6b7280',
                lineHeight: '1.4',
              }}
            >
              모든 참여자가 음성 채팅에서 연결 해제됩니다. 정말 종료하시겠습니까?
              <br />
              <small style={{ color: '#ef4444' }}>
                (OpenVidu 자동 삭제를 방지하기 위해 방장이 직접 종료해주세요)
              </small>
            </p>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={() => setShowCloseConfirm(false)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={closeEntireSession}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                종료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 컨트롤 버튼들 */}
      {isSessionJoined && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderBottom: `1px solid ${colors.border}`,
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={toggleMicrophone}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                backgroundColor: isMicMuted ? '#ef4444' : '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.2s',
              }}
            >
              {isMicMuted ? '🎤❌' : '🎤'} {isMicMuted ? '음소거됨' : '음소거 해제'}
            </button>

            <button
              onClick={toggleSpeaker}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                backgroundColor: isSpeakerMuted ? '#ef4444' : '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.2s',
              }}
            >
              {isSpeakerMuted ? '🔇' : '🔊'} {isSpeakerMuted ? '스피커 음소거' : '스피커 켜짐'}
            </button>
          </div>
        </div>
      )}

      {/* 참여자 목록 */}
      <div style={{ padding: '1rem' }}>
        <h5
          style={{
            margin: '0 0 0.75rem 0',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: colors.text,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          참여자 ({isSessionJoined ? subscribers.length + 1 : 0})
        </h5>

        {isSessionJoined ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* 나 자신 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.5rem',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isMicMuted ? '#ef4444' : '#22c55e',
                  marginRight: '0.5rem',
                  animation: isMicMuted ? 'none' : 'pulse 2s infinite',
                }}
              ></div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#155724',
                }}
              >
                {myUserInfo?.username} (나) {isOwner && '👑'} {isMicMuted && '🎤❌'}
              </span>
            </div>

            {/* 다른 참여자들 */}
            {subscribers.map((sub, i) => {
              const participantData = JSON.parse(sub.stream.connection.data)
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.5rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '6px',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                      marginRight: '0.5rem',
                      animation: 'pulse 2s infinite',
                    }}
                  ></div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: colors.text,
                    }}
                  >
                    {participantData.username} {participantData.isOwner && '👑'}
                  </span>
                </div>
              )
            })}

            {subscribers.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '1rem',
                  fontSize: '0.75rem',
                  color: colors.text,
                  opacity: 0.7,
                }}
              >
                다른 참여자를 기다리고 있습니다...
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '1rem',
              fontSize: '0.75rem',
              color: colors.text,
              opacity: 0.7,
            }}
          >
            {connectionStatus === 'error'
              ? '연결에 실패했습니다. 새로고침 후 다시 시도해주세요.'
              : '음성 채팅에 연결하는 중...'}
          </div>
        )}
      </div>

      {/* 숨겨진 오디오 컨테이너 */}
      <div ref={audioContainer} style={{ display: 'none' }}></div>

      {/* pulse 애니메이션 스타일 */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}

export default AudioChatRoom
