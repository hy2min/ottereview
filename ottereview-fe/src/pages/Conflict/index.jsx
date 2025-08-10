import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import { createChat } from '@/features/chat/chatApi'
import { useChatStore } from '@/features/chat/chatStore'
import { fetchConflictFile } from '@/features/conflict/conflictApi'
import { fetchMemberList } from '@/features/conflict/conflictApi'
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

  // 🐛 디버깅: URL 파라미터 확인
  console.log('🔍 Conflict 컴포넌트 디버깅:')
  console.log('- repoId:', repoId, 'type:', typeof repoId)
  console.log('- prId:', prId, 'type:', typeof prId)

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

      if (!result || !result.meetingroomId) {
        throw new Error('API 응답에 meetingroomId가 없습니다.')
      }

      // ChatStore에 저장할 데이터 준비
      const roomData = {
        id: result.meetingroomId,
        roomName: roomName.trim(),
        members: [...selectedUsernames], // 배열 복사
        conflictFiles: [...selectedFiles], // 배열 복사
        repoId: Number(repoId),
        prId: Number(prId),
      }

      console.log('💾 ChatStore에 저장할 데이터:', roomData)

      // ChatStore에 저장
      useChatStore.getState().addRoom(roomData)

      // 저장 확인
      const allRooms = useChatStore.getState().rooms
      console.log('💾 저장 후 전체 rooms:', allRooms)

      const savedRoom = allRooms.find((r) => r.id === result.meetingroomId)
      console.log('💾 방금 저장된 방:', savedRoom)

      if (!savedRoom) {
        console.error('❌ 방이 제대로 저장되지 않았습니다!')
      }

      console.log('🎯 채팅방으로 이동:', `/chatroom/${result.meetingroomId}`)

      // 채팅방으로 직접 이동
      navigate(`/chatroom/${result.meetingroomId}`)
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
