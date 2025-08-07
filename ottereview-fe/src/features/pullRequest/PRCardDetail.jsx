import {
  ArrowRight,
  Clock,
  Eye,
  FileDiff,
  GitBranch,
  GitMerge,
  GitPullRequest,
  MessageCircle,
  ThumbsUp,
  User,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import Badge from '@/components/Badge'
import Box from '@/components/Box'
import Button from '@/components/Button'
import { formatRelativeTime } from '@/lib/utils'

const PRCardDetail = ({ pr }) => {
  const navigate = useNavigate()

  const title = pr.title
  const description = pr.body || '(내용 없음)'
  const updatedAt = pr.githubCreatedAt ? formatRelativeTime(pr.githubCreatedAt) : '(작성일 없음)'
  const authorName = pr.author?.githubUsername || '(알 수 없음)'
  const prNumber = pr.githubPrNumber ? `#${pr.githubPrNumber}` : ''
  const headBranch = pr.head || '(head 없음)'
  const baseBranch = pr.base || '(base 없음)'
  const repoId = pr.repo?.id
  const prId = pr.id
  const mergeable = pr.mergeable
  const state = pr.state

  const approveCnt = pr.approveCnt ?? 0
  const reviewCommentCnt = pr.reviewCommentCnt ?? 0
  const changedFilesCnt = pr.changedFilesCnt ?? 0

  const stateBadge =
    {
      OPEN: 'primary',
      CLOSED: 'danger',
      MERGED: 'success',
    }[state] || 'default'

  return (
    <Box shadow>
      {/* 헤더 */}
      <div className='space-y-2'>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500 border-2 border-black rounded-lg flex items-center justify-center">
              <GitPullRequest className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 mb-1">
                {title} <span className="text-stone-400 text-sm">{prNumber}</span>
              </h3>
              <p className="text-sm text-stone-600 line-clamp-2">{description}</p>
            </div>
          </div>

          <Badge variant={stateBadge}>{state}</Badge>
        </div>

        <div className="text-stone-600">
          <div className="flex space-x-4">
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4 mb-[2px]" />
              <span>{authorName}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 mb-[2px]" />
              <span>{updatedAt}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="sky">
              <div className="flex items-center space-x-1">
                <GitBranch className="w-4 h-4 mb-[2px]" />
                <span>{headBranch}</span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
                <span>{baseBranch}</span>
              </div>
            </Badge>

            <Badge variant="emerald">승인 {approveCnt}</Badge>
            <Badge variant="amber">리뷰 {reviewCommentCnt}</Badge>
            <Badge variant="indigo">파일 {changedFilesCnt}</Badge>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => navigate(`/${repoId}/pr/${prId}/review`)}
              variant="outline"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-1 mb-[2px]" />
              리뷰하기
            </Button>
            <Button
              onClick={() => navigate(`/${repoId}/pr/${prId}/conflict`)}
              variant="primary"
              size="sm"
              disabled={mergeable || state !== 'OPEN'}
            >
              <GitMerge className="w-4 h-4 mr-1 mb-[2px]" />
              충돌해결
            </Button>
          </div>
        </div>
      </div>
    </Box>
  )
}

export default PRCardDetail
