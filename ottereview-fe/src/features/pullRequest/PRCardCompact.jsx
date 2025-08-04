import { useNavigate } from 'react-router-dom'

import Box from '../../components/Box'
import Button from '../../components/Button'

const PRCardCompact = ({ pr }) => {
  const navigate = useNavigate()

  return (
    <Box
      shadow
      pixelHover
      className="m-3"
      onClick={() => navigate(`/${pr.repo.id}/pr/${pr.id}/review`)}
    >
      <div className="space-y-1">
        <p className="font-semibold text-stone-900">{pr.title}</p>
        <p className="text-sm text-stone-600">
          {pr.author.githubUsername} / {pr.repo.fullName}
        </p>
        <p className="text-sm text-stone-500">
          상태: {pr.state} / 승인: {pr.approveCnt} / 병합 가능: {pr.mergeable ? 'O' : 'X'}
        </p>
      </div>

      {/* <div className="flex gap-2 pt-4">
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
      </div> */}
    </Box>
  )
}

export default PRCardCompact
