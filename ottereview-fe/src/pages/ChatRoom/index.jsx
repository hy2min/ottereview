import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import AudioChatRoom from '@/features/webrtc/AudioChatRoom'
import Chat from '@/features/webrtc/Chat'
import CodeEditor from '@/features/webrtc/CodeEditor'
import Whiteboard from '@/features/webrtc/Whiteboard'
import { useChatStore } from '@/features/chat/chatStore'
import { api } from '@/lib/api'

const ChatRoom = () => {
  const { roomId } = useParams()
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [conflictFiles, setConflictFiles] = useState([])
  const [roomInfo, setRoomInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const addRoom = useChatStore((state) => state.addRoom)
  const updateRoom = useChatStore((state) => state.updateRoom)
  const rooms = useChatStore((state) => state.rooms)

  // 미팅룸 정보 및 파일 목록 가져오기
  useEffect(() => {
    const fetchMeetingRoom = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log(`📡 미팅룸 ${roomId} 정보 요청 중...`)
        const response = await api.get(`/api/meetings/${roomId}`)

        console.log('📋 미팅룸 API 응답:', response.data)

        // 미팅룸 기본 정보 설정
        if (response.data) {
          const roomData = {
            id: Number(roomId),
            name: response.data.name || response.data.roomName || `Room ${roomId}`,
            createdBy: response.data.createdBy,
            ownerId: response.data.ownerId,
            participants: response.data.participants || [], // 참가자 정보 추가
            // 다른 필요한 정보들도 여기서 설정
          }
          setRoomInfo(roomData)
          
          console.log('👥 미팅룸 참가자 정보:', response.data.participants)
          
          // chatStore에 방 정보 추가/업데이트
          const existingRoom = rooms.find((r) => r.id === Number(roomId))
          if (existingRoom) {
            updateRoom(Number(roomId), roomData)
          } else {
            addRoom(roomData)
          }
        }

        // 파일 목록 추출
        let files = []
        const data = response.data

        if (data) {
          // Case 1: files 배열이 직접 있는 경우
          if (Array.isArray(data.files)) {
            files = extractFileNames(data.files)
          }
          // Case 2: meeting_room_files 배열이 있는 경우 (DB 테이블명 기반)
          else if (Array.isArray(data.meeting_room_files)) {
            files = extractFileNames(data.meeting_room_files)
          }
          // Case 3: meetingRoomFiles 배열이 있는 경우 (camelCase)
          else if (Array.isArray(data.meetingRoomFiles)) {
            files = extractFileNames(data.meetingRoomFiles)
          }
          // Case 4: 중첩된 data 구조인 경우
          else if (data.data && Array.isArray(data.data)) {
            files = extractFileNames(data.data)
          }
          // Case 5: 응답 자체가 배열인 경우
          else if (Array.isArray(data)) {
            files = extractFileNames(data)
          }
        }

        console.log(`✅ 추출된 파일 목록:`, files)
        setConflictFiles(files)

        if (files.length === 0) {
          console.warn('⚠️ 파일 목록이 비어있습니다.')
        }
      } catch (error) {
        console.error('❌ 미팅룸 정보 요청 실패:', error)
        setError('미팅룸 정보를 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (roomId) {
      fetchMeetingRoom()
    }
  }, [roomId])

  // 파일명 추출 헬퍼 함수
  const extractFileNames = (items) => {
    if (!Array.isArray(items)) {
      console.warn('⚠️ extractFileNames: 입력이 배열이 아닙니다:', items)
      return []
    }

    return items
      .map((item, index) => {
        console.log(`📄 Item ${index}:`, item)

        // 문자열인 경우 그대로 반환
        if (typeof item === 'string') {
          return item.trim()
        }

        // 객체인 경우 다양한 속성명 시도
        if (typeof item === 'object' && item !== null) {
          const fileName = item.file_name || item.fileName || item.filename || item.name || null

          console.log(`📄 객체에서 추출된 파일명:`, fileName)
          return fileName
        }

        console.log(`📄 처리할 수 없는 항목:`, item)
        return null
      })
      .filter((fileName) => fileName && typeof fileName === 'string' && fileName.trim() !== '')
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
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>🧪 협업 개발실</h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
              🔒 Room ID: <strong>{roomId}</strong>
              {roomInfo && (
                <>
                  <span style={{ margin: '0 1rem' }}>•</span>
                  📝 {roomInfo.name}
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

        {/* 상태 표시 */}
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* 로딩 상태 */}
          {loading && (
            <div
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#dbeafe',
                border: '1px solid #3b82f6',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#1e40af',
              }}
            >
              🔄 미팅룸 정보 로딩 중...
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#dc2626',
              }}
            >
              ❌ {error}
            </div>
          )}

          {/* 충돌 파일 정보 */}
          {!loading && conflictFiles.length > 0 && (
            <div
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
            >
              ⚡ <strong>충돌 파일 ({conflictFiles.length}개):</strong> {conflictFiles.join(', ')}
            </div>
          )}

          {/* 파일 없음 상태 */}
          {!loading && !error && conflictFiles.length === 0 && (
            <div
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #9ca3af',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#6b7280',
              }}
            >
              📭 편집할 파일이 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          minHeight: 0,
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
          <div style={{ height: '100%' }}>
            {!loading && conflictFiles.length > 0 ? (
              <CodeEditor
                conflictFiles={conflictFiles}
                key={`editor-${roomId}-${conflictFiles.join(',')}`}
              />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '1rem',
                  color: '#6b7280',
                  fontSize: '1.125rem',
                  padding: '2rem',
                }}
              >
                {loading ? (
                  <>
                    <div style={{ fontSize: '2rem' }}>📁</div>
                    <div>미팅룸 정보를 불러오는 중...</div>
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                      미팅룸 API에서 충돌 파일 정보를 가져오고 있습니다.
                    </div>
                  </>
                ) : error ? (
                  <>
                    <div style={{ fontSize: '2rem' }}>❌</div>
                    <div>미팅룸 정보를 불러올 수 없습니다</div>
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{error}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '2rem' }}>📭</div>
                    <div>편집할 파일이 없습니다</div>
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                      이 미팅룸에는 충돌 파일이 설정되어 있지 않습니다.
                    </div>
                  </>
                )}
              </div>
            )}
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
            minHeight: 0,
            flexShrink: 0,
          }}
        >
          {/* 음성 채팅 - 고정 높이 */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              height: '250px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f8f9fa',
                height: '60px',
                boxSizing: 'border-box',
                flexShrink: 0,
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>🎤 음성 채팅</h3>
            </div>
            <div
              style={{
                padding: '1rem',
                height: 'calc(100% - 60px)',
                overflow: 'auto',
              }}
            >
              {console.log('🎯 AudioChatRoom 렌더링 직전, roomId:', roomId)}
              <AudioChatRoom roomId={roomId} roomParticipants={roomInfo?.participants || []} />
              {console.log('🎯 AudioChatRoom 렌더링 직후')}
            </div>
          </div>

          {/* 텍스트 채팅 - 나머지 공간 모두 사용 */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            <div
              style={{
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f8f9fa',
                flexShrink: 0,
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>💬 채팅</h3>
            </div>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minHeight: 0,
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
    </div>
  )
}

export default ChatRoom
