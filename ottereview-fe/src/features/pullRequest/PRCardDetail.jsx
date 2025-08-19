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
  Settings,
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
  // 머지 버튼 로딩 상태 관리
  const [isMerging, setIsMerging] = useState(false)

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

  const reviewCommentCnt = pr.reviewCommentCnt ?? 0
  const changedFilesCnt = pr.changedFilesCnt ?? 0

  const stateBadge =
    {
      OPEN: 'primary',
      CLOSED: 'danger',
      MERGED: 'success',
    }[state] || 'default'

  const handleIsMergable = async () => {
    if (isMerging) return // 이미 진행 중이면 중복 실행 방지
    
    setIsMerging(true)
    try {
      const mergeState = await IsMergable({ repoId, prId })

      // API 응답의 mergeable 값을 저장 (우선순위가 높음)
      setApiMergeable(mergeState.mergeable)

      if (mergeState.mergeable) {
        await handleMerge()
      } else {
        // 충돌 상황 안내
        alert('충돌이 발생했습니다. 충돌을 해결한 후 다시 시도해주세요.')
        // 충돌 해결 페이지로 이동
        navigate(`/${repoId}/pr/${prId}/conflict`)
      }
    } catch (err) {
      console.error('머지 가능성 확인 실패:', err)
      alert('머지 가능성을 확인하는 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsMerging(false)
    }
  }

  const handleMerge = async () => {
    try {
      const data = await doMerge({ repoId, prId })
      
      // 머지 성공
      alert('PR이 성공적으로 머지되었습니다!')
      
      // 페이지 새로고침 또는 상위 컴포넌트 상태 업데이트
      window.location.reload()
    } catch (err) {
      console.error('머지 실패:', err)
      alert('머지 중 오류가 발생했습니다. 다시 시도해주세요.')
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <Badge variant="primary">
              <div className="flex items-center space-x-1">
                <GitBranch className="w-4 h-4 mb-[2px]" />
                <span>{headBranch}</span>
                <ArrowRight className="w-4 h-4 text-gray-800" />
                <span>{baseBranch}</span>
              </div>
            </Badge>

            <div className="flex items-center space-x-3">
              {/* 병합 상태 */}
              <div className="flex items-center space-x-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    !pr.isApproved ? 'bg-yellow-500' : mergeable ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-xs theme-text-secondary">
                  {!pr.isApproved ? '승인 필요' : mergeable ? '병합 가능' : '병합 검토'}
                </span>
              </div>

              {/* 리뷰 - Yellow */}
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-yellow-500" />
                <span className="text-xs theme-text-secondary">리뷰 {reviewCommentCnt}</span>
              </div>

              {/* 파일 - Orange */}
              <div className="flex items-center space-x-1">
                <FileDiff className="w-3 h-3 text-orange-500" />
                <span className="text-xs theme-text-secondary">파일 {changedFilesCnt}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Button
              onClick={() => navigate(`/${repoId}/pr/${prId}/review`)}
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
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
                      className="whitespace-nowrap"
                    >
                      충돌 해결
                    </Button>
                  )
                } else {
                  // 머지 가능한 경우 - 승인 여부에 따라 활성화/비활성화
                  return (
                    <div className="relative group">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleIsMergable}
                        disabled={!isApproved || isMerging}
                        className="whitespace-nowrap"
                      >
                        {isMerging ? (
                          <>
                            <Settings className="w-4 h-4 mr-1 mb-[2px] animate-spin" />
                            머지 중...
                          </>
                        ) : (
                          <>
                            <GitMerge className="w-4 h-4 mr-1 mb-[2px]" />
                            머지
                          </>
                        )}
                      </Button>
                      {!isApproved && !isMerging && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg border border-gray-200 dark:border-gray-700">
                          승인 필요
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800"></div>
                        </div>
                      )}
                    </div>
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
