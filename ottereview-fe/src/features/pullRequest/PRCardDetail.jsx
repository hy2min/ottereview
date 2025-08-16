import {
  ArrowRight,
  CheckCircle,
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
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Badge from '@/components/Badge'
import Box from '@/components/Box'
import Button from '@/components/Button'
import { doMerge, IsMergable } from '@/features/pullRequest/prApi'
import { formatRelativeTime } from '@/lib/utils/useFormatTime'

const PRCardDetail = ({ pr }) => {
  const navigate = useNavigate()

  // API 응답에서 받은 mergeable 상태를 관리
  const [apiMergeable, setApiMergeable] = useState(null)

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

  const handleIsMergable = async () => {
    try {
      const mergeState = await IsMergable({ repoId, prId })
      console.log('mergeState:', mergeState)

      // API 응답의 mergeable 값을 저장 (우선순위가 높음)
      setApiMergeable(mergeState.mergeable)

      if (mergeState.mergeable) {
        console.log('머지 가능, doMerge 실행')
        await handleMerge()
      } else {
        console.log('머지 불가능')
      }
    } catch (err) {
      console.log(err)
    }
  }

  const handleMerge = async () => {
    try {
      const data = await doMerge({ repoId, prId })
      console.log(data)
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <Box shadow>
      {/* 헤더 */}
      <div className="space-y-2">
        <div className="flex justify-between items-start space-x-2">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="min-w-10 min-h-10 bg-primary-500 border-2 border-black rounded-lg flex items-center justify-center">
              <GitPullRequest className="w-5 h-5 -mt-[4px] text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold theme-text mb-1">
                {title} <span className="theme-text-muted text-sm">{prNumber}</span>
              </h3>
              <p className="text-sm theme-text-secondary line-clamp-2">{description}</p>
            </div>
          </div>

          <Badge variant={stateBadge} className="shrink-0">
            {state}
          </Badge>
        </div>

        <div className="theme-text-secondary">
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
          <div className="flex flex-wrap gap-4 text-sm">
            <Badge variant="sky">
              <div className="flex items-center space-x-1">
                <GitBranch className="w-4 h-4 mb-[2px]" />
                <span>{headBranch}</span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
                <span>{baseBranch}</span>
              </div>
            </Badge>

            <div className="flex items-center space-x-3">
              {/* 병합 검토 - Red */}
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${mergeable ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-red-500 dark:bg-red-400'}`} />
                <span className="text-xs font-medium theme-text-secondary">{mergeable ? '병합 가능' : '병합 검토'}</span>
              </div>
              
              {/* 승인 - Green */}
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium theme-text-secondary">승인 {approveCnt}</span>
              </div>
              
              {/* 리뷰 - Yellow */}
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium theme-text-secondary">리뷰 {reviewCommentCnt}</span>
              </div>
              
              {/* 파일 - Orange */}
              <div className="flex items-center space-x-1">
                <FileDiff className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-medium theme-text-secondary">파일 {changedFilesCnt}</span>
              </div>
            </div>
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
            {state === 'OPEN' &&
              (() => {
                // API 응답이 있으면 그걸 우선, 없으면 기존 mergeable 사용
                const effectiveMergeable = apiMergeable !== null ? apiMergeable : mergeable
                const isApproved = pr.isApproved !== false // isApproved가 false가 아닌 경우 승인된 것으로 간주

                if (!effectiveMergeable) {
                  // 머지 불가능한 경우 (충돌) - 무조건 충돌 해결 버튼
                  return (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => navigate(`/${repoId}/pr/${prId}/conflict`)}
                    >
                      충돌 해결
                    </Button>
                  )
                } else {
                  // 머지 가능한 경우 - 승인 여부에 따라 활성화/비활성화
                  return (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={handleIsMergable}
                      disabled={!isApproved}
                      title={!isApproved ? "승인이 필요합니다" : ""}
                    >
                      <GitMerge className="w-4 h-4 mr-1 mb-[2px]" />
                      머지
                    </Button>
                  )
                }
              })()}
          </div>
        </div>
      </div>
    </Box>
  )
}

export default PRCardDetail
