import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useChatStore } from '@/features/chat/chatStore'

import AudioChatRoom from '@/features/webrtc/AudioChatRoom'
import Chat from '@/features/webrtc/Chat'
import CodeEditor from '@/features/webrtc/CodeEditor'
import Whiteboard from '@/features/webrtc/Whiteboard'

const ChatRoom = () => {
  const { roomId } = useParams()
  const [showWhiteboard, setShowWhiteboard] = useState(false)

  // chatStore에서 채팅방 정보 가져오기
  const rooms = useChatStore((state) => state.rooms)
  const getRoomById = useChatStore((state) => state.getRoomById)

  // 여러 방법으로 방 찾기 시도
  let room = null
  if (getRoomById) {
    room = getRoomById(Number(roomId))
  }

  if (!room) {
    room = rooms.find((r) => r.id === Number(roomId) || r.id === roomId)
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8f9fa',
        position: 'relative',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          zIndex: 10,
          flexShrink: 0, // 헤더가 축소되지 않도록
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>🧪 협업 개발실</h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
              🔒 Room ID: <strong>{roomId}</strong>
              {room && (
                <>
                  <span style={{ margin: '0 1rem' }}>•</span>
                  📝 {room.roomName || `Room ${roomId}`}
                  {room.members?.length > 0 && (
                    <>
                      <span style={{ margin: '0 1rem' }}>•</span>
                      👥 {room.members.join(', ')}
                    </>
                  )}
                </>
              )}
            </p>
          </div>

          {/* 도구 버튼들 */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowWhiteboard(!showWhiteboard)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: showWhiteboard ? '#3b82f6' : 'white',
                color: showWhiteboard ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
            >
              {showWhiteboard ? '📝 코드편집기' : '🎨 화이트보드'}
            </button>
          </div>
        </div>

        {/* 충돌 파일 정보 */}
        {room?.conflictFiles?.length > 0 && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          >
            ⚡ <strong>충돌 파일:</strong> {room.conflictFiles.join(', ')}
          </div>
        )}
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          minHeight: 0, // 중요: flex 컨테이너가 축소될 수 있도록
        }}
      >
        {/* 중앙 메인 영역 - 코드편집기 */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            backgroundColor: 'white',
            margin: '1rem 0 1rem 1rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <div style={{ height: '100%', padding: '1rem' }}>
            <CodeEditor roomId={roomId} />
          </div>
        </div>

        {/* 오른쪽 사이드바 - 채팅 & 음성 */}
        <div
          style={{
            width: '350px',
            display: 'flex',
            flexDirection: 'column',
            margin: '1rem 1rem 1rem 0',
            gap: '1rem',
            minHeight: 0, // 중요: flex 컨테이너가 축소될 수 있도록
            flexShrink: 0, // 사이드바 너비 고정
          }}
        >
          {/* 음성 채팅 - 고정 높이 */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              height: '250px', // 고정 높이로 변경
              flexShrink: 0, // 축소되지 않도록
            }}
          >
            <div
              style={{
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f8f9fa',
                height: '60px', // 헤더 고정 높이
                boxSizing: 'border-box',
                flexShrink: 0,
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>🎤 음성 채팅</h3>
            </div>
            <div
              style={{
                padding: '1rem',
                height: 'calc(100% - 60px)', // 헤더 제외한 나머지 높이
                overflow: 'auto', // 필요시 스크롤
              }}
            >
              <AudioChatRoom roomId={roomId} />
            </div>
          </div>

          {/* 텍스트 채팅 - 나머지 공간 모두 사용 */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              flex: 1, // 남은 공간 모두 사용
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minHeight: 0, // 중요: flex 아이템이 축소될 수 있도록
            }}
          >
            <div
              style={{
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f8f9fa',
                flexShrink: 0, // 헤더가 축소되지 않도록
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>💬 채팅</h3>
            </div>
            {/* Chat 컴포넌트가 모든 공간을 사용할 수 있도록 */}
            <div
              style={{
                flex: 1,
                display: 'flex', // Chat 컴포넌트를 위한 flex 컨테이너
                flexDirection: 'column',
                overflow: 'hidden',
                minHeight: 0, // 중요: 축소 가능하도록
              }}
            >
              <Chat roomId={roomId} />
            </div>
          </div>
        </div>
      </div>

      {/* 화이트보드 전체화면 모달 */}
      {showWhiteboard && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 1000,
            display: 'flex',
            padding: '20px',
            boxSizing: 'border-box',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowWhiteboard(false)
            }
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowWhiteboard(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                zIndex: 10,
                padding: '8px 12px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ✕ 닫기
            </button>

            <div
              style={{
                padding: '20px 20px 15px 20px',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f8f9fa',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  color: '#374151',
                  fontWeight: '600',
                  paddingRight: '100px',
                }}
              >
                🎨 화이트보드 - Room {roomId}
              </h3>
            </div>

            <div
              style={{
                flex: 1,
                position: 'relative',
                overflow: 'auto',
                padding: '10px',
                minHeight: 0,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '600px',
                  position: 'relative',
                }}
              >
                <Whiteboard roomId={roomId} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 디버깅 정보 */}
      {process.env.NODE_ENV === 'development' && !room && (
        <div
          style={{
            position: 'fixed',
            bottom: '1rem',
            left: '1rem',
            padding: '1rem',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            fontSize: '0.875rem',
            maxWidth: '400px',
            zIndex: 30,
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>🐛 디버깅 정보:</p>
          <p style={{ margin: '0 0 0.5rem 0' }}>roomId: {roomId}</p>
          <p style={{ margin: 0 }}>저장된 방 개수: {rooms.length}</p>
        </div>
      )}
    </div>
  )
}

export default ChatRoom
