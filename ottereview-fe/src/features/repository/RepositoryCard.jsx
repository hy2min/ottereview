import { useNavigate } from 'react-router-dom'

const RepositoryCard = ({ repo, onClick, createEnabled = false }) => {
  const navigate = useNavigate()

  return (
    <div onClick={onClick} className="border p-4 space-y-1 cursor-pointer hover:bg-gray-100">
      <div>
        <p>ID: {repo.id}</p>
      </div>
      <div>
        <p>이름: {repo.name}</p>
      </div>
      <div>
        <p>전체 이름: {repo.full_name}</p>
      </div>
      <button
        className={`border px-4 py-1 ${!createEnabled ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
        onClick={(e) => {
          e.stopPropagation()
          if (createEnabled) {
            navigate(`/${repo.id}/pr/create`)
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
