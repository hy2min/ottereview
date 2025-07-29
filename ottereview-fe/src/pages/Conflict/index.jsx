import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const mockReviewers = ['heejoo', 'alice', 'bob', 'charlie']

const Conflict = () => {
  const navigate = useNavigate()
  const [selected, setSelected] = useState([])

  const toggleReviewer = (name) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))
  }

  const handleCreateChat = () => {
    alert(`선택된 팀원: ${selected.join(', ')}`)
    // 추후 navigate 등으로 확장
  }

  return (
    <div className="relative p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button className="border px-4 py-1" onClick={() => navigate(-1)}>
          ← 뒤로가기
        </button>
        <h1 className="text-2xl font-bold">충돌 해결 페이지</h1>
      </div>

      <div className="border p-4">
        <div className="flex gap-4">
          {mockReviewers.map((name) => (
            <label
              key={name}
              className="flex items-center gap-2 border px-3 py-1 rounded cursor-pointer"
            >
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

      <button className="border px-4 py-1 fixed bottom-6 right-6" onClick={handleCreateChat}>
        채팅방 개설
      </button>
    </div>
  )
}

export default Conflict
