import { useNavigate } from 'react-router-dom'

import Button from '../../components/Button'

const PRCard = ({ pr }) => {
  const navigate = useNavigate()

  return (
    <div className="border p-4 space-y-1">
      <div>
        <p>ID: {pr.id}</p>
        <p>PR 제목: {pr.title}</p>
        <p>작성자: {pr.author}</p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          onClick={() => navigate(`/${pr.repoId}/pr/${pr.id}/review`)}
          variant="outline"
          size="sm"
        >
          리뷰하기
        </Button>
        <Button
          onClick={() => navigate(`/${pr.repoId}/pr/${pr.id}/conflict`)}
          variant="primary"
          size="sm"
        >
          머지
        </Button>
      </div>
    </div>
  )
}

export default PRCard
