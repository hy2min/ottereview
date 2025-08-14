import React from 'react'

const ParticipantList = ({ 
  connectedParticipants, 
  isSessionJoined, 
  isMicMuted, 
  colors, 
  user, 
  myUserInfo, 
  connectionStatus, 
  errorMessage 
}) => {
  return (
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
          {connectedParticipants.map((participant) => (
            <ParticipantItem
              key={participant.connectionId}
              participant={participant}
              isMicMuted={isMicMuted}
            />
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
  )
}

const ParticipantItem = ({ participant, isMicMuted }) => {
  return (
    <div
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
      />
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
  )
}

export default ParticipantList