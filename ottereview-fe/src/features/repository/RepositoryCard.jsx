import { useNavigate } from 'react-router-dom'

const RepositoryCard = ({ repo, onClick, createEnabled = false }) => {
  const navigate = useNavigate()
  return (
    <div onClick={onClick} className="border p-4 space-y-1 cursor-pointer hover:bg-gray-100">
      <div>
        <strong>ID:</strong> {repo.id}
      </div>
      <div>
        <strong>이름:</strong> {repo.name}
      </div>
      <div>
        <strong>전체 이름:</strong> {repo.full_name}
      </div>
      <button
        className={`border px-4 py-1 ${!createEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          if (createEnabled) {
            navigate(`/${repo.id}/pr/create/`)
          }
        }}
        disabled={!createEnabled}
      >
        PR 생성
      </button>
    </div>
  )
}

export default RepositoryCard
