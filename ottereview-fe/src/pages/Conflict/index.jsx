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

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const rawMembers = await fetchMemberList({ repoId })

        const members = rawMembers.map((m) => ({
          id: m.id,
          username: m.githubUsername,
        }))
        setMembers(members)
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
    setSelectedFiles((prev) =>
      prev.includes(filename) ? prev.filter((f) => f !== filename) : [...prev, filename]
    )
  }

  const handleCreateChat = async () => {
    try {
      const roomName = `chat-${Date.now()}`

      const result = await createChat({
        prId,
        roomName,
        inviteeIds: selectedUserIds,
      })

      useChatStore.getState().addRoom({
        members: selectedUsernames,
        conflictFiles: selectedFiles,
      })

      navigate('/dashboard')
    } catch (err) {
      console.log('채팅방 생성 실패:', err)
    }
  }

  return (
    <div className="space-y-4 py-4">
      <Box shadow>
        <div className="flex gap-4 flex-wrap">
          {members.map((member) => (
            <label
              key={member.username}
              className="flex items-center gap-2 border px-3 py-1 cursor-pointer"
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
      </Box>

      <Box shadow>
        충돌 파일 목록
        <div className="flex gap-4 flex-wrap">
          {conflictFiles.map((file) => (
            <label key={file} className="flex items-center gap-2 border px-3 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFiles.includes(file)}
                onChange={() => toggleFile(file)}
              />
              <span>{file}</span>
            </label>
          ))}
        </div>
      </Box>

      <div className="flex justify-end">
        <Button onClick={handleCreateChat} disabled={selectedUserIds.length === 0}>
          채팅방 개설
        </Button>
      </div>
    </div>
  )
}

export default Conflict
