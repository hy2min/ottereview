import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import { createChat } from '@/features/chat/chatApi'
import { useChatStore } from '@/features/chat/chatStore'
import useConflictStore from '@/features/conflict/conflictStore' // 기존 충돌 스토어
import { useRepoStore } from '@/features/repository/stores/repoStore'
import CodeEditor from '@/features/webrtc/CodeEditor' // CodeEditor 컴포넌트 import

const Conflict = () => {
  const { repoId, prId } = useParams()
  const repos = useRepoStore((state) => state.repos)
  const accountId = repos.find((r) => r.id === Number(repoId))?.accountId
  const navigate = useNavigate()

  // 로컬 상태들
  const [roomName, setRoomName] = useState('')
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const [chatRoomId, setChatRoomId] = useState(null)
  const [editorActiveFile, setEditorActiveFile] = useState(null)
  const [activeFile, setActiveFile] = useState(null) // 미리보기용

  // Zustand store 사용
  const {
    members,
    conflictFiles,
    selectedMembers,
    selectedFiles,
    loading,
    error,
    conflictData,
    fetchConflictData,
    toggleMember,
    toggleFile,
    getFileHeadContent,
    getFileConflictContent,
    reset,
  } = useConflictStore()

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        await fetchConflictData(repoId, prId)
      } catch (err) {
        console.error('Failed to fetch conflict data:', err)
      }
    }

    if (repoId && prId) {
      fetchMembers()
    }

    // 컴포넌트 언마운트 시 상태 초기화
    return () => {
      reset()
    }
  }, [repoId, prId, fetchConflictData, reset])

  useEffect(() => {
    // 컴포넌트 언마운트 시 상태 초기화
    return () => {
      reset()
    }
  }, [])

  const toggleReviewer = (member) => {
    toggleMember(member.githubUsername)
  }

  const handleToggleFile = (filename) => {
    toggleFile(filename)

    // 파일이 제거되었고 현재 활성 파일이 제거된 파일이라면 activeFile 초기화
    if (selectedFiles.includes(filename) && activeFile === filename) {
      const newSelectedFiles = selectedFiles.filter((f) => f !== filename)
      setActiveFile(newSelectedFiles.length > 0 ? newSelectedFiles[0] : null)
    }
    // 파일이 새로 추가되고 현재 활성 파일이 없다면 새 파일을 활성화
    else if (!selectedFiles.includes(filename) && !activeFile) {
      setActiveFile(filename)
    }
  }

  const handleCreateChat = async () => {
    try {
      console.log('🚀 채팅방 생성 시작')
      console.log('📝 현재 상태:', {
        roomName: roomName.trim(),
        selectedMembers,
        selectedFiles,
        repoId,
        prId,
      })

      // 유효성 검사
      if (!roomName.trim()) {
        alert('채팅방 이름을 입력해주세요.')
        return
      }

      if (selectedMembers.length === 0) {
        alert('참여자를 최소 1명 이상 선택해주세요.')
        return
      }

      if (selectedFiles.length === 0) {
        alert('충돌 파일을 최소 1개 이상 선택해주세요.')
        return
      }

      // 선택된 멤버들의 ID 추출
      const selectedMemberIds = members
        .filter((member) => selectedMembers.includes(member.githubUsername))
        .map((member) => member.id)

      console.log('📤 API 요청 데이터:', {
        prId: Number(prId),
        roomName: roomName.trim(),
        inviteeIds: selectedMemberIds,
        selectedMemberUsernames: selectedMembers,
      })

      // 채팅방 생성 API 호출
      const result = await createChat({
        prId: Number(prId),
        roomName: roomName.trim(),
        inviteeIds: selectedMemberIds,
      })

      console.log('✅ API 응답:', result)

      // API 응답에서 채팅방 ID 추출 (실제 API 응답 구조에 맞게 수정 필요)
      const roomId = result.roomId || result.id || result.chatRoomId
      if (!roomId) {
        throw new Error('채팅방 ID를 받지 못했습니다.')
      }

      setChatRoomId(roomId)
      setShowCodeEditor(true) // 코드 에디터 표시
      setEditorActiveFile(selectedFiles[0]) // 첫 번째 선택된 파일을 기본으로 설정

      // 성공 메시지
      alert('채팅방이 성공적으로 생성되었습니다! 코드 에디터에서 충돌을 해결해보세요.')

      console.log('🎯 코드 에디터 표시, 채팅방 ID:', roomId)
    } catch (err) {
      console.error('❌ 채팅방 생성 실패:', err)
      alert(`채팅방 생성에 실패했습니다: ${err.message}`)
    }
  }

  return (
    <div className="space-y-4 py-4">
      {!showCodeEditor ? (
        <>
          {/* 채팅방 이름 입력 */}
          <Box shadow>
            <div className="mb-2 font-medium">채팅방 이름</div>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="채팅방 이름을 입력하세요"
              className="border px-3 py-2 w-full rounded"
            />
          </Box>

          {/* 참여자 선택 */}
          <Box shadow>
            <div className="mb-2 font-medium">참여자 선택 (필수)</div>
            {loading && (
              <div className="text-sm text-gray-500 mb-2">멤버 목록을 불러오는 중...</div>
            )}
            {error && <div className="text-sm text-red-500 mb-2">오류: {error.message}</div>}

            <div className="flex gap-4 flex-wrap">
              {members.map((member) => (
                <label
                  key={member.githubUsername}
                  className={`flex items-center gap-2 border px-3 py-1 cursor-pointer hover:bg-gray-50 rounded ${
                    selectedMembers.includes(member.githubUsername)
                      ? 'bg-blue-50 border-blue-300'
                      : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.githubUsername)}
                    onChange={() => toggleReviewer(member)}
                  />
                  <span>{member.githubUsername}</span>
                </label>
              ))}
            </div>
            {selectedMembers.length > 0 && (
              <div className="mt-2 text-sm text-blue-600">
                선택된 참여자: {selectedMembers.join(', ')}
              </div>
            )}
          </Box>

          {/* 충돌 파일 선택 */}
          <Box shadow>
            <div className="mb-2 font-medium">충돌 파일 목록 (필수)</div>

            <div className="flex gap-4 flex-wrap">
              {conflictFiles.map((file) => (
                <label
                  key={file}
                  className={`flex items-center gap-2 border px-3 py-1 cursor-pointer hover:bg-gray-50 rounded ${
                    selectedFiles.includes(file) ? 'bg-green-50 border-green-300' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file)}
                    onChange={() => handleToggleFile(file)}
                  />
                  <span className="text-sm">{file}</span>
                </label>
              ))}
            </div>
            {selectedFiles.length > 0 ? (
              <div className="mt-2 text-sm text-green-600">
                선택된 파일: {selectedFiles.join(', ')}
              </div>
            ) : (
              <div className="mt-2 text-sm text-red-600">
                충돌 파일을 최소 1개 이상 선택해주세요.
              </div>
            )}
          </Box>

          {/* 선택된 파일들의 내용 표시 */}
          {selectedFiles.length > 0 && conflictData && (
            <Box shadow>
              <div className="mb-4 font-medium">선택된 파일 충돌 내용 미리보기</div>

              {/* 파일 탭 버튼들 */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {selectedFiles.map((filename) => (
                  <button
                    key={filename}
                    onClick={() => setActiveFile(filename)}
                    className={`px-3 py-2 rounded text-sm border transition-colors ${
                      activeFile === filename
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {filename}
                  </button>
                ))}
              </div>

              {/* 선택된 파일의 충돌 내용 표시 */}
              {activeFile && (
                <div className="border rounded p-3">
                  <div className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
                    <span>📄 {activeFile}</span>
                    <span className="text-xs text-gray-500">충돌 내용</span>
                  </div>

                  {(() => {
                    const fileContent = getFileConflictContent(activeFile)

                    return fileContent ? (
                      <div className="bg-gray-50 p-4 rounded text-sm border max-h-60 overflow-y-auto">
                        <pre className="whitespace-pre-wrap overflow-x-auto text-xs font-mono leading-relaxed">
                          {fileContent}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm bg-gray-50 p-4 rounded border">
                        해당 파일의 충돌 내용을 찾을 수 없습니다.
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* 초기 상태에서 첫 번째 파일 자동 선택 */}
              {!activeFile && selectedFiles.length > 0 && setActiveFile(selectedFiles[0])}
            </Box>
          )}

          {/* 생성 버튼 */}
          <div className="flex justify-end">
            <Button
              onClick={handleCreateChat}
              disabled={
                selectedMembers.length === 0 || !roomName.trim() || selectedFiles.length === 0
              }
              className={`px-6 py-2 rounded ${
                selectedMembers.length === 0 || !roomName.trim() || selectedFiles.length === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              채팅방 개설
            </Button>
          </div>

          {/* 요약 정보 */}
          {process.env.NODE_ENV === 'development' && (
            <Box shadow>
              <div className="mb-2 font-medium">🐛 생성 정보 미리보기</div>
              <div className="text-sm space-y-1 text-gray-600">
                <p>
                  <strong>Repository ID:</strong> {repoId}
                </p>
                <p>
                  <strong>Pull Request ID:</strong> {prId}
                </p>
                <p>
                  <strong>채팅방 이름:</strong> {roomName || '(미입력)'}
                </p>
                <p>
                  <strong>선택된 멤버:</strong> {selectedMembers.length}명 -{' '}
                  {selectedMembers.join(', ') || '(없음)'}
                </p>
                <p>
                  <strong>멤버 ID들:</strong>{' '}
                  {members
                    .filter((member) => selectedMembers.includes(member.githubUsername))
                    .map((member) => `${member.githubUsername}(${member.id})`)
                    .join(', ') || '(없음)'}
                </p>
                <p>
                  <strong>선택된 파일:</strong> {selectedFiles.length}개 -{' '}
                  {selectedFiles.join(', ') || '(없음)'}
                </p>
                <p>
                  <strong>생성 가능:</strong>{' '}
                  {selectedMembers.length > 0 && roomName.trim() && selectedFiles.length > 0
                    ? '✅ 예'
                    : '❌ 아니오'}
                </p>
              </div>
            </Box>
          )}
        </>
      ) : (
        <>
          {/* 코드 에디터 화면 */}
          <Box shadow>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">충돌 해결 코드 에디터</h2>
                <button
                  onClick={() => {
                    setShowCodeEditor(false)
                    setChatRoomId(null)
                    setEditorActiveFile(null)
                  }}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                >
                  설정으로 돌아가기
                </button>
              </div>

              {/* 파일 선택 버튼들 */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {selectedFiles.map((filename) => (
                  <button
                    key={filename}
                    onClick={() => setEditorActiveFile(filename)}
                    className={`px-3 py-2 rounded text-sm border transition-colors ${
                      editorActiveFile === filename
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    📝 {filename}
                  </button>
                ))}
              </div>

              <div className="text-sm text-gray-600 mb-2">
                현재 편집 중: <strong>{editorActiveFile}</strong> | 채팅방:{' '}
                <strong>{roomName}</strong>
              </div>
            </div>

            {/* CodeEditor 컴포넌트 */}
            {chatRoomId && editorActiveFile && (
              <CodeEditor
                roomId={`${chatRoomId}_${editorActiveFile}`} // 채팅방ID + 파일명으로 고유한 roomId 생성
                fileName={editorActiveFile} // 파일명만 전달
              />
            )}
          </Box>
        </>
      )}
    </div>
  )
}

export default Conflict
