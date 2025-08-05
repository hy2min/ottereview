import { useNavigate } from 'react-router-dom'

import Badge from '../../components/Badge'
import Box from '../../components/Box'

const PRCardCompact = ({ pr }) => {
  const navigate = useNavigate()

  return (
    <Box
      shadow
      pixelHover
      className="m-3 cursor-pointer"
      onClick={() => navigate(`/${pr.repo.id}/pr/${pr.id}/review`)}
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-stone-900">{pr.title}</p>
          <div className="flex gap-1 flex-wrap">
            {!pr.merged && pr.mergeable === false || (
              <Badge variant="danger">
                충돌 발생
              </Badge>
            )}
            {pr.approveCnt > 0 || (
              <Badge variant="success">
                승인 {pr.approveCnt}
              </Badge>
            )}
            {pr.reviewCommentCnt > 0 || (
              <Badge variant="warning">
                리뷰 {pr.reviewCommentCnt}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-sm text-stone-600">
          {pr.author.githubUsername} / {pr.repo.fullName}
        </p>
        <p className="text-sm text-stone-500">병합 가능: {pr.mergeable ? 'O' : 'X'}</p>
      </div>
    </Box>
  )
}

export default PRCardCompact
