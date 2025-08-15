import React from 'react'
import Button from '@/components/Button'

const AudioControls = ({ 
  isMicMuted, 
  isSpeakerMuted, 
  toggleMicrophone, 
  toggleSpeaker,
  handleUserInteraction,
  needsUserInteraction,
  colors 
}) => {
  
  const handleSpeakerToggle = async () => {
    // 음성 활성화가 필요한 경우 먼저 실행
    if (needsUserInteraction) {
      await handleUserInteraction()
    }
    // 그 다음 스피커 토글
    toggleSpeaker()
  }

  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
      }}
    >
      <div className="flex gap-2 justify-center">
        <Button
          onClick={toggleMicrophone}
          variant={isMicMuted ? 'danger' : 'success'}
          size="sm"
          className="flex items-center gap-1"
        >
          {isMicMuted ? '🎤❌' : '🎤'} {isMicMuted ? '음소거됨' : '음소거 해제'}
        </Button>

        <Button
          onClick={handleSpeakerToggle}
          variant={isSpeakerMuted ? 'danger' : 'success'}
          size="sm"
          className="flex items-center gap-1"
        >
          {isSpeakerMuted ? '🔇' : '🔊'} {isSpeakerMuted ? '스피커 음소거' : '스피커 켜짐'}
        </Button>
      </div>
    </div>
  )
}

export default AudioControls