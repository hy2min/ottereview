import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { fetchConflictFile } from '@/features/conflict/conflictApi'
import { fetchMemberList } from '@/features/conflict/conflictApi'
import { useRepoStore } from '@/features/repository/stores/repoStore'

import Box from '../../components/Box'
import Button from '../../components/Button'
import { useChatStore } from '../../features/chat/chatStore'

const Conflict = () => {
  const { repoId, prId } = useParams()
  const repos = useRepoStore((state) => state.repos)
  const accountId = repos.find((r) => r.id === Number(repoId))?.accountId
  const navigate = useNavigate()
  const [selected, setSelected] = useState([])
  const [members, setMembers] = useState([])
  const [conflictFiles, setConflictFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const members = await fetchMemberList({ accountId, repoId })
        setMembers(members)
      } catch (err) {
        console.error('Failed to fetch members:', err)
      }
    }

    if (accountId && repoId) {
      fetchMembers()
    }
  }, [accountId, repoId])

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

  const toggleReviewer = (name) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))
  }

  const toggleFile = (filename) => {
    setSelectedFiles((prev) =>
      prev.includes(filename) ? prev.filter((f) => f !== filename) : [...prev, filename]
    )
  }

  const handleCreateChat = () => {
    useChatStore.getState().addRoom({
      members: selected,
      conflictFiles: selectedFiles,
    })
    navigate('/dashboard')
  }

  return (
    <div className="space-y-4 py-4">
      <Box shadow>
        <div className="flex gap-4 flex-wrap">
          {members.map((name) => (
            <label key={name} className="flex items-center gap-2 border px-3 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(name)}
                onChange={() => toggleReviewer(name)}
              />
              <span>{name}</span>
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
        <Button onClick={handleCreateChat} disabled={selected.length === 0}>
          채팅방 개설
        </Button>
      </div>
    </div>
  )
}

export default Conflict
