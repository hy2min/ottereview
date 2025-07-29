import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useChatStore } from '../../features/chat/chatStore'

const mockReviewers = ['heejoo', 'alice', 'bob', 'charlie']

const Conflict = () => {
  const navigate = useNavigate()
  const [selected, setSelected] = useState([])

  const toggleReviewer = (name) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))
  }

  const handleCreateChat = () => {
    useChatStore.getState().addRoom({
      members: selected,
      conflictFiles: ['fileA.js', 'fileB.jsx'], // 추후 동적 처리 가능
    })
    navigate('/dashboard')
  }

  return (
    <div className="space-y-4 py-4">
      <div className="border p-4">
        <div className="flex gap-4">
          {mockReviewers.map((name) => (
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
      </div>

      <div className="border p-4">충돌 파일 목록</div>

      <div className="flex justify-end mt-4">
        <button className="border px-4 py-1 cursor-pointer" onClick={handleCreateChat}>
          채팅방 개설
        </button>
      </div>
    </div>
  )
}

export default Conflict
