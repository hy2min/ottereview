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
  const audioContainer = useRef(null)

  const joinSession = async (currentRoomId) => {

    try {
      setConnectionStatus('connecting')
      setErrorMessage('')

      const accessToken = useAuthStore.getState().accessToken

      if (!accessToken) {
        throw new Error('로그인이 필요합니다. 다시 로그인해주세요.')
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
        throw new Error(getErrorMessage(response.status))
      }

      const responseData = await response.json()
      const { openviduToken } = responseData

      if (!openviduToken) {
        throw new Error('OpenVidu 토큰을 받지 못했습니다.')
      }

      const ov = new OpenVidu()
      const mySession = ov.initSession()

      setupSessionEventListeners(mySession)
      setSession(mySession)

      const connectionData = {
        username: myUserInfo.username,
        userId: myUserInfo.id,
        isOwner: isOwner,
      }

      // 세션 연결 (10초 타임아웃)
      const connectPromise = mySession.connect(openviduToken, JSON.stringify(connectionData))
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('연결 시간 초과')), 10000)
      })

      await Promise.race([connectPromise, timeoutPromise])

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

      // 퍼블리셔 생성 및 발행
      const myPublisher = await ov.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: false,
        publishAudio: true,
        publishVideo: false,
      })

      await mySession.publish(myPublisher)

      setConnectedParticipants((prev) =>
        prev.map((p) => (p.isMe ? { ...p, hasAudioStream: true } : p))
      )

      setPublisher(myPublisher)
      setIsSessionJoined(true)
      setConnectionStatus('connected')
      setRetryCount(0)

    } catch (error) {
      setConnectionStatus('error')
      setErrorMessage(getErrorMessage(null, error))
      setRetryCount((prev) => prev + 1)
    }
  }

  const setupSessionEventListeners = (mySession) => {
    // 연결 생성 이벤트
    mySession.on('connectionCreated', (event) => {
      if (event.connection.connectionId !== mySession.connection?.connectionId) {
        setConnectedParticipants((prev) => {
          const exists = prev.some((p) => p.connectionId === event.connection.connectionId)
          if (!exists) {
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
          }
          return prev
        })
      }
    })

    // 연결 삭제 이벤트
    mySession.on('connectionDestroyed', (event) => {
      setConnectedParticipants((prev) =>
        prev.filter((p) => p.connectionId !== event.connection.connectionId)
      )

      try {
        if (event.connection?.data) {
          const connectionData = JSON.parse(event.connection.data)
          if (connectionData.isOwner && !isOwner) {
            setTimeout(() => {
              alert('방장이 나가서 음성 채팅이 종료됩니다.')
              handleSessionEnd()
            }, 1000)
          }
        }
      } catch (error) {
      }
    })

    // 스트림 생성 이벤트
    mySession.on('streamCreated', (event) => {
      try {
        const subscriber = mySession.subscribe(event.stream, undefined)
        setSubscribers((prev) => [...prev, subscriber])

        const audio = document.createElement('audio')
        audio.autoplay = true
        audio.controls = false
        audio.srcObject = event.stream.getMediaStream()

        if (audioContainer.current) {
          audioContainer.current.appendChild(audio)
        }

        // 참가자 스트림 정보 업데이트
        if (event.stream.connection.data) {
          const connectionData = JSON.parse(event.stream.connection.data)
          setConnectedParticipants((prev) => {
            const existingIndex = prev.findIndex(
              (p) => p.connectionId === event.stream.connection.connectionId
            )

            if (existingIndex !== -1) {
              const updated = [...prev]
              updated[existingIndex] = { ...updated[existingIndex], hasAudioStream: true }
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
      } catch (error) {
      }
    })

    // 스트림 삭제 이벤트
    mySession.on('streamDestroyed', (event) => {
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
      if (event.reason === 'sessionClosedByServer') {
        alert('방장이 음성 채팅을 종료했습니다.')
      }
      handleSessionEnd()
    })
  }

  const cleanupAudioElement = (stream) => {
    if (audioContainer.current) {
      const audioElements = audioContainer.current.querySelectorAll('audio')
      audioElements.forEach((audio) => {
        try {
          if (audio.srcObject === stream.getMediaStream()) {
            if (audio.srcObject) {
              audio.srcObject.getTracks().forEach((track) => track.stop())
            }
            audio.remove()
          }
        } catch (error) {
        }
      })
    }
  }

  const handleSessionEnd = () => {
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
  }

  const leaveSession = () => {
    if (session) {
      try {
        session.disconnect()
      } catch (error) {
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
        leaveSession()
        alert('음성 채팅이 종료되었습니다.')
      } else {
        alert('세션 종료에 실패했습니다.')
      }
    } catch (error) {
      alert('세션 종료 중 오류가 발생했습니다.')
    }
  }

  const retryConnection = () => {
    if (retryCount < 3) {
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
    joinSession,
    leaveSession,
    closeEntireSession,
    retryConnection,
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
  } else if (error?.code === 204 || error?.message.includes('Media Node')) {
    return '음성 서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.'
  } else if (error?.code && error.code >= 500) {
    return '서버에 문제가 있습니다. 관리자에게 문의하세요.'
  }

  return error?.message || '음성 채팅 연결에 실패했습니다.'
}