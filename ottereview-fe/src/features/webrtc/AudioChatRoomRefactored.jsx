import React, { useEffect, useState } from 'react'

import Button from '@/components/Button'
import { useAuthStore } from '@/features/auth/authStore'
import { useChatStore } from '@/features/chat/chatStore'
import { useUserStore } from '@/store/userStore'

import AudioControls from './components/AudioControls'
import ParticipantList from './components/ParticipantList'
import { useWebRTC } from './hooks/useWebRTC'

const AudioChatRoom = ({ roomId, roomParticipants = [] }) => {
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [myUserInfo, setMyUserInfo] = useState(null)

  // Zustand 스토어 구독
  const user = useUserStore((state) => state.user)
  const rooms = useChatStore((state) => state.rooms)

  // WebRTC 훅 사용
  const {
    session,
    publisher,
    isSessionJoined,
    connectionStatus,
    connectedParticipants,
    errorMessage,
    retryCount,
    audioContainer,
    joinSession,
    leaveSession,
    closeEntireSession: closeSession,
    retryConnection,
  } = useWebRTC(roomId, myUserInfo, isOwner)

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
  }, [roomId, myUserInfo])

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

  const handleCloseEntireSession = async () => {
    await closeSession()
    setShowCloseConfirm(false)
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
            <div className="flex gap-2">
              <Button onClick={leaveSession} variant="secondary" size="sm">
                🚪 나가기
              </Button>

              {isOwner && (
                <Button onClick={() => setShowCloseConfirm(true)} variant="danger" size="sm">
                  🛑 세션 종료
                </Button>
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
              <Button onClick={retryConnection} variant="primary" size="sm">
                🔄 다시 시도 ({retryCount + 1}/3)
              </Button>
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
              <Button onClick={() => setShowCloseConfirm(false)} variant="secondary" size="md">
                취소
              </Button>
              <Button onClick={handleCloseEntireSession} variant="danger" size="md">
                종료
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 컨트롤 버튼들 */}
      {isSessionJoined && (
        <AudioControls
          isMicMuted={isMicMuted}
          isSpeakerMuted={isSpeakerMuted}
          toggleMicrophone={toggleMicrophone}
          toggleSpeaker={toggleSpeaker}
          colors={colors}
        />
      )}

      {/* 참여자 목록 */}
      <ParticipantList
        connectedParticipants={connectedParticipants}
        isSessionJoined={isSessionJoined}
        isMicMuted={isMicMuted}
        colors={colors}
        user={user}
        myUserInfo={myUserInfo}
        connectionStatus={connectionStatus}
        errorMessage={errorMessage}
      />

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
