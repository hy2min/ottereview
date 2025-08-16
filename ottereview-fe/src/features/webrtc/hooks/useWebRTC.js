import { OpenVidu } from 'openvidu-browser'
import { useEffect,useRef, useState } from 'react'

import { useAuthStore } from '@/features/auth/authStore'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const useWebRTC = (roomId, myUserInfo, isOwner) => {
  const [session, setSession] = useState(undefined)
  const [publisher, setPublisher] = useState(undefined)
  const [isSessionJoined, setIsSessionJoined] = useState(false)
  const [subscribers, setSubscribers] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [connectedParticipants, setConnectedParticipants] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [needsUserInteraction, setNeedsUserInteraction] = useState(true)
  const [audioContextInitialized, setAudioContextInitialized] = useState(false)
  const audioContainer = useRef(null)

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (session) {
        console.log('🧹 컴포넌트 언마운트 - 세션 정리')
        try {
          session.disconnect()
        } catch (error) {
          console.warn('세션 정리 중 오류:', error)
        }
      }
    }
  }, [session])

  // 사용자 상호작용 처리 (OpenVidu 2.x 호환)
  const handleUserInteraction = async () => {
    try {
      console.log('👆 사용자 상호작용 감지됨')
      
      // AudioContext 초기화 (브라우저 자동재생 정책 대응)
      if (!audioContextInitialized) {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext
          if (AudioContext) {
            const audioContext = new AudioContext()
            if (audioContext.state === 'suspended') {
              await audioContext.resume()
            }
            setAudioContextInitialized(true)
            console.log('✅ 오디오 컨텍스트 초기화됨:', audioContext.state)
          }
        } catch (error) {
          console.warn('오디오 컨텍스트 초기화 실패:', error)
        }
      }
      
      // 기존 오디오 요소들 재생 시도
      const audioElements = audioContainer.current?.querySelectorAll('audio')
      if (audioElements && audioElements.length > 0) {
        console.log(`🔊 ${audioElements.length}개의 오디오 요소 재생 시도`)
        
        for (const audio of audioElements) {
          if (audio.paused) {
            try {
              await audio.play()
              console.log('✅ 기존 오디오 재생 시작됨')
            } catch (error) {
              console.warn('⚠️ 기존 오디오 재생 실패:', error.message)
            }
          }
        }
      } else {
        console.log('📭 재생할 오디오 요소가 없음')
      }
      
      setNeedsUserInteraction(false)
      setErrorMessage('')
    } catch (error) {
      console.error('사용자 상호작용 처리 실패:', error)
    }
  }

  const joinSession = async (currentRoomId) => {
    console.log('🎯 joinSession 시작 - roomId:', currentRoomId)

    try {
      setConnectionStatus('connecting')
      setErrorMessage('')

      const accessToken = useAuthStore.getState().accessToken

      if (!accessToken) {
        throw new Error('로그인이 필요합니다. 다시 로그인해주세요.')
      }

      // 백엔드에서 OpenVidu 토큰 받기
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
        throw new Error(getErrorMessage(response.status))
      }

      const responseData = await response.json()
      const { openviduToken } = responseData

      if (!openviduToken) {
        throw new Error('OpenVidu 토큰을 받지 못했습니다.')
      }

      console.log('✅ OpenVidu 토큰 받음')

      // OpenVidu 2.x 방식 초기화
      const ov = new OpenVidu()
      const mySession = ov.initSession()

      setupSessionEventListeners(mySession)
      setSession(mySession)

      const connectionData = {
        username: myUserInfo.username,
        userId: myUserInfo.id,
        isOwner: isOwner,
        timestamp: Date.now(),
      }

      console.log('🔗 보낼 연결 데이터:', connectionData)

      // 연결 재시도 로직
      const connectWithRetry = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            console.log(`🔗 OpenVidu 세션 연결 시도... (${i + 1}/${retries})`)
            
            // OpenVidu 2.x에서는 connect 메서드 사용
            await mySession.connect(openviduToken, JSON.stringify(connectionData))
            console.log('✅ OpenVidu 세션 연결 성공!')
            break
          } catch (error) {
            console.warn(`⚠️ 연결 시도 ${i + 1} 실패:`, error.message)
            if (i === retries - 1) {
              throw error
            }
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }

      await connectWithRetry()

      console.log('✅ 내 연결 ID:', mySession.connection.connectionId)

      // 참가자 목록 초기화
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

      // 기존 연결들 확인 (OpenVidu 2.x)
      setTimeout(() => {
        try {
          const existingConnections = mySession.remoteConnections
          console.log('🔍 기존 연결들 확인:', Object.keys(existingConnections).length)

          Object.values(existingConnections).forEach((connection) => {
            if (connection && connection.data) {
              try {
                const connectionData = JSON.parse(connection.data)
                console.log('👤 기존 참가자 정보:', connectionData)

                setConnectedParticipants((prev) => {
                  const exists = prev.some((p) => p.connectionId === connection.connectionId)
                  if (!exists) {
                    return [
                      ...prev,
                      {
                        connectionId: connection.connectionId,
                        username: connectionData.username || `User-${connection.connectionId.slice(-6)}`,
                        userId: connectionData.userId,
                        isOwner: connectionData.isOwner || false,
                        isMe: false,
                        hasAudioStream: false,
                      },
                    ]
                  }
                  return prev
                })
              } catch (parseError) {
                console.error('기존 연결 데이터 파싱 에러:', parseError)
              }
            }
          })
        } catch (error) {
          console.error('기존 연결 확인 중 오류:', error)
        }
      }, 2000)

      // 퍼블리셔 생성 및 발행 (OpenVidu 2.x)
      console.log('🎤 마이크 퍼블리셔 생성 중...')
      try {
        // OpenVidu 2.x에서는 initPublisher 사용
        const myPublisher = ov.initPublisher(undefined, {
          audioSource: undefined,
          videoSource: false,
          publishAudio: true,
          publishVideo: false,
          insertMode: 'APPEND',
          mirror: false,
        })

        // 퍼블리셔가 준비되면 발행
        myPublisher.on('accessAllowed', () => {
          console.log('✅ 마이크 접근 허용됨')
        })

        myPublisher.on('accessDenied', () => {
          console.error('❌ 마이크 접근 거부됨')
          setErrorMessage('마이크 접근 권한을 확인해주세요.')
          setConnectionStatus('error')
        })

        await mySession.publish(myPublisher)

        setConnectedParticipants((prev) =>
          prev.map((p) => (p.isMe ? { ...p, hasAudioStream: true } : p))
        )

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
      setConnectionStatus('error')
      setErrorMessage(getErrorMessage(null, error))
      setRetryCount((prev) => prev + 1)
    }
  }

  const setupSessionEventListeners = (mySession) => {
    // 연결 생성 이벤트
    mySession.on('connectionCreated', (event) => {
      console.log('🔗 새 연결 생성됨:', event.connection?.connectionId)

      if (event.connection?.connectionId !== mySession.connection?.connectionId) {
        console.log('👤 다른 사용자 연결됨!')
        
        setConnectedParticipants((prev) => {
          const exists = prev.some((p) => p.connectionId === event.connection.connectionId)
          if (!exists) {
            // 연결 데이터 안전하게 파싱
            let username = `User-${event.connection.connectionId.slice(-6)}`
            let userId = null
            let isOwnerFlag = false

            if (event.connection.data) {
              try {
                const connectionData = JSON.parse(event.connection.data)
                username = connectionData.username || username
                userId = connectionData.userId
                isOwnerFlag = connectionData.isOwner || false
              } catch (error) {
                console.warn('연결 데이터 파싱 실패:', error)
              }
            }

            return [
              ...prev,
              {
                connectionId: event.connection.connectionId,
                username,
                userId,
                isOwner: isOwnerFlag,
                isMe: false,
                hasAudioStream: false,
              },
            ]
          }
          return prev
        })
      }
    })

    // 연결 삭제 이벤트
    mySession.on('connectionDestroyed', (event) => {
      console.log('🔌 연결 삭제됨:', event.connection?.connectionId)

      if (event.connection?.connectionId) {
        setConnectedParticipants((prev) =>
          prev.filter((p) => p.connectionId !== event.connection.connectionId)
        )

        try {
          if (event.connection.data) {
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
      }
    })

    // 스트림 생성 이벤트 (OpenVidu 2.x 호환)
    mySession.on('streamCreated', async (event) => {
      console.log('📺 새 스트림 생성됨:', event.stream.streamId)

      try {
        // OpenVidu 2.x에서 스트림 유효성 검사
        if (!event.stream) {
          console.warn('⚠️ 스트림 객체가 없음')
          return
        }

        // 잠시 대기 후 MediaStream 확인 (OpenVidu 2.x에서는 초기화 시간이 필요할 수 있음)
        await new Promise(resolve => setTimeout(resolve, 300))

        let mediaStream
        try {
          mediaStream = event.stream.getMediaStream()
        } catch (error) {
          console.warn('⚠️ MediaStream 가져오기 실패:', error)
          return
        }

        if (!mediaStream) {
          console.warn('⚠️ MediaStream이 준비되지 않음')
          return
        }

        const audioTracks = mediaStream.getAudioTracks()
        if (audioTracks.length === 0) {
          console.warn('⚠️ 오디오 트랙이 없음')
          return
        }

        console.log('✅ 유효한 스트림 확인됨:', {
          streamId: event.stream.streamId,
          connectionId: event.stream.connection.connectionId,
          audioTracks: audioTracks.length
        })

        // OpenVidu 2.x 구독 방식
        const subscriber = mySession.subscribe(event.stream, undefined)
        setSubscribers((prev) => [...prev, subscriber])

        // 오디오 요소 생성 및 설정
        const audio = document.createElement('audio')
        audio.controls = false
        audio.playsInline = true
        audio.autoplay = false // 자동재생 비활성화
        audio.muted = false // 기본적으로 음소거 해제
        
        // MediaStream 연결
        audio.srcObject = mediaStream

        if (audioContainer.current) {
          audioContainer.current.appendChild(audio)
        }

        // 사용자 상호작용이 있었다면 바로 재생 시도
        if (!needsUserInteraction) {
          try {
            await audio.play()
            console.log('✅ 오디오 재생 시작됨 (자동)')
          } catch (error) {
            console.warn('⚠️ 자동 재생 차단됨:', error.message)
            if (error.name === 'NotAllowedError') {
              setNeedsUserInteraction(true)
              setErrorMessage('음성을 들으려면 "🎵 음성 활성화" 버튼을 클릭해주세요.')
            }
          }
        } else {
          console.log('⚠️ 사용자 상호작용 필요 - 재생 대기 중')
          setErrorMessage('음성을 들으려면 "🎵 음성 활성화" 버튼을 클릭해주세요.')
        }

        // 참가자 스트림 정보 업데이트
        if (event.stream.connection?.data) {
          try {
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
                  username: connectionData.username || updated[existingIndex].username
                }
                return updated
              } else {
                return [
                  ...prev,
                  {
                    connectionId: event.stream.connection.connectionId,
                    username: connectionData.username || `User-${event.stream.connection.connectionId.slice(-6)}`,
                    userId: connectionData.userId,
                    isOwner: connectionData.isOwner || false,
                    isMe: false,
                    hasAudioStream: true,
                  },
                ]
              }
            })

            console.log('✅ 참가자 정보 업데이트됨:', {
              username: connectionData.username,
              connectionId: event.stream.connection.connectionId
            })
          } catch (error) {
            console.error('스트림 연결 데이터 파싱 에러:', error)
          }
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
        prev.map((p) =>
          p.connectionId === event.stream.connection.connectionId
            ? { ...p, hasAudioStream: false }
            : p
        )
      )

      cleanupAudioElement(event.stream)
    })

    // 세션 연결 해제 이벤트
    mySession.on('sessionDisconnected', (event) => {
      console.log('🔌 세션이 종료되었습니다:', event.reason)
      
      if (event.reason === 'sessionClosedByServer') {
        alert('방장이 음성 채팅을 종료했습니다.')
      } else if (event.reason === 'networkDisconnect') {
        alert('네트워크 연결이 끊어져 음성 채팅이 종료되었습니다.')
      }
      handleSessionEnd()
    })

    // 예외 이벤트 처리
    mySession.on('exception', (event) => {
      console.error('🚨 OpenVidu 세션 에러:', event)
      setErrorMessage('음성 채팅 중 오류가 발생했습니다.')
    })
  }

  const cleanupAudioElement = (stream) => {
    if (audioContainer.current) {
      const audioElements = audioContainer.current.querySelectorAll('audio')
      audioElements.forEach((audio) => {
        try {
          if (audio.srcObject === stream.getMediaStream()) {
            if (audio.srcObject) {
              audio.srcObject.getTracks().forEach((track) => {
                try {
                  track.stop()
                } catch (trackError) {
                  console.warn('트랙 정지 실패:', trackError)
                }
              })
            }
            audio.remove()
          }
        } catch (error) {
          console.error('오디오 정리 에러:', error)
        }
      })
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
            audio.srcObject.getTracks().forEach((track) => {
              try {
                track.stop()
              } catch (trackError) {
                console.warn('트랙 정지 실패:', trackError)
              }
            })
          }
          audio.remove()
        } catch (error) {
          console.error('오디오 정리 에러:', error)
        }
      })
      audioContainer.current.innerHTML = ''
    }

    // 퍼블리셔 정리
    if (publisher) {
      try {
        const stream = publisher.stream
        if (stream && stream.getMediaStream) {
          stream.getMediaStream().getTracks().forEach((track) => {
            try {
              track.stop()
            } catch (trackError) {
              console.warn('퍼블리셔 트랙 정지 실패:', trackError)
            }
          })
        }
      } catch (error) {
        console.warn('퍼블리셔 정리 실패:', error)
      }
    }

    setSession(undefined)
    setPublisher(undefined)
    setIsSessionJoined(false)
    setSubscribers([])
    setConnectionStatus('connecting')
    setErrorMessage('')
    setNeedsUserInteraction(true)
    setAudioContextInitialized(false)
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
  }

  const retryConnection = () => {
    if (retryCount < 3) {
      console.log(`🔄 연결 재시도 중... (${retryCount + 1}/3)`)
      setConnectionStatus('connecting')
      joinSession(roomId)
    } else {
      setErrorMessage('연결에 계속 실패합니다. 페이지를 새로고침하거나 관리자에게 문의하세요.')
    }
  }

  return {
    session,
    publisher,
    isSessionJoined,
    subscribers,
    connectionStatus,
    connectedParticipants,
    errorMessage,
    retryCount,
    audioContainer,
    needsUserInteraction,
    joinSession,
    leaveSession,
    closeEntireSession,
    retryConnection,
    handleUserInteraction,
  }
}

const getErrorMessage = (status, error) => {
  if (status) {
    switch (status) {
      case 404:
        return '음성 채팅방을 찾을 수 없습니다.'
      case 403:
        return '음성 채팅 참여 권한이 없습니다.'
      case 500:
        return 'OpenVidu 서버에 문제가 있습니다. 관리자에게 문의하세요.'
      default:
        return '음성 채팅 연결에 실패했습니다.'
    }
  }

  if (error?.message.includes('시간 초과')) {
    return '연결 시간이 초과되었습니다. 네트워크를 확인해주세요.'
  } else if (error?.message.includes('DEVICE_ACCESS_DENIED')) {
    return '마이크 접근 권한이 거부되었습니다. 브라우저 설정을 확인해주세요.'
  } else if (error?.message.includes('NOT_SUPPORTED')) {
    return '브라우저에서 음성 채팅을 지원하지 않습니다.'
  }

  return error?.message || '음성 채팅 연결에 실패했습니다.'
}