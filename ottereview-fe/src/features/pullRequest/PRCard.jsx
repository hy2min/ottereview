// PRCard.jsx
import { useNavigate } from 'react-router-dom'

const PRCard = ({ pr, context }) => {
  const navigate = useNavigate()

  return (
    <div className="border p-4 space-y-1">
      <div>
        <strong>ID:</strong> {pr.id}
      </div>
      <div>
        <strong>PR 제목:</strong> {pr.title}
      </div>
      <div>
        <strong>작성자:</strong> {pr.author}
      </div>

      {context === 'repositoryDetail' && (
        <div className="flex gap-2 pt-2">
          <button
            className="border px-2 py-1 text-sm"
            onClick={() => navigate(`/${pr.repoId}/pr/${pr.id}/review`)}
          >
            리뷰하기
          </button>
          <button className="border px-2 py-1 text-sm" onClick={() => alert('머지 기능 미정')}>
            머지
          </button>
        </div>
      )}
    </div>
  )
}

export default PRCard
