import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import { useChatStore } from '@/features/chat/chatStore'
import { api } from '@/lib/api'

const Conflict = () => {
  const navigate = useNavigate()
  const { repoId, prId } = useParams()
  const [members, setMembers] = useState([])
  const [conflictFiles, setConflictFiles] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isMergeable, setIsMergeable] = useState(true)

  useEffect(() => {
    const fetchPullRequestData = async () => {
      try {
        const [membersRes, prDetailRes] = await Promise.all([
          api.get(`/api/repositories/${repoId}/members`),
          api.get(`/api/repositories/${repoId}/pull-requests/${prId}`),
        ])

        setMembers(membersRes.data)

        const prData = prDetailRes.data
        setIsMergeable(prData.mergeable)
        if (!prData.mergeable) {
          // Assuming files with conflicts are all files in the PR when not mergeable
          setConflictFiles(prData.files.map((f) => f.filename))
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        // Handle error appropriately
      }
    }

    if (repoId && prId) {
      fetchPullRequestData()
    }
  }, [repoId, prId])

  const toggleMember = (name) => {
    setSelectedMembers((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))
  }

  const toggleFile = (file) => {
    setSelectedFiles((prev) => (prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]))
  }

  const handleCreateChat = () => {
    const newRoomId = useChatStore.getState().addRoom({
      members: selectedMembers,
      conflictFiles: selectedFiles,
    })
    navigate(`/chatroom/${newRoomId}`)
  }

  const canCreateChat = selectedMembers.length > 0 && selectedFiles.length > 0

  return (
    <div className="space-y-4 py-4">
      {!isMergeable ? (
        <>
          <Box shadow>
            <h3 className="text-lg font-semibold mb-2">팀원 선택</h3>
            <div className="flex gap-4 flex-wrap">
              {members.map((member) => (
                <label key={member.id} className="flex items-center gap-2 border px-3 py-1 cursor-pointer rounded-md">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.name)}
                    onChange={() => toggleMember(member.name)}
                  />
                  <span>{member.name}</span>
                </label>
              ))}
            </div>
          </Box>

          <Box shadow>
            <h3 className="text-lg font-semibold mb-2">충돌 파일 선택</h3>
            <div className="space-y-2">
              {conflictFiles.map((file) => (
                <label key={file} className="flex items-center gap-2 border px-3 py-1 cursor-pointer rounded-md">
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
            <Button onClick={handleCreateChat} disabled={!canCreateChat}>
              채팅방 개설
            </Button>
          </div>
        </>
      ) : (
        <Box shadow>
          <p className="text-lg">충돌이 없습니다. 채팅방을 개설할 수 없습니다.</p>
        </Box>
      )}
    </div>
  )
}

export default Conflict
