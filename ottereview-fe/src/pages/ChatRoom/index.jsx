import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { deleteChatRoom } from '@/features/chat/chatApi'
import { useChatStore } from '@/features/chat/chatStore'
import Chat from '@/features/webrtc/Chat'
import CodeEditor from '@/features/webrtc/CodeEditor'
import VoiceChat from '@/features/webrtc/VoiceChat'
import Whiteboard from '@/features/webrtc/Whiteboard'
import { api } from '@/lib/api'
import { useUserStore } from '@/store/userStore'

const ChatRoom = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [conflictFiles, setConflictFiles] = useState([])
  const [roomInfo, setRoomInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const addRoom = useChatStore((state) => state.addRoom)
  const updateRoom = useChatStore((state) => state.updateRoom)
  const removeRoom = useChatStore((state) => state.removeRoom)
  const rooms = useChatStore((state) => state.rooms)
  const user = useUserStore((state) => state.user)

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

  // 채팅방 삭제 함수
  const handleDeleteRoom = async () => {
    if (!window.confirm('정말로 이 채팅방을 삭제하시겠습니까? 삭제된 채팅방은 복구할 수 없습니다.')) {
      return
    }

    try {
      setIsDeleting(true)
      await deleteChatRoom(roomId)
      
      // 채팅 스토어에서도 제거
      removeRoom(Number(roomId))
      
      // 대시보드로 이동
      navigate('/dashboard')
      
      alert('채팅방이 성공적으로 삭제되었습니다.')
    } catch (error) {
      console.error('❌ 채팅방 삭제 실패:', error)
      alert('채팅방 삭제에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsDeleting(false)
    }
  }

  // 현재 사용자가 채팅방 소유자인지 확인
  const isOwner = roomInfo && user && (
    roomInfo.ownerId === user.id || 
    roomInfo.createdBy === user.id || 
    roomInfo.createdBy === user.username ||
    roomInfo.createdBy === user.login
  )

  return (
    <div className="h-screen flex flex-col theme-bg-tertiary relative">
      {/* 헤더 */}
      <div className="px-2 py-3 md:px-4 border-b theme-border theme-bg-secondary theme-shadow z-10 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="m-0 text-2xl theme-text">🧪 협업 개발실</h2>
            <p className="mt-1 mb-0 text-sm theme-text-secondary">
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
          <div className="flex gap-2">
            <button
              onClick={() => setShowWhiteboard(!showWhiteboard)}
              className={`px-4 py-2 border theme-border rounded-md cursor-pointer text-sm font-medium transition-all duration-200 ${
                showWhiteboard
                  ? 'bg-blue-600 text-white'
                  : 'theme-bg-primary theme-text hover:theme-bg-tertiary'
              }`}
            >
              {showWhiteboard ? '📝 코드편집기' : '🎨 화이트보드'}
            </button>
            
            {/* 채팅방 삭제 버튼 - 소유자만 볼 수 있음 */}
            {isOwner && (
              <button
                onClick={handleDeleteRoom}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white border border-red-600 rounded-md cursor-pointer text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed"
              >
                {isDeleting ? '🗑️ 삭제 중...' : '🗑️ 채팅방 삭제'}
              </button>
            )}
          </div>
        </div>

        {/* 상태 표시 */}
        <div className="mt-3 flex gap-2 flex-wrap">
          {/* 로딩 상태 */}
          {loading && (
            <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900 border border-blue-500 dark:border-blue-400 rounded-md text-sm text-blue-700 dark:text-blue-300">
              🔄 미팅룸 정보 로딩 중...
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className="px-3 py-2 bg-red-100 dark:bg-red-900 border border-red-500 dark:border-red-400 rounded-md text-sm text-red-700 dark:text-red-300">
              ❌ {error}
            </div>
          )}

          {/* 충돌 파일 정보 */}
          {!loading && conflictFiles.length > 0 && (
            <div className="px-3 py-2 bg-yellow-100 dark:bg-yellow-900 border border-yellow-500 dark:border-yellow-400 rounded-md text-sm text-yellow-700 dark:text-yellow-300">
              ⚡ <strong>충돌 파일 ({conflictFiles.length}개):</strong> {conflictFiles.join(', ')}
            </div>
          )}

          {/* 파일 없음 상태 */}
          {!loading && !error && conflictFiles.length === 0 && (
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-400 dark:border-gray-500 rounded-md text-sm text-gray-600 dark:text-gray-300">
              📭 편집할 파일이 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 중앙 메인 영역 - 코드편집기 */}
        <div className="flex-1 relative theme-bg-secondary m-2 ml-2 mr-1 rounded-lg theme-shadow overflow-hidden min-h-0">
          <div className="h-full">
            {!loading && conflictFiles.length > 0 ? (
              <CodeEditor
                conflictFiles={conflictFiles}
                key={`editor-${roomId}-${conflictFiles.join(',')}`}
              />
            ) : (
              <div className="h-full flex items-center justify-center flex-col gap-4 theme-text-secondary text-lg p-8">
                {loading ? (
                  <>
                    <div className="text-4xl">📁</div>
                    <div>미팅룸 정보를 불러오는 중...</div>
                    <div className="text-sm theme-text-muted">
                      미팅룸 API에서 충돌 파일 정보를 가져오고 있습니다.
                    </div>
                  </>
                ) : error ? (
                  <>
                    <div className="text-4xl">❌</div>
                    <div>미팅룸 정보를 불러올 수 없습니다</div>
                    <div className="text-sm theme-text-muted">{error}</div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl">📭</div>
                    <div>편집할 파일이 없습니다</div>
                    <div className="text-sm theme-text-muted">
                      이 미팅룸에는 충돌 파일이 설정되어 있지 않습니다.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽 사이드바 - 채팅 & 음성 */}
        <div className="w-96 flex flex-col m-2 mr-2 ml-1 gap-2 min-h-0 flex-shrink-0">
          {/* 음성 채팅 - 축소된 높이 */}
          <div className="theme-bg-secondary rounded-lg theme-shadow overflow-hidden h-40 flex-shrink-0">
            <div className="px-3 py-2 border-b theme-border theme-bg-primary flex-shrink-0">
              <h3 className="m-0 text-sm font-medium theme-text">🎤 음성 채팅</h3>
            </div>
            <div className="p-2 h-[calc(100%-45px)] overflow-auto">
              <VoiceChat roomId={roomId} />
            </div>
          </div>

          {/* 텍스트 채팅 - 나머지 공간 모두 사용 */}
          <div className="theme-bg-secondary rounded-lg theme-shadow flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="px-3 py-2 border-b theme-border theme-bg-primary flex-shrink-0">
              <h3 className="m-0 text-sm font-medium theme-text">💬 채팅</h3>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <Chat roomId={roomId} />
            </div>
          </div>
        </div>
      </div>

      {/* 화이트보드 모달 - 백그라운드가 보이도록 크기 조정 */}
      {showWhiteboard && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-[1000] flex px-8 py-4 box-border"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowWhiteboard(false)
            }
          }}
        >
          <div className="w-[90%] h-[95%] mx-auto my-auto theme-bg-secondary rounded-xl shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm border-2 theme-border">
            <button
              onClick={() => setShowWhiteboard(false)}
              className="absolute top-4 right-4 z-10 px-3 py-2 bg-red-500 dark:bg-red-600 text-white border-none rounded-md cursor-pointer text-sm font-semibold shadow-md flex items-center gap-1 hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
            >
              ✕ 닫기
            </button>

            <div className="px-4 py-3 border-b theme-border theme-bg-primary">
              <h3 className="m-0 text-lg theme-text font-semibold pr-20">
                🎨 화이트보드 - Room {roomId}
              </h3>
            </div>

            <div className="flex-1 relative overflow-hidden p-1 min-h-0">
              <div className="w-full h-full min-h-[600px] relative">
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
