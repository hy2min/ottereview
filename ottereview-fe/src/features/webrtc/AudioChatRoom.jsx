import { OpenVidu } from 'openvidu-browser'
import React, { useEffect, useRef, useState } from 'react'

import { useAuthStore } from '@/features/auth/authStore'
import { useChatStore } from '@/features/chat/chatStore'
import { useUserStore } from '@/store/userStore'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const AudioChatRoom = ({ roomId, roomParticipants = [] }) => {
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
  const [connectedParticipants, setConnectedParticipants] = useState([]) // 실제 연결된 참가자들
  const audioContainer = useRef(null)

  // Zustand 스토어 구독
  const user = useUserStore((state) => state.user)
  const rooms = useChatStore((state) => state.rooms)

  // 현재 사용자 정보와 Owner 여부 확인
  useEffect(() => {
    if (user) {
      setMyUserInfo({
        id: user.id,
        username: user.githubUsername || user.username || `User-${user.id}`,
        role: user.role,
      })

      const checkOwnership = () => {
        const currentRoom = rooms.find((r) => {
          return r.id === Number(roomId) || String(r.id) === roomId
        })

        if (currentRoom && user) {
          const isRoomOwner =
            currentRoom.createdBy === user.id ||
            currentRoom.ownerId === user.id ||
            user.role === 'ADMIN'
          setIsOwner(isRoomOwner)
        }
      }

      checkOwnership()
    }
  }, [roomId, user, rooms])

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
    console.log('🎯 joinSession 시작 - roomId:', currentRoomId)

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
        setConnectionStatus('error')
        return
      }

      const { openviduToken } = await response.json()
      console.log('✅ OpenVidu 토큰 받음')

      const ov = new OpenVidu()
      const mySession = ov.initSession()

      // 연결 생성 이벤트 로깅
      mySession.on('connectionCreated', (event) => {
        console.log('🔗 새 연결 생성됨:', event.connection.connectionId)
        // 참가자 정보는 streamCreated에서 처리
      })

      // 연결 삭제 이벤트 - 참가자 제거
      mySession.on('connectionDestroyed', (event) => {
        console.log('🔌 연결 삭제됨:', event.connection.connectionId)

        // 연결된 참가자 목록에서 제거
        setConnectedParticipants((prev) =>
          prev.filter((p) => p.connectionId !== event.connection.connectionId)
        )

        try {
          if (event.connection && event.connection.data) {
            const connectionData = JSON.parse(event.connection.data)
            console.log(`👋 ${connectionData.username}님이 나갔습니다.`)

            // 방장이 나간 경우 처리
            if (connectionData.isOwner && !isOwner) {
              setTimeout(() => {
                alert('방장이 나가서 음성 채팅이 종료됩니다.')
                handleSessionEnd()
              }, 1000)
            }
          }
        } catch (error) {
          console.error('연결 데이터 파싱 에러:', error)
        }
      })

      mySession.on('streamCreated', (event) => {
        console.log('📺 새 스트림 생성됨:', event.stream.streamId)
        console.log('📺 스트림 연결 정보:', event.stream.connection.connectionId)

        try {
          const subscriber = mySession.subscribe(event.stream, undefined)
          setSubscribers((prev) => [...prev, subscriber])

          const audio = document.createElement('audio')
          audio.autoplay = true
          audio.controls = false
          audio.muted = isSpeakerMuted
          audio.srcObject = event.stream.getMediaStream()

          if (audioContainer.current) {
            audioContainer.current.appendChild(audio)
          }

          // 스트림이 생성될 때 참가자 정보 추가 (더 안전함)
          if (event.stream.connection.data) {
            const connectionData = JSON.parse(event.stream.connection.data)
            console.log('👤 새 참가자 정보 (스트림에서):', connectionData)

            setConnectedParticipants((prev) => {
              // 중복 체크 (connectionId로)
              const exists = prev.some(
                (p) => p.connectionId === event.stream.connection.connectionId
              )
              if (exists) {
                console.log('👤 이미 존재하는 참가자:', connectionData.username)
                return prev
              }

              console.log('👤 새 참가자 추가:', connectionData.username)
              return [
                ...prev,
                {
                  connectionId: event.stream.connection.connectionId,
                  username: connectionData.username,
                  userId: connectionData.userId,
                  isOwner: connectionData.isOwner,
                  isMe: false,
                },
              ]
            })
          }

          console.log('✅ 오디오 스트림 구독 성공')
        } catch (error) {
          console.error('스트림 구독 에러:', error)
        }
      })

      mySession.on('streamDestroyed', (event) => {
        console.log('🗑️ 스트림 삭제됨:', event.stream.streamId)
        console.log('🗑️ 삭제된 연결 ID:', event.stream.connection.connectionId)

        setSubscribers((prev) =>
          prev.filter((sub) => sub.stream.streamId !== event.stream.streamId)
        )

        // 참가자 목록에서도 제거 (스트림 기준으로)
        setConnectedParticipants((prev) => {
          const filtered = prev.filter(
            (p) => p.connectionId !== event.stream.connection.connectionId
          )
          console.log('👋 참가자 목록에서 제거됨. 남은 참가자:', filtered.length)
          return filtered
        })

        if (audioContainer.current) {
          const audioElements = audioContainer.current.querySelectorAll('audio')
          audioElements.forEach((audio) => {
            try {
              if (audio.srcObject === event.stream.getMediaStream()) {
                if (audio.srcObject) {
                  audio.srcObject.getTracks().forEach((track) => track.stop())
                }
                audio.remove()
              }
            } catch (error) {
              console.error('오디오 정리 에러:', error)
            }
          })
        }
      })

      mySession.on('sessionDisconnected', (event) => {
        console.log('🔌 세션이 종료되었습니다:', event.reason)
        if (event.reason === 'sessionClosedByServer') {
          alert('방장이 음성 채팅을 종료했습니다.')
        }
        handleSessionEnd()
      })

      setSession(mySession)

      // 연결 데이터 준비
      const connectionData = {
        username: myUserInfo.username,
        userId: myUserInfo.id,
        isOwner: isOwner,
      }

      console.log('🔗 세션 연결 시도...')

      // 세션 연결
      await mySession.connect(openviduToken, {
        clientData: JSON.stringify(connectionData),
      })

      console.log('✅ 세션 연결 성공!')

      // 내 자신을 참가자 목록에 추가
      setConnectedParticipants([
        {
          connectionId: 'me',
          username: myUserInfo.username,
          userId: myUserInfo.id,
          isOwner: isOwner,
          isMe: true,
        },
      ])

      // 퍼블리셔 생성
      const myPublisher = await ov.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: false,
        publishAudio: true,
        publishVideo: false,
      })

      await mySession.publish(myPublisher)

      setPublisher(myPublisher)
      setIsSessionJoined(true)
      setConnectionStatus('connected')

      console.log('🎉 OpenVidu 연결 완료!')
    } catch (error) {
      console.error('세션 참여 중 오류 발생:', error)
      setConnectionStatus('error')
    }
  }

  const handleSessionEnd = () => {
    console.log('🧹 세션 정리 시작')

    // 참가자 목록 초기화
    setConnectedParticipants([])

    if (audioContainer.current) {
      const audioElements = audioContainer.current.querySelectorAll('audio')
      audioElements.forEach((audio) => {
        try {
          if (audio.srcObject) {
            audio.srcObject.getTracks().forEach((track) => track.stop())
          }
          audio.remove()
        } catch (error) {
          console.error('오디오 정리 에러:', error)
        }
      })
      audioContainer.current.innerHTML = ''
    }

    setSession(undefined)
    setPublisher(undefined)
    setIsSessionJoined(false)
    setSubscribers([])
    setConnectionStatus('connecting')
  }

  const leaveSession = () => {
    console.log('🚪 세션 나가기')
    if (session) {
      try {
        session.disconnect()
      } catch (error) {
        console.error('세션 연결 해제 에러:', error)
      }
    }
    handleSessionEnd()
  }

  const closeEntireSession = async () => {
    try {
      const accessToken = useAuthStore.getState().accessToken

      const response = await fetch(`${BACKEND_URL}/api/meetings/${roomId}/close`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        console.log('음성 세션이 성공적으로 종료되었습니다.')
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
    if (!user) {
      return '사용자 로딩 중...'
    }
    if (!myUserInfo) {
      return '사용자 정보 설정 중...'
    }
    switch (connectionStatus) {
      case 'connected':
        return '음성 채팅 연결됨'
      case 'error':
        return '연결 실패 - 다시 시도해주세요'
      default:
        return '음성 채팅 연결 중...'
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
          참여자 ({connectedParticipants.length})
          {isSessionJoined && (
            <span style={{ color: '#22c55e', marginLeft: '0.5rem' }}>(음성 연결됨)</span>
          )}
        </h5>

        {isSessionJoined ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* 연결된 참여자들 표시 */}
            {connectedParticipants.map((participant) => (
              <div
                key={participant.connectionId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem',
                  backgroundColor: participant.isMe
                    ? 'rgba(34, 197, 94, 0.1)'
                    : 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '6px',
                  border: `1px solid ${
                    participant.isMe ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)'
                  }`,
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: participant.isMe && isMicMuted ? '#ef4444' : '#22c55e',
                    marginRight: '0.5rem',
                    animation: participant.isMe && isMicMuted ? 'none' : 'pulse 2s infinite',
                  }}
                ></div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: participant.isMe ? '600' : '500',
                    color: participant.isMe ? '#155724' : '#1e40af',
                  }}
                >
                  {participant.username}
                  {participant.isMe && ' (나)'}
                  {participant.isOwner && ' 👑'}
                  {participant.isMe && isMicMuted && ' 🎤❌'}
                </span>
              </div>
            ))}

            {connectedParticipants.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '1rem',
                  fontSize: '0.75rem',
                  color: colors.text,
                  opacity: 0.7,
                }}
              >
                참여자를 기다리고 있습니다...
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
            {!user
              ? '사용자 정보를 불러오는 중...'
              : !myUserInfo
                ? '사용자 정보를 설정하는 중...'
                : connectionStatus === 'error'
                  ? '연결에 실패했습니다. 페이지를 새로고침하거나 마이크 권한을 확인해주세요.'
                  : '음성 채팅에 연결하는 중...'}
          </div>
        )}
      </div>

      {/* 숨겨진 오디오 컨테이너 */}
      <div ref={audioContainer} style={{ display: 'none' }}></div>

      {/* pulse 애니메이션 스타일 */}
      <style>{`
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
