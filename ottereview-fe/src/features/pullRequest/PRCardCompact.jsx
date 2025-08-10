import { Clock, FolderCode, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import Badge from '@/components/Badge'
import Box from '@/components/Box'
import { formatRelativeTime } from '@/lib/utils/useFormatTime'

const PRCardCompact = ({ pr, type }) => {
  const navigate = useNavigate()

  const updatedAt = pr.githubUpdatedAt ? formatRelativeTime(pr.githubUpdatedAt) : '(업데이트 없음)'
  const title = pr.title
  const repoName = pr.repo?.fullName || '(레포 정보 없음)'
  const author = pr.author?.githubUsername || '(알 수 없음)'
  const approveCnt = pr.approveCnt ?? 0
  const reviewCommentCnt = pr.reviewCommentCnt ?? 0
  const isMergeable = pr.mergeable
  const isAuthored = type === 'authored'
  const isReviewed = type === 'reviewed'

  return (
    <Box
      shadow
      pixelHover
      className="m-3 cursor-pointer"
      onClick={() => navigate(`/${pr.repo.id}/pr/${pr.id}/review`)}
    >
      <div className="flex justify-between overflow-hidden items-center space-x-2">
        <p className="font-semibold text-stone-900 truncate min-w-0">{title}</p>
        {isAuthored && (
          <Badge variant="purple" className="shrink-0">
            내 PR
          </Badge>
        )}
        {isReviewed && (
          <Badge variant="cyan" className="shrink-0">
            리뷰 요청됨
          </Badge>
        )}
      </div>

      <div className="flex text-stone-600">
        <div className="flex items-center space-x-1">
          <FolderCode className="w-4 h-4 mb-[2px]" />
          <span>{repoName}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-stone-600">
        <div className="flex space-x-4 flex-wrap">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 mb-[2px]" />
            <span>{author}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 mb-[2px]" />
            <span>{updatedAt}</span>
          </div>
        </div>

        <div className="flex justify-end gap-1 flex-wrap">
          <Badge variant={isMergeable ? 'primary' : 'danger'}>
            {isMergeable ? '병합 가능' : '병합 불가'}
          </Badge>
          <div className="flex justify-end flex-wrap gap-1">
            <Badge variant="emerald">승인 {approveCnt}</Badge>
            <Badge variant="amber">리뷰 {reviewCommentCnt}</Badge>
          </div>
        </div>
      </div>
    </Box>
  )
}

export default PRCardCompact
