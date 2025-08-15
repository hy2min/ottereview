import React, { useEffect,useState } from 'react'

import Button from '@/components/Button'
import { useUserStore } from '@/store/userStore'

import { useVoiceChat } from './hooks/useVoiceChat'

const VoiceChat = ({ roomId }) => {
  const [showParticipants, setShowParticipants] = useState(true)
  
  const user = useUserStore(state => state.user)
  const {
    isConnected,
    isConnecting,
    participants,
    error,
    publisher,
    audioContainer,
    joinVoiceChat,
    leaveVoiceChat,
    toggleMicrophone,
  } = useVoiceChat()

  // 자동 연결 (옵션)
  useEffect(() => {
    if (roomId && user && !isConnected && !isConnecting) {
      const username = user.githubUsername || user.username || `User-${user.id}`
      joinVoiceChat(roomId, username)
    }
  }, [roomId, user, isConnected, isConnecting, joinVoiceChat])

  const handleToggleMicrophone = () => {
    toggleMicrophone()
  }

  // publisher 상태에서 직접 파생된 상태 사용
  const isMuted = !publisher?.stream?.audioActive

  const handleJoinVoice = () => {
    if (user) {
      const username = user.githubUsername || user.username || `User-${user.id}`
      joinVoiceChat(roomId, username)
    }
  }

  const getStatusColor = () => {
    if (error) return 'bg-red-100 border-red-300 text-red-700'
    if (isConnected) return 'bg-green-100 border-green-300 text-green-700'
    if (isConnecting) return 'bg-yellow-100 border-yellow-300 text-yellow-700'
    return 'bg-gray-100 border-gray-300 text-gray-700'
  }

  const getStatusIcon = () => {
    if (error) return '🔴'
    if (isConnected) return '🟢'
    if (isConnecting) return '🟡'
    return '⚪'
  }

  const getStatusText = () => {
    if (error) return '연결 실패'
    if (isConnected) return '음성 연결됨'
    if (isConnecting) return '연결 중...'
    return '연결 대기'
  }

  return (
    <div className={`rounded-lg border p-3 ${getStatusColor()}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <span className="font-medium text-sm">{getStatusText()}</span>
        </div>
        
        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className="text-xs text-gray-600 hover:text-gray-800"
        >
          {showParticipants ? '👥 숨기기' : '👥 참여자'}
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          {error}
        </div>
      )}

      {/* 컨트롤 버튼 */}
      <div className="flex gap-2 mb-3">
        {!isConnected && !isConnecting && (
          <Button
            onClick={handleJoinVoice}
            size="sm"
            variant="primary"
            className="flex-1"
          >
            🎤 음성 참여
          </Button>
        )}
        
        {isConnected && (
          <>
            <Button
              onClick={handleToggleMicrophone}
              size="sm"
              variant={isMuted ? "danger" : "primary"}
              className="flex-1"
            >
              {isMuted ? '🔇 음소거됨' : '🎤 말하기'}
            </Button>
            
            <Button
              onClick={leaveVoiceChat}
              size="sm"
              variant="secondary"
            >
              🚪 나가기
            </Button>
          </>
        )}
      </div>

      {/* 참여자 목록 */}
      {showParticipants && isConnected && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600 mb-2">
            참여자 ({participants.length + 1}명)
          </div>
          
          {/* 본인 */}
          <div className="flex items-center justify-between p-2 bg-white bg-opacity-50 rounded text-xs">
            <div className="flex items-center gap-2">
              <span>{user?.githubUsername || user?.username || 'Me'}</span>
              <span className="text-blue-600 font-medium">(나)</span>
            </div>
            <span>{isMuted ? '🔇' : '🎤'}</span>
          </div>
          
          {/* 다른 참여자들 */}
          {participants.map((participant) => (
            <div
              key={participant.connectionId}
              className="flex items-center justify-between p-2 bg-white bg-opacity-30 rounded text-xs"
            >
              <span>{participant.username}</span>
              <span>{participant.hasAudio ? '🎤' : '🔇'}</span>
            </div>
          ))}
          
          {participants.length === 0 && (
            <div className="text-xs text-gray-500 italic p-2">
              다른 참여자가 없습니다
            </div>
          )}
        </div>
      )}
      
      {/* 연결 중 로딩 */}
      {isConnecting && (
        <div className="text-center py-2">
          <div className="text-xs text-gray-600">음성 채팅에 연결하는 중...</div>
        </div>
      )}
      
      {/* 숨겨진 오디오 컨테이너 - useVoiceChat에서 필요 */}
      <div ref={audioContainer} style={{ display: 'none' }}></div>
    </div>
  )
}

export default VoiceChat