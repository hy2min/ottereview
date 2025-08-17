import { OpenVidu } from 'openvidu-browser'
import { useCallback, useEffect,useRef, useState } from 'react'

import { api } from '@/lib/api'

export const useVoiceChat = () => {
  const [session, setSession] = useState(undefined)
  const [publisher, setPublisher] = useState(undefined)
  const [subscribers, setSubscribers] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [participants, setParticipants] = useState([])
  const [error, setError] = useState('')
  
  const OV = useRef(null)
  const audioContainer = useRef(null)

  // 컴포넌트 언마운트 및 페이지 종료 처리
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session) {
        try {
          session.disconnect()
        } catch (error) {
        }
      }
    }

    // beforeunload만 사용 (페이지 새로고침/닫기만 감지)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (session) {
        try {
          session.disconnect()
        } catch (error) {
        }
      }
      
      // 이벤트 리스너 제거
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [session])

  const joinVoiceChat = useCallback(async (roomId, username) => {
    if (isConnecting || isConnected) return

    try {
      setIsConnecting(true)
      setError('')
      
      // OpenVidu 객체 생성
      OV.current = new OpenVidu()
      const mySession = OV.current.initSession()

      // 세션 이벤트 리스너 설정
      setupSessionEvents(mySession)
      setSession(mySession)

      // 토큰 요청 (간소화된 버전)
      const token = await getVoiceChatToken(roomId)
      
      // 세션 연결 (username을 clientData로 전달)
      await mySession.connect(token, { clientData: username })

      // 오디오 전용 퍼블리셔 생성
      const audioPublisher = await OV.current.initPublisherAsync(undefined, {
        audioSource: undefined, // 기본 마이크
        videoSource: false, // 비디오 비활성화
        publishAudio: true,
        publishVideo: false,
        insertMode: 'APPEND',
      })

      // 퍼블리셔 발행
      mySession.publish(audioPublisher)
      setPublisher(audioPublisher)
      setIsConnected(true)

    } catch (error) {
      setError(getErrorMessage(error))
      await leaveVoiceChat()
    } finally {
      setIsConnecting(false)
    }
  }, [isConnecting, isConnected])

  const leaveVoiceChat = useCallback(async () => {
    
    if (session) {
      session.disconnect()
    }

    // 상태 초기화
    setSession(undefined)
    setPublisher(undefined)
    setSubscribers([])
    setIsConnected(false)
    setIsConnecting(false)
    setParticipants([])
    setError('')
    OV.current = null
  }, [session])

  const toggleMicrophone = useCallback(() => {
    if (publisher) {
      const currentState = publisher.stream.audioActive
      publisher.publishAudio(!currentState)
    }
  }, [publisher])

  const setupSessionEvents = (mySession) => {
    // 새로운 스트림이 생성될 때
    mySession.on('streamCreated', (event) => {
      
      // 스트림 구독
      const subscriber = mySession.subscribe(event.stream, undefined)
      setSubscribers(prev => [...prev, subscriber])
      
      // 참여자 목록 업데이트
      const participantData = JSON.parse(event.stream.connection.data)
      setParticipants(prev => [
        ...prev,
        {
          connectionId: event.stream.connection.connectionId,
          username: participantData.clientData,
          hasAudio: event.stream.audioActive
        }
      ])
    })

    // 스트림이 삭제될 때
    mySession.on('streamDestroyed', (event) => {
      
      // 구독자 목록에서 제거
      setSubscribers(prev => 
        prev.filter(sub => sub.stream.streamId !== event.stream.streamId)
      )
      
      // 참여자 목록에서 제거
      setParticipants(prev => 
        prev.filter(p => p.connectionId !== event.stream.connection.connectionId)
      )
    })

    // 연결이 생성될 때
    mySession.on('connectionCreated', (event) => {
    })

    // 연결이 삭제될 때
    mySession.on('connectionDestroyed', (event) => {
    })

    // 세션 연결 해제
    mySession.on('sessionDisconnected', (event) => {
      if (event.reason === 'networkDisconnect') {
        setError('네트워크 연결이 끊어졌습니다.')
      }
    })

    // 예외 처리
    mySession.on('exception', (exception) => {
      setError(getErrorMessage(exception))
    })
  }

  // 간소화된 토큰 요청 (chatroom 전용)
  const getVoiceChatToken = async (roomId) => {
    try {
      // 공통 api 인스턴스 사용 - 인증 토큰 자동 추가됨
      const response = await api.post(`/api/meetings/${roomId}/join`)
      return response.data.openviduToken
    } catch (error) {
      throw new Error('음성 채팅 토큰 요청에 실패했습니다.')
    }
  }

  return {
    // 상태
    isConnected,
    isConnecting,
    participants,
    error,
    publisher,
    subscribers,
    audioContainer,
    
    // 액션
    joinVoiceChat,
    leaveVoiceChat,
    toggleMicrophone,
  }
}

const getErrorMessage = (error) => {
  if (error?.code === 'DEVICE_ACCESS_DENIED') {
    return '마이크 접근 권한이 거부되었습니다. 브라우저 설정을 확인해주세요.'
  }
  if (error?.message?.includes('Network')) {
    return '네트워크 연결을 확인해주세요.'
  }
  return error?.message || '음성 채팅 연결에 실패했습니다.'
}