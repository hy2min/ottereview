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
  const [connectedParticipants, setConnectedParticipants] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [needsUserInteraction, setNeedsUserInteraction] = useState(true) // 사용자 상호작용 필요 여부
  const [audioContext, setAudioContext] = useState(null) // 오디오 컨텍스트
  const audioContainer = useRef(null)

  // Zustand 스토어 구독
  const user = useUserStore((state) => state.user)
  const rooms = useChatStore((state) => state.rooms)

  // 오디오 컨텍스트 초기화 함수
  const initializeAudioContext = async () => {
    if (!audioContext && (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined')) {
      try {
        const AudioContextClass = AudioContext || webkitAudioContext
        const newAudioContext = new AudioContextClass()
        
        if (newAudioContext.state === 'suspended') {
          await newAudioContext.resume()
        }
        
        setAudioContext(newAudioContext)
        console.log('✅ 오디오 컨텍스트 초기화됨:', newAudioContext.state)
        return newAudioContext
      } catch (error) {
        console.error('오디오 컨텍스트 초기화 실패:', error)
      }
    }
    return audioContext
  }

  // 사용자 상호작용 처리 함수
  const handleUserInteraction = async () => {
    try {
      console.log('👆 사용자 상호작용 감지됨')
      
      // 오디오 컨텍스트 활성화
      await initializeAudioContext()
      
      // 모든 오디오 요소에 대해 재생 시도
      const audioElements = audioContainer.current?.querySelectorAll('audio')
      if (audioElements) {
        for (const audio of audioElements) {
          if (!isSpeakerMuted && audio.paused) {
            try {
              await audio.play()
              console.log('✅ 오디오 재생 시작됨 (사용자 상호작용)')
            } catch (error) {
              console.warn('⚠️ 오디오 재생 실패:', error.message)
            }
          }
        }
      }
      
      setNeedsUserInteraction(false)
      setErrorMessage('') // 에러 메시지 클리어
    } catch (error) {
      console.error('사용자 상호작용 처리 실패:', error)
    }
  }

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
      // 오디오 컨텍스트 정리
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [roomId, myUserInfo])

  const joinSession = async (currentRoomId) => {
    console.log('🎯 joinSession 시작 - roomId:', currentRoomId)

    try {
      setConnectionStatus('connecting')
      setErrorMessage('')

      const accessToken = useAuthStore.getState().accessToken

      if (!accessToken) {
        const error = '로그인이 필요합니다. 다시 로그인해주세요.'
        console.error(error)
        setConnectionStatus('error')
        setErrorMessage(error)
        return
      }

      console.log('📞 백엔드 서버에 OpenVidu 토큰 요청 중...')
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

        let errorMsg = '음성 채팅 연결에 실패했습니다.'
        if (response.status === 404) {
          errorMsg = '음성 채팅방을 찾을 수 없습니다.'
        } else if (response.status === 403) {
          errorMsg = '음성 채팅 참여 권한이 없습니다.'
        } else if (response.status === 500) {
          errorMsg = 'OpenVidu 서버에 문제가 있습니다. 관리자에게 문의하세요.'
        }

        setConnectionStatus('error')
        setErrorMessage(errorMsg)
        return
      }

      const responseData = await response.json()
      const { openviduToken } = responseData

      if (!openviduToken) {
        const error = 'OpenVidu 토큰을 받지 못했습니다.'
        console.error(error)
        setConnectionStatus('error')
        setErrorMessage(error)
        return
      }

      console.log('✅ OpenVidu 토큰 받음')

      const ov = new OpenVidu({
          wsUrl: 'wss://i13c108.p.ssafy.io:9001'
      })
      
      const mySession = ov.initSession()

      // 세션 이벤트 리스너들 설정
      setupSessionEventListeners(mySession)

      setSession(mySession)

      // 연결 데이터 준비
      const connectionData = {
        username: myUserInfo.username,
        userId: myUserInfo.id,
        isOwner: isOwner,
      }

      console.log('🔗 보낼 연결 데이터:', connectionData)
      console.log('🔗 JSON 문자열:', JSON.stringify(connectionData))
      console.log('🔗 OpenVidu 세션 연결 시도...')

      // 세션 연결 - 타임아웃 설정
      const connectPromise = mySession.connect(openviduToken, JSON.stringify(connectionData))

      // 10초 타임아웃 설정
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('연결 시간 초과')), 10000)
      })

      await Promise.race([connectPromise, timeoutPromise])

      console.log('✅ OpenVidu 세션 연결 성공!')
      console.log('✅ 내 연결 ID:', mySession.connection.connectionId)

      // 참가자 목록 초기화 - 나만 추가
      setConnectedParticipants([
        {
          connectionId: mySession.connection.connectionId,
          username: myUserInfo.username,
          userId: myUserInfo.id,
          isOwner: isOwner,
          isMe: true,
          hasAudioStream: false,
        },
      ])

      console.log('👤 내 정보가 참가자 목록에 초기화됨:', myUserInfo.username)

      // 기존 연결들 확인 및 추가
      setTimeout(() => {
        const existingConnections = mySession.remoteConnections
        console.log('🔍 기존 연결들 확인:', Object.keys(existingConnections).length)

        if (Object.keys(existingConnections).length > 0) {
          Object.values(existingConnections).forEach((connection, index) => {
            console.log(`🔍 기존 연결 ${index + 1}:`, {
              connectionId: connection.connectionId,
              data: connection.data
            })
            
            if (connection.data) {
              try {
                const connectionData = JSON.parse(connection.data)
                console.log('👤 기존 참가자 정보:', connectionData)

                setConnectedParticipants((prev) => {
                  const exists = prev.some((p) => p.connectionId === connection.connectionId)
                  if (!exists) {
                    const newList = [
                      ...prev,
                      {
                        connectionId: connection.connectionId,
                        username: connectionData.username,
                        userId: connectionData.userId,
                        isOwner: connectionData.isOwner || false,
                        isMe: false,
                        hasAudioStream: false,
                      },
                    ]
                    console.log('👤 기존 참가자 추가됨:', connectionData.username)
                    return newList
                  }
                  return prev
                })
              } catch (error) {
                console.error('기존 연결 데이터 파싱 에러:', error)
              }
            }
          })
        }
      }, 1000)

      // 퍼블리셔 생성 및 발행
      console.log('🎤 마이크 퍼블리셔 생성 중...')
      try {
        const myPublisher = await ov.initPublisherAsync(undefined, {
          audioSource: undefined,
          videoSource: false,
          publishAudio: true,
          publishVideo: false,
        })

        await mySession.publish(myPublisher)

        // 내 스트림 발행 후 상태 업데이트
        setConnectedParticipants((prev) => {
          return prev.map((p) => {
            if (p.isMe) {
              return { ...p, hasAudioStream: true }
            }
            return p
          })
        })

        setPublisher(myPublisher)
        setIsSessionJoined(true)
        setConnectionStatus('connected')
        setRetryCount(0)

        console.log('🎉 OpenVidu 연결 완료!')
      } catch (publishError) {
        console.error('퍼블리셔 생성/발행 에러:', publishError)
        setErrorMessage('마이크 접근 권한을 확인해주세요.')
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error('세션 참여 중 오류 발생:', error)

      let errorMsg = '음성 채팅 연결에 실패했습니다.'
      if (error.message.includes('시간 초과')) {
        errorMsg = '연결 시간이 초과되었습니다. 네트워크를 확인해주세요.'
      } else if (error.message.includes('DEVICE_ACCESS_DENIED')) {
        errorMsg = '마이크 접근 권한이 거부되었습니다. 브라우저 설정을 확인해주세요.'
      } else if (error.message.includes('NOT_SUPPORTED')) {
        errorMsg = '브라우저에서 음성 채팅을 지원하지 않습니다.'
      } else if (error.code === 204 || error.message.includes('Media Node')) {
        errorMsg = '음성 서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.'
      } else if (error.code && error.code >= 500) {
        errorMsg = '서버에 문제가 있습니다. 관리자에게 문의하세요.'
      }

      setConnectionStatus('error')
      setErrorMessage(errorMsg)
      setRetryCount((prev) => prev + 1)
    }
  }

  // 세션 이벤트 리스너 설정 함수
  const setupSessionEventListeners = (mySession) => {
    // 연결 생성 이벤트
    mySession.on('connectionCreated', (event) => {
      console.log('🔗 새 연결 생성됨:', event.connection.connectionId)

      if (event.connection.connectionId !== mySession.connection?.connectionId) {
        console.log('👤 다른 사용자 연결됨!')
        
        setConnectedParticipants((prev) => {
          const exists = prev.some((p) => p.connectionId === event.connection.connectionId)
          if (exists) {
            return prev
          }

          return [
            ...prev,
            {
              connectionId: event.connection.connectionId,
              username: `User-${event.connection.connectionId.slice(-6)}`,
              userId: null,
              isOwner: false,
              isMe: false,
              hasAudioStream: false,
            },
          ]
        })
      }
    })

    // 연결 삭제 이벤트
    mySession.on('connectionDestroyed', (event) => {
      console.log('🔌 연결 삭제됨:', event.connection.connectionId)

      setConnectedParticipants((prev) =>
        prev.filter((p) => p.connectionId !== event.connection.connectionId)
      )

      try {
        if (event.connection && event.connection.data) {
          const connectionData = JSON.parse(event.connection.data)
          console.log(`👋 ${connectionData.username}님이 나갔습니다.`)

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

    // 스트림 생성 이벤트 - 자동재생 정책 대응
    mySession.on('streamCreated', async (event) => {
      console.log('📺 새 스트림 생성됨:', event.stream.streamId)

      try {
        const subscriber = mySession.subscribe(event.stream, undefined)
        setSubscribers((prev) => [...prev, subscriber])

        // 오디오 요소 생성 및 설정
        const audio = document.createElement('audio')
        audio.controls = false
        audio.muted = isSpeakerMuted
        audio.playsInline = true // iOS 대응
        audio.autoplay = false // 자동재생 비활성화
        
        // 스트림 연결
        const mediaStream = event.stream.getMediaStream()
        audio.srcObject = mediaStream

        // DOM에 추가
        if (audioContainer.current) {
          audioContainer.current.appendChild(audio)
        }

        // 사용자 상호작용 후 재생 시도
        const playAudio = async () => {
          try {
            if (!needsUserInteraction && !isSpeakerMuted) {
              await audio.play()
              console.log('✅ 오디오 재생 시작됨')
            } else if (needsUserInteraction) {
              console.log('⚠️ 사용자 상호작용 필요 - 음성 활성화 버튼을 클릭해주세요')
              setErrorMessage('음성을 들으려면 "🎵 음성 활성화" 버튼을 클릭해주세요.')
            }
          } catch (error) {
            console.warn('⚠️ 자동 재생 차단됨:', error.message)
            if (error.name === 'NotAllowedError') {
              setNeedsUserInteraction(true)
              setErrorMessage('음성을 들으려면 "🎵 음성 활성화" 버튼을 클릭해주세요.')
            }
          }
        }

        // 재생 시도
        await playAudio()

        // 참가자 스트림 정보 업데이트
        if (event.stream.connection.data) {
          const connectionData = JSON.parse(event.stream.connection.data)

          setConnectedParticipants((prev) => {
            const existingIndex = prev.findIndex(
              (p) => p.connectionId === event.stream.connection.connectionId
            )

            if (existingIndex !== -1) {
              const updated = [...prev]
              updated[existingIndex] = {
                ...updated[existingIndex],
                hasAudioStream: true,
              }
              return updated
            } else {
              return [
                ...prev,
                {
                  connectionId: event.stream.connection.connectionId,
                  username: connectionData.username,
                  userId: connectionData.userId,
                  isOwner: connectionData.isOwner,
                  isMe: false,
                  hasAudioStream: true,
                },
              ]
            }
          })
        }

        console.log('✅ 오디오 스트림 구독 성공')
      } catch (error) {
        console.error('스트림 구독 에러:', error)
      }
    })

    // 스트림 삭제 이벤트
    mySession.on('streamDestroyed', (event) => {
      console.log('🗑️ 스트림 삭제됨:', event.stream.streamId)

      setSubscribers((prev) => prev.filter((sub) => sub.stream.streamId !== event.stream.streamId))

      setConnectedParticipants((prev) =>
        prev.map((p) => {
          if (p.connectionId === event.stream.connection.connectionId) {
            return { ...p, hasAudioStream: false }
          }
          return p
        })
      )

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

    // 세션 연결 해제 이벤트
    mySession.on('sessionDisconnected', (event) => {
      console.log('🔌 세션이 종료되었습니다:', event.reason)
      if (event.reason === 'sessionClosedByServer') {
        alert('방장이 음성 채팅을 종료했습니다.')
      }
      handleSessionEnd()
    })
  }

  // 재시도 함수
  const retryConnection = () => {
    if (retryCount < 3) {
      console.log(`🔄 연결 재시도 중... (${retryCount + 1}/3)`)
      setConnectionStatus('connecting')
      joinSession(roomId)
    } else {
      setErrorMessage('연결에 계속 실패합니다. 페이지를 새로고침하거나 관리자에게 문의하세요.')
    }
  }

  const handleSessionEnd = () => {
    console.log('🧹 세션 정리 시작')

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
    setErrorMessage('')
    setNeedsUserInteraction(true) // 사용자 상호작용 다시 필요
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

  // 스피커 토글 함수 - 자동재생 정책 대응
  const toggleSpeaker = async () => {
    const newMutedState = !isSpeakerMuted
    setIsSpeakerMuted(newMutedState)
    
    const audioElements = audioContainer.current?.querySelectorAll('audio')
    
    if (audioElements) {
      for (const audio of audioElements) {
        audio.muted = newMutedState
        
        // 음소거 해제 시 재생 시도
        if (!newMutedState && audio.paused) {
          try {
            await handleUserInteraction() // 사용자 상호작용 처리
            await audio.play()
            console.log('✅ 오디오 재생 시작됨 (스피커 켜짐)')
          } catch (error) {
            console.warn('⚠️ 오디오 재생 실패:', error.message)
            if (error.name === 'NotAllowedError') {
              setNeedsUserInteraction(true)
              setErrorMessage('음성을 들으려면 "🎵 음성 활성화" 버튼을 클릭해주세요.')
            }
          }
        }
      }
    }
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
        return '연결 실패'
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
                >
                  🚪 나가기
                </button>
              )}

              {isOwner && (
                <>
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
                  >
                    🚪 나가기
                  </button>
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
                  >
                    🛑 세션 종료
                  </button>
                </>
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

        {/* 사용자 상호작용 안내 메시지 */}
        {needsUserInteraction && isSessionJoined && (
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '4px',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: '#92400e',
                marginBottom: '0.5rem',
                fontWeight: '500',
              }}
            >
              🔊 음성을 듣기 위해 아래 버튼을 클릭해주세요.
            </div>
            <button
              onClick={handleUserInteraction}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              🎵 음성 활성화
            </button>
          </div>
        )}

        {/* 에러 메시지 및 재시도 버튼 */}
        {connectionStatus === 'error' && errorMessage && (
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '4px',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: '#dc2626',
                marginBottom: '0.5rem',
              }}
            >
              ❌ {errorMessage}
            </div>
            {retryCount < 3 && (
              <button
                onClick={retryConnection}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                🔄 다시 시도 ({retryCount + 1}/3)
              </button>
            )}
          </div>
        )}
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
              onClick={async () => {
                await handleUserInteraction() // 사용자 상호작용 처리
                toggleSpeaker() // 스피커 토글
              }}
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
                  ? errorMessage || '연결에 실패했습니다.'
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