import { ArrowRight, FileText, Rocket, Settings, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import { useModalContext } from '@/components/ModalProvider'
import { submitPR } from '@/features/pullRequest/prApi'

const PRCreateStep5 = ({
  goToStep,
  repoId,
  validationBranches,
  prTitle,
  prBody,
  selectedReviewers,
  resetCommentStates,
  reviewComments,
  audioFiles,
  aiSummary,
}) => {
  const navigate = useNavigate()
  const { success, error } = useModalContext()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (isSubmitting) return // 중복 실행 방지

    setIsSubmitting(true)
    try {
      const submitData = {
        source: validationBranches.source,
        target: validationBranches.target,
        repoId,
        reviewComments,
        audioFiles,
      }
      await submitPR(submitData)

      // PR 생성 완료 시 댓글 상태 초기화
      resetCommentStates?.()

      // 성공 알림 표시
      success('PR이 성공적으로 생성되었습니다!', {
        onClose: () => {
          // 레포 상세 페이지로 이동
          navigate(`/${repoId}`)
        },
      })
    } catch (err) {
      console.error(err)
      error('제출 실패')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-in-right">
      <div className="text-center mb-6 animate-fade-in-up">
        <h2 className="text-2xl font-semibold theme-text mb-2">최종 확인</h2>
        <p className="theme-text-secondary">생성할 PR 정보를 확인하고 제출해주세요</p>
      </div>

      <Box shadow className="premium-card animate-scale-in">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-6 h-6 text-orange-500" />
            <h3 className="text-xl font-semibold theme-text">PR 생성 정보 확인</h3>
          </div>
          {/* PR 제목 - 맨위 전체 너비 */}
          <div className="p-4 rounded-lg glass-effect mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-5 h-5 text-orange-500" />
              <span className="font-semibold theme-text">PR 제목</span>
            </div>
            <p className="theme-text-secondary pl-6 text-xl font-medium">
              {prTitle || '설정되지 않음'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 좌측 컬럼: 브랜치정보, AI요약 */}
            <div className="flex flex-col space-y-4">
              {/* 브랜치 정보 */}
              <div className="p-4 rounded-lg glass-effect">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">🔄</span>
                  <span className="font-semibold theme-text">브랜치 정보</span>
                </div>
                <div className="pl-6">
                  <div className="flex items-center text-sm theme-text-secondary">
                    <span className="font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900 px-2 py-1 rounded">
                      {validationBranches?.source || '미지정'}
                    </span>
                    <ArrowRight className="w-4 h-4 mx-2 text-gray-500" />
                    <span className="font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900 px-2 py-1 rounded">
                      {validationBranches?.target || '미지정'}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI 요약 */}
              <div className="p-4 rounded-lg glass-effect flex-1">
                <div className="flex flex-col h-full">
                  <div className="flex items-center space-x-2 mb-3 flex-shrink-0">
                    <span className="text-lg">🤖</span>
                    <span className="font-semibold theme-text">AI 요약</span>
                  </div>
                  <div className="pl-6 overflow-y-auto flex-1 max-h-80">
                    <p className="text-sm theme-text-secondary leading-relaxed">
                      {aiSummary || '생성되지 않음'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측 컬럼: 리뷰어 */}
            <div className="space-y-4">
              {/* 리뷰어 목록 - PRReview 스타일 참고 */}
              <div className="p-3 rounded-lg glass-effect h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-3 flex-shrink-0">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <h3 className="font-medium theme-text">리뷰어</h3>
                  </div>
                  <div className="space-y-2 overflow-y-auto flex-1">
                    {selectedReviewers.length > 0 ? (
                      selectedReviewers.map((reviewer) => (
                        <div
                          key={reviewer.githubUsername}
                          className="flex items-center px-3 py-2 rounded-lg text-sm bg-orange-50 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700"
                        >
                          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{reviewer.githubUsername}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-start justify-start py-2 text-gray-500 dark:text-gray-400 text-sm italic">
                        지정된 리뷰어가 없습니다
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PR 설명을 맨 아래로 이동 */}
          <div className="mt-6">
            <div className="p-4 rounded-lg glass-effect">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg">📜</span>
                <span className="font-semibold theme-text">PR 설명</span>
              </div>
              <div className="pl-6">
                <pre className="whitespace-pre-wrap text-sm theme-text-secondary leading-relaxed break-words overflow-wrap-anywhere">
                  {prBody || '설정되지 않음'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </Box>
      <div className="mx-auto z-10 animate-fade-in-up">
        <div className="flex justify-center items-center space-x-4 mb-8">
          <Button
            onClick={() => {
              goToStep(4)
            }}
            variant="secondary"
            className="btn-interactive transform transition-all duration-300 hover:scale-105"
          >
            <span className="flex items-center space-x-2">
              <span>←</span>
              <span>이전</span>
            </span>
          </Button>

          <Button
            onClick={handleSubmit}
            variant="primary"
            disabled={isSubmitting}
            className="btn-interactive glow-on-hover transform transition-all duration-300 hover:scale-105 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold px-8 py-3 shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
          >
            <span className="flex items-center space-x-2">
              {isSubmitting ? (
                <>
                  <Settings className="w-4 h-4 animate-spin" />
                  <span>PR 생성 중...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>PR 생성 완료</span>
                </>
              )}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PRCreateStep5
