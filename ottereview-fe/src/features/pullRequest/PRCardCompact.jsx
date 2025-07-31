import { useNavigate } from 'react-router-dom'

import Button from '../../components/Button'
import Card from '../../components/Card'

const PRCardCompact = ({ pr }) => {
  const navigate = useNavigate()

  return (
    <Card>
      <div className="space-y-1">
        <p className="font-semibold text-stone-900">제목: {pr.title}</p>
        <p className="text-sm text-stone-700">설명: {pr.description}</p>
        <p className="text-sm text-stone-600">작성자: {pr.author.name}</p>
        <p className="text-sm text-stone-600">레포지토리: {pr.repo.name}</p>
        <p className="text-sm text-stone-600">승인 수: {pr.currentApprovals}</p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          onClick={() => navigate(`/${pr.repo.id}/pr/${pr.id}/review`)}
          variant="outline"
          size="sm"
        >
          리뷰하기
        </Button>
        <Button
          onClick={() => navigate(`/${pr.repo.id}/pr/${pr.id}/conflict`)}
          variant="primary"
          size="sm"
        >
          머지
        </Button>
      </div>
    </Card>
  )
}

export default PRCardCompact
