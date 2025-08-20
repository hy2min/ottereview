import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useModalContext } from '@/components/ModalProvider'
import { deleteChatRoom } from '@/features/chat/chatApi'
import { useChatStore } from '@/features/chat/chatStore'
import Chat from '@/features/webrtc/Chat'
import CodeEditor from '@/features/webrtc/CodeEditor'
import Whiteboard from '@/features/webrtc/Whiteboard'
import { api } from '@/lib/api'
import { useUserStore } from '@/store/userStore'

const ChatRoom = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('code') // 'code' or 'whiteboard'
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
  const { success, error: showError, confirmDelete } = useModalContext()

  // 미팅룸 정보 및 파일 목록 가져오기
  useEffect(() => {
    const fetchMeetingRoom = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get(`/api/meetings/${roomId}`)

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

        setConflictFiles(files)

        if (files.length === 0) {
        }
      } catch (error) {
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
      return []
    }

    return items
      .map((item, index) => {
        // 문자열인 경우 그대로 반환
        if (typeof item === 'string') {
          return item.trim()
        }

        // 객체인 경우 다양한 속성명 시도
        if (typeof item === 'object' && item !== null) {
          const fileName = item.file_name || item.fileName || item.filename || item.name || null

          return fileName
        }

        return null
      })
      .filter((fileName) => fileName && typeof fileName === 'string' && fileName.trim() !== '')
  }

  // 채팅방 삭제 함수
  const handleDeleteRoom = async () => {
    const confirmed = await confirmDelete(
      '정말로 이 채팅방을 삭제하시겠습니까?\n삭제된 채팅방은 복구할 수 없습니다.',
      '채팅방 삭제'
    )
    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)
      await deleteChatRoom(roomId)

      // 채팅 스토어에서도 제거
      removeRoom(Number(roomId))

      // 대시보드로 이동
      navigate('/dashboard')

      success('채팅방이 성공적으로 삭제되었습니다.')
    } catch (error) {
      showError('채팅방 삭제에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsDeleting(false)
    }
  }

  // 현재 사용자가 채팅방 소유자인지 확인
  const isOwner =
    roomInfo &&
    user &&
    (roomInfo.ownerId === user.id ||
      roomInfo.createdBy === user.id ||
      roomInfo.createdBy === user.username ||
      roomInfo.createdBy === user.login)

  return (
    <div className="h-screen flex flex-col theme-bg-tertiary relative">
      {/* 헤더 */}
      <div className="px-2 py-3 md:px-4 border-b theme-border theme-bg-secondary theme-shadow z-10 flex-shrink-0">
        {/* 상단: 제목과 관리 버튼 */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="m-0 text-2xl theme-text font-bold">🚀 실시간 협업 워크스페이스</h2>
            <p className="mt-1 mb-0 text-sm theme-text-secondary">
              <span className="inline-flex items-center gap-2">
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-md text-xs font-medium">
                  Room {roomId}
                </span>
                {roomInfo && <span className="text-orange-600 font-medium">• {roomInfo.name}</span>}
              </span>
            </p>
          </div>

          {/* 채팅방 관리 버튼 - 소유자만 볼 수 있음 */}
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

        {/* 하단: 탭 전환 및 상태 정보 */}
        <div className="flex justify-between items-center">
          {/* 탭 전환 버튼들 */}
          <div className="flex bg-orange-50 dark:bg-orange-900/20 rounded-xl p-1.5 border border-orange-200 dark:border-orange-700">
            <button
              onClick={() => setActiveTab('code')}
              className={`px-5 py-2.5 rounded-lg cursor-pointer text-sm font-medium transition-all duration-200 ${
                activeTab === 'code'
                  ? 'bg-orange-600 text-white shadow-lg hover:bg-orange-700'
                  : 'text-slate-900 hover:bg-orange-100 dark:hover:bg-orange-800/50'
              }`}
            >
              📝 코드편집기
            </button>
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`px-5 py-2.5 rounded-lg cursor-pointer text-sm font-medium transition-all duration-200 ${
                activeTab === 'whiteboard'
                  ? 'bg-orange-600 text-white shadow-lg hover:bg-orange-700'
                  : 'text-slate-900 hover:bg-orange-100 dark:hover:bg-orange-800/50'
              }`}
            >
              🎨 화이트보드
            </button>
          </div>

          {/* 상태 표시 영역 */}
          <div className="flex gap-2 items-center">
            {/* 활성 사용자 수 등 추가 정보 표시 가능 */}
            <div className="text-xs theme-text-secondary">
              {activeTab === 'code' ? '코드 협업 모드' : '화이트보드 협업 모드'}
            </div>
          </div>
        </div>

        {/* 상태 표시 */}
        <div className="mt-3 flex gap-2 flex-wrap">
          {/* 로딩 상태 */}
          {loading && (
            <div className="px-3 py-2 bg-orange-100 dark:bg-orange-900 border border-orange-500 dark:border-orange-400 rounded-md text-sm text-orange-700 dark:text-orange-300">
              🔄 워크스페이스 로딩 중...
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className="px-3 py-2 bg-red-100 dark:bg-red-900 border border-red-500 dark:border-red-400 rounded-md text-sm text-red-700 dark:text-red-300">
              ❌ {error}
            </div>
          )}

          {/* 충돌 파일 정보 */}
          {/* {!loading && conflictFiles.length > 0 && (
            <div className="px-3 py-2 bg-yellow-100 dark:bg-yellow-900 border border-yellow-500 dark:border-yellow-400 rounded-md text-sm text-yellow-700 dark:text-yellow-300">
              ⚡ <strong>충돌 파일 ({conflictFiles.length}개):</strong> {conflictFiles.join(', ')}
            </div>
          )} */}

          {/* 파일 없음 상태 */}
          {!loading && !error && conflictFiles.length === 0 && (
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-400 dark:border-gray-500 rounded-md text-sm theme-text-secondary">
              📭 편집할 파일이 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 좌측 메인 영역 - 코드편집기/화이트보드 전환 */}
        <div className="flex-1 relative theme-bg-secondary m-2 ml-2 mr-1 rounded-lg theme-shadow overflow-hidden min-h-0">
          {/* 탭 헤더 */}
          <div className="px-4 py-3 border-b theme-border theme-bg-primary flex items-center justify-between">
            <h3 className="m-0 text-lg theme-text font-semibold flex items-center gap-2">
              {activeTab === 'code' ? (
                <>
                  📝 <span>코드 편집기</span>
                </>
              ) : (
                <>
                  🎨 <span>화이트보드</span>
                </>
              )}
            </h3>
            <div className="text-xs theme-text-secondary">Room {roomId}</div>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="h-[calc(100%-60px)] relative">
            {activeTab === 'code' ? (
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
            ) : (
              <div className="h-full">
                <Whiteboard roomId={roomId} />
              </div>
            )}
          </div>
        </div>

        {/* 우측 사이드바 - 실시간 채팅 */}
        <div className="w-80 flex flex-col m-2 mr-2 ml-1 min-h-0 flex-shrink-0">
          {/* 실시간 채팅 - 전체 높이 사용 */}
          <div className="theme-bg-secondary rounded-lg theme-shadow flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="px-4 py-3 border-b theme-border theme-bg-primary flex-shrink-0">
              <h3 className="m-0 text-lg theme-text font-semibold flex items-center gap-2">
                💬 <span>실시간 채팅</span>
              </h3>
              <div className="text-xs theme-text-secondary mt-1">
                팀원들과 실시간으로 소통하세요
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <Chat roomId={roomId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatRoom
