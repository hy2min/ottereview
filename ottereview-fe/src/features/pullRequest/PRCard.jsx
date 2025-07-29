// PRCard.jsx
import { useNavigate } from 'react-router-dom'

const PRCard = ({ pr }) => {
  const navigate = useNavigate()

  return (
    <div className="border p-4 space-y-1">
      <div>
        <p>ID: {pr.id}</p>
      </div>
      <div>
        <p>PR 제목: {pr.title}</p>
      </div>
      <div>
        <p>작성자: {pr.author}</p>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          className="border px-2 py-1 text-sm cursor-pointer"
          onClick={() => navigate(`/${pr.repoId}/pr/${pr.id}/review`)}
        >
          리뷰하기
        </button>
        <button
          className="border px-2 py-1 text-sm cursor-pointer"
          onClick={() => navigate(`/${pr.repoId}/pr/${pr.id}/conflict`)}
        >
          머지
        </button>
      </div>
    </div>
  )
}

export default PRCard
