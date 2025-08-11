import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import { createChat } from '@/features/chat/chatApi'
import { useChatStore } from '@/features/chat/chatStore'
import {
  fetchConflictData,
  fetchConflictFile,
  fetchMemberList,
} from '@/features/conflict/conflictApi'
import { useConflictStore } from '@/features/conflict/conflictStore'
import { useRepoStore } from '@/features/repository/stores/repoStore'

const Conflict = () => {
  const { repoId, prId } = useParams()
  const repos = useRepoStore((state) => state.repos)
  const accountId = repos.find((r) => r.id === Number(repoId))?.accountId
  const navigate = useNavigate()

  const [selectedUsernames, setSelectedUsernames] = useState([])
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [members, setMembers] = useState([])
  const [conflictFiles, setConflictFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [roomName, setRoomName] = useState('')

  const [conflictData, setConflictData] = useState(null) // 충돌 데이터 저장
  const [activeFile, setActiveFile] = useState(null) // 현재 보고 있는 파일

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const rawMembers = await fetchMemberList({ repoId })

        const members = rawMembers.map((m) => ({
          id: m.id,
          username: m.githubUsername,
        }))
        setMembers(members)
        console.log('👥 멤버 목록 로드:', members)
      } catch (err) {
        console.error('Failed to fetch members:', err)
      }
    }

    if (repoId) {
      fetchMembers()
    }
  }, [repoId])

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetchConflictFile({ repoId, prId })
        const filenames = res.files.map((file) => file.filename)
        setConflictFiles(filenames)
        console.log('📁 충돌 파일 목록 로드:', filenames)

        const conflictRes = await fetchConflictData(repoId, prId)
        setConflictData(conflictRes)
        console.log('📄 충돌 데이터 로드:', conflictRes)
      } catch (err) {
        console.error('Failed to fetch conflict files:', err)
      }
    }

    if (repoId && prId) {
      fetchFiles()
    }
  }, [repoId, prId])

  const toggleReviewer = (member) => {
    setSelectedUsernames((prev) =>
      prev.includes(member.username)
        ? prev.filter((n) => n !== member.username)
        : [...prev, member.username]
    )

    setSelectedUserIds((prev) =>
      prev.includes(member.id) ? prev.filter((id) => id !== member.id) : [...prev, member.id]
    )
  }

  const toggleFile = (filename) => {
    setSelectedFiles((prev) => {
      const newFiles = prev.includes(filename)
        ? prev.filter((f) => f !== filename)
        : [...prev, filename]

      console.log('📄 파일 선택 변경:', {
        file: filename,
        action: prev.includes(filename) ? '제거' : '추가',
        newSelection: newFiles,
      })
      // 파일이 제거되었고 현재 활성 파일이 제거된 파일이라면 activeFile 초기화
      if (prev.includes(filename) && activeFile === filename) {
        setActiveFile(newFiles.length > 0 ? newFiles[0] : null)
      }
      // 파일이 새로 추가되고 현재 활성 파일이 없다면 새 파일을 활성화
      else if (!prev.includes(filename) && !activeFile) {
        setActiveFile(filename)
      }

      return newFiles
    })
  }
  const handleCreateChat = async () => {
    try {
      console.log('🚀 채팅방 생성 시작')
      console.log('📝 현재 상태:', {
        roomName: roomName.trim(),
        selectedUserIds,
        selectedUsernames,
        selectedFiles,
        repoId,
        prId,
      })

      // 유효성 검사
      if (!roomName.trim()) {
        alert('채팅방 이름을 입력해주세요.')
        return
      }

      if (selectedUserIds.length === 0) {
        alert('참여자를 최소 1명 이상 선택해주세요.')
        return
      }

      if (selectedFiles.length === 0) {
        alert('충돌 파일을 최소 1개 이상 선택해주세요.')
        return
      }

      console.log('📤 API 요청 데이터:', {
        prId: Number(prId),
        roomName: roomName.trim(),
        inviteeIds: selectedUserIds,
      })

      // 채팅방 생성 API 호출
      const result = await createChat({
        prId: Number(prId),
        roomName: roomName.trim(),
        inviteeIds: selectedUserIds,
      })

      console.log('✅ API 응답:', result)

      // API 응답 구조에 따라 조건 수정 (meetingroomId 또는 다른 필드명일 수 있음)
      if (!result) {
        throw new Error('채팅방 생성 API 응답이 없습니다.')
      }

      // 성공 메시지
      alert('채팅방이 성공적으로 생성되었습니다!')

      console.log('🎯 대시보드로 이동')

      // 대시보드로 이동
      navigate('/dashboard')
    } catch (err) {
      console.error('❌ 채팅방 생성 실패:', err)
      alert(`채팅방 생성에 실패했습니다: ${err.message}`)
    }
  }
  return (
    <div className="space-y-4 py-4">
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
        <div className="flex gap-4 flex-wrap">
          {members.map((member) => (
            <label
              key={member.username}
              className={`flex items-center gap-2 border px-3 py-1 cursor-pointer hover:bg-gray-50 rounded ${
                selectedUsernames.includes(member.username) ? 'bg-blue-50 border-blue-300' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={selectedUsernames.includes(member.username)}
                onChange={() => toggleReviewer(member)}
              />
              <span>{member.username}</span>
            </label>
          ))}
        </div>
        {selectedUsernames.length > 0 && (
          <div className="mt-2 text-sm text-blue-600">
            선택된 참여자: {selectedUsernames.join(', ')}
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
                onChange={() => toggleFile(file)}
              />
              <span className="text-sm">{file}</span>
            </label>
          ))}
        </div>
        {selectedFiles.length > 0 ? (
          <div className="mt-2 text-sm text-green-600">선택된 파일: {selectedFiles.join(', ')}</div>
        ) : (
          <div className="mt-2 text-sm text-red-600">충돌 파일을 최소 1개 이상 선택해주세요.</div>
        )}
      </Box>

      {/* 선택된 파일들의 내용 표시 */}
      {selectedFiles.length > 0 && conflictData && (
        <Box shadow>
          <div className="mb-2 font-medium">선택된 파일 내용</div>

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
                // conflictData.files에서 activeFile의 인덱스 찾기
                const fileIndex = conflictData.files ? conflictData.files.indexOf(activeFile) : -1
                const fileContent =
                  fileIndex !== -1 && conflictData.conflictFilesContents
                    ? conflictData.conflictFilesContents[fileIndex]
                    : null

                console.log('🔍 활성 파일 정보:', {
                  activeFile,
                  fileIndex,
                  allFiles: conflictData.files,
                  hasContent: !!fileContent,
                  contentLength: fileContent?.length,
                })

                return fileContent ? (
                  <div className="bg-gray-50 p-4 rounded text-sm border">
                    <pre className="whitespace-pre-wrap overflow-x-auto text-xs font-mono leading-relaxed">
                      {fileContent}
                    </pre>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm bg-gray-50 p-4 rounded border">
                    해당 파일의 충돌 내용을 찾을 수 없습니다.
                    <br />
                    <small className="text-xs">
                      파일 인덱스: {fileIndex}, 전체 파일:{' '}
                      {conflictData.files?.join(', ') || '없음'}
                      <br />
                      충돌 내용 개수: {conflictData.conflictFilesContents?.length || 0}
                    </small>
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
          disabled={selectedUserIds.length === 0 || !roomName.trim() || selectedFiles.length === 0}
          className={`px-6 py-2 rounded ${
            selectedUserIds.length === 0 || !roomName.trim() || selectedFiles.length === 0
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
              <strong>선택된 멤버:</strong> {selectedUsernames.length}명 -{' '}
              {selectedUsernames.join(', ') || '(없음)'}
            </p>
            <p>
              <strong>선택된 파일:</strong> {selectedFiles.length}개 -{' '}
              {selectedFiles.join(', ') || '(없음)'}
            </p>
            <p>
              <strong>생성 가능:</strong>{' '}
              {selectedUserIds.length > 0 && roomName.trim() && selectedFiles.length > 0
                ? '✅ 예'
                : '❌ 아니오'}
            </p>
          </div>
        </Box>
      )}
    </div>
  )
}

export default Conflict
