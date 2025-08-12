import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { useChatStore } from '@/features/chat/chatStore'
import useConflictStore from '@/features/conflict/conflictStore'
import AudioChatRoom from '@/features/webrtc/AudioChatRoom'
import Chat from '@/features/webrtc/Chat'
import CodeEditor from '@/features/webrtc/CodeEditor'
import Whiteboard from '@/features/webrtc/Whiteboard'

const ChatRoom = () => {
  const { roomId } = useParams()
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [yorkieDocs, setYorkieDocs] = useState([])

  // chatStore에서 채팅방 정보 가져오기
  const rooms = useChatStore((state) => state.rooms)
  const getRoomById = useChatStore((state) => state.getRoomById)

  // Zustand conflictStore 사용
  const { conflictData, loading, error, fetchConflictData, reset } = useConflictStore()

  // 여러 방법으로 방 찾기 시도
  let room = null
  if (getRoomById) {
    room = getRoomById(Number(roomId))
  }

  if (!room) {
    room = rooms.find((r) => r.id === Number(roomId) || r.id === roomId)
  }

  // sessionStorage에서 방 정보와 Yorkie 문서 정보 로드
  if (!room && roomId) {
    try {
      const storedRoomInfo = sessionStorage.getItem(`room_${roomId}`)
      if (storedRoomInfo) {
        room = JSON.parse(storedRoomInfo)
        console.log('📦 sessionStorage에서 방 정보 복원:', room)
      }
    } catch (err) {
      console.warn('sessionStorage 읽기 실패:', err)
    }
  }

  // Yorkie 문서 정보 로드
  useEffect(() => {
    if (roomId) {
      try {
        const storedRoomInfo = sessionStorage.getItem(`room_${roomId}`)
        if (storedRoomInfo) {
          const parsedRoomInfo = JSON.parse(storedRoomInfo)

          // Yorkie 문서 정보 설정
          if (parsedRoomInfo.yorkieDocs) {
            setYorkieDocs(parsedRoomInfo.yorkieDocs)
            console.log('📄 Yorkie 문서 정보 로드:', parsedRoomInfo.yorkieDocs)
          }
        }
      } catch (err) {
        console.error('yorkieDocs 로드 실패:', err)
      }
    }
  }, [roomId])

  // Store를 통해 충돌 데이터 가져오기
  useEffect(() => {
    const loadConflictData = async () => {
      try {
        // room에 저장된 repoId, prId 사용
        if (!room?.repoId || !room?.prId) {
          console.error('repoId 또는 prId가 없습니다:', { repoId: room?.repoId, prId: room?.prId })
          return
        }

        console.log('📡 Store를 통한 API 호출 시작:', { repoId: room.repoId, prId: room.prId })
        await fetchConflictData(room.repoId, room.prId)
        console.log('✅ Store 데이터 로딩 완료')

        // room.conflictFiles (Conflict에서 선택한 파일들) 중 첫 번째를 기본 선택
        if (room.conflictFiles && room.conflictFiles.length > 0) {
          const firstFile = room.conflictFiles[0]
          console.log('🎯 기본 선택 파일:', firstFile)
          setSelectedFileName(firstFile)
        }
      } catch (error) {
        console.error('충돌 데이터 로딩 실패:', error)
      }
    }

    if (room && room.repoId && room.prId) {
      loadConflictData()
    }

    // 컴포넌트 언마운트 시에만 store 정리
    return () => {
      reset()
    }
  }, [room?.repoId, room?.prId, fetchConflictData])

  // 컴포넌트 언마운트 시에만 store 정리
  useEffect(() => {
    return () => {
      reset()
    }
  }, [])

  // 파일 선택 핸들러
  const handleFileSelect = (filename) => {
    setSelectedFileName(filename)
    console.log('📝 파일 선택:', filename)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 relative">
      {/* 헤더 */}
      <div className="px-8 py-4 border-b border-gray-200 bg-white shadow-sm z-10 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 m-0">🧪 협업 개발실</h2>
            <p className="text-sm text-gray-600 mt-1 m-0">
              🔒 Room ID: <strong>{roomId}</strong>
              {room && (
                <>
                  <span className="mx-4">•</span>
                  📝 {room.roomName || `Room ${roomId}`}
                  {room.members?.length > 0 && (
                    <>
                      <span className="mx-4">•</span>
                      👥 {room.members.join(', ')}
                    </>
                  )}
                </>
              )}
            </p>
          </div>

          {/* 도구 버튼들 */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowWhiteboard(!showWhiteboard)}
              className={`px-4 py-2 rounded-md text-sm font-medium border transition-all duration-200 ${
                showWhiteboard
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {showWhiteboard ? '📝 코드편집기' : '🎨 화이트보드'}
            </button>
          </div>
        </div>

        {/* 상태 표시 */}
        <div className="mt-3 flex gap-2 flex-wrap">
          {/* 충돌 파일 정보 */}
          {room?.conflictFiles?.length > 0 && (
            <div className="px-3 py-2 bg-yellow-100 border border-yellow-400 rounded-md text-sm">
              ⚡ <strong>충돌 파일:</strong> {room.conflictFiles.join(', ')}
            </div>
          )}

          {/* Yorkie 문서 상태 */}
          {yorkieDocs.length > 0 && (
            <div className="px-3 py-2 bg-sky-50 border border-sky-200 rounded-md text-sm text-sky-800">
              📄 <strong>협업 문서:</strong> {yorkieDocs.length}개 연결됨
            </div>
          )}

          {/* 로딩 상태 */}
          {loading && (
            <div className="px-3 py-2 bg-blue-50 border border-blue-300 rounded-md text-sm text-blue-800">
              🔄 데이터 로딩 중...
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-400 rounded-md text-sm text-red-700">
              ❌ 오류: {error.message || error}
            </div>
          )}

          {/* 데이터 로딩 완료 상태 */}
          {conflictData && !loading && (
            <div className="px-3 py-2 bg-green-50 border border-green-400 rounded-md text-sm text-green-800">
              ✅ 데이터 로딩 완료 ({conflictData.files?.length || 0}개 파일)
            </div>
          )}
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 중앙 메인 영역 - 코드편집기 */}
        <div className="flex-1 bg-white ml-4 my-4 rounded-lg shadow-sm overflow-hidden min-h-0 flex flex-col">
          {/* 파일 탭 영역 */}
          {room?.conflictFiles?.length > 0 && (
            <div className="flex bg-gray-50 border-b border-gray-200 px-4 py-2 gap-2 flex-wrap flex-shrink-0">
              {room.conflictFiles.map((fileName) => (
                <button
                  key={fileName}
                  onClick={() => handleFileSelect(fileName)}
                  className={`px-4 py-2 rounded-t-md border-none text-sm font-medium cursor-pointer transition-all duration-200 flex items-center gap-2 border-b-2 ${
                    selectedFileName === fileName
                      ? 'bg-white text-gray-800 font-semibold border-b-blue-500'
                      : 'bg-transparent text-gray-600 border-b-transparent hover:bg-blue-50'
                  }`}
                >
                  <span>📄</span>
                  <span>{fileName}</span>
                  {selectedFileName === fileName && (
                    <span className="text-xs text-green-500">●</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 코드 편집기 영역 */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedFileName ? (
              <CodeEditor
                roomId={roomId}
                fileName={selectedFileName}
                documentKey={`${roomId}_${selectedFileName.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 text-lg flex-col gap-4 p-8">
                {loading ? (
                  <>
                    <div>📁 파일을 불러오는 중...</div>
                    <div className="text-base text-gray-400">
                      충돌 데이터와 협업 문서를 준비하고 있습니다.
                    </div>
                  </>
                ) : room?.conflictFiles?.length > 0 ? (
                  <>
                    <div>📂 편집할 파일을 선택해주세요</div>
                    <div className="text-base text-gray-400">
                      위의 파일 탭을 클릭하여 협업 편집을 시작하세요.
                    </div>
                  </>
                ) : (
                  <>
                    <div>📭 사용 가능한 파일이 없습니다</div>
                    <div className="text-base text-gray-400">
                      Conflict 페이지에서 파일을 선택해주세요.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽 사이드바 - 채팅 & 음성 */}
        <div className="w-80 flex flex-col mr-4 my-4 gap-4 min-h-0 flex-shrink-0">
          {/* 음성 채팅 - 고정 높이 */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden h-60 flex-shrink-0">
            <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 h-16 box-border flex-shrink-0">
              <h3 className="text-base font-medium text-gray-700 m-0">🎤 음성 채팅</h3>
            </div>
            <div className="p-4 h-44 overflow-auto">
              <AudioChatRoom roomId={roomId} />
            </div>
          </div>

          {/* 텍스트 채팅 - 나머지 공간 모두 사용 */}
          <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <h3 className="text-base font-medium text-gray-700 m-0">💬 채팅</h3>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <Chat roomId={roomId} />
            </div>
          </div>
        </div>
      </div>

      {/* 화이트보드 모달 - 크기 줄임 */}
      {showWhiteboard && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowWhiteboard(false)
            }
          }}
        >
          <div className="w-4/5 h-4/5 max-w-5xl max-h-4xl bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden relative">
            <button
              onClick={() => setShowWhiteboard(false)}
              className="absolute top-4 right-4 z-10 px-3 py-2 bg-red-500 text-white border-none rounded-md cursor-pointer text-sm font-semibold shadow-md flex items-center gap-1 hover:bg-red-600 transition-colors"
            >
              ✕ 닫기
            </button>

            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xl font-semibold text-gray-700 m-0 pr-24">
                🎨 화이트보드 - Room {roomId}
              </h3>
            </div>

            <div className="flex-1 relative overflow-auto p-3 min-h-0">
              <div className="w-full h-full min-h-96 relative">
                <Whiteboard roomId={roomId} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 디버깅 정보 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 p-4 bg-gray-100 border border-gray-300 rounded-lg text-sm max-w-sm z-30">
          <p className="font-bold mb-2 m-0">🐛 디버깅 정보:</p>
          <p className="mb-1 m-0">roomId: {roomId}</p>
          <p className="mb-1 m-0">room 존재: {room ? '✅' : '❌'}</p>
          <p className="mb-1 m-0">conflictData 존재: {conflictData ? '✅' : '❌'}</p>
          <p className="mb-1 m-0">selectedFileName: {selectedFileName || '없음'}</p>
          <p className="mb-1 m-0">yorkieDocs 개수: {yorkieDocs.length}</p>
          <p className="mb-1 m-0">저장된 방 개수: {rooms.length}</p>
          <p className="m-0">loading: {loading ? '✅' : '❌'}</p>
        </div>
      )}
    </div>
  )
}

export default ChatRoom
