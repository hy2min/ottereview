import { CheckCircle, Clock, FolderCode, Users } from 'lucide-react'
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
      className="m-3"
      onClick={() => navigate(`/${pr.repo.id}/pr/${pr.id}/review`)}
    >
      <div className="flex justify-between overflow-hidden items-center space-x-2">
        <p className="font-semibold theme-text truncate min-w-0">{title}</p>
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

      <div className="flex theme-text-secondary">
        <div className="flex items-center space-x-1">
          <FolderCode className="w-4 h-4 mb-[2px]" />
          <span>{repoName}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm theme-text-secondary">
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

        <div className="flex items-center space-x-3">
          {/* 병합 검토 - Red */}
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-xs theme-text-secondary font-medium">{isMergeable ? '병합 가능' : '병합 검토'}</span>
          </div>
          
          {/* 승인 - Green */}
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-xs theme-text-secondary font-medium">승인 {approveCnt}</span>
          </div>
          
          {/* 리뷰 - Yellow */}
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-yellow-500" />
            <span className="text-xs theme-text-secondary font-medium">리뷰 {reviewCommentCnt}</span>
          </div>
        </div>
      </div>
    </Box>
  )
}

export default PRCardCompact
