import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Rocket, Settings } from 'lucide-react'

import Box from '@/components/Box'
import Button from '@/components/Button'
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
      alert('PR이 성공적으로 생성되었습니다!')

      // 레포 상세 페이지로 이동
      navigate(`/${repoId}`)
    } catch (err) {
      console.error(err)
      alert('제출 실패')
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 rounded-lg glass-effect animate-fade-in-up stagger-1">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold theme-text">PR 제목</span>
                </div>
                <p className="theme-text-secondary pl-6">{prTitle || '설정되지 않음'}</p>
              </div>
              
              <div className="p-4 rounded-lg glass-effect animate-fade-in-up stagger-2">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">🔄</span>
                  <span className="font-semibold theme-text">브랜치 정보</span>
                </div>
                <div className="pl-6 space-y-1">
                  <p className="theme-text-secondary">
                    <span className="font-medium text-orange-600 dark:text-orange-400">{validationBranches?.source || '미지정'}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">{validationBranches?.target || '미지정'}</span>
                  </p>
                </div>
              </div>
              
              <div className="p-4 rounded-lg glass-effect animate-fade-in-up stagger-3">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">👥</span>
                  <span className="font-semibold theme-text">리뷰어</span>
                </div>
                <div className="pl-6">
                  {selectedReviewers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedReviewers.map((reviewer) => (
                        <span key={reviewer.githubUsername} className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-md text-sm">
                          {reviewer.githubUsername}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="theme-text-muted">선택되지 않음</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg glass-effect animate-fade-in-up stagger-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">📜</span>
                  <span className="font-semibold theme-text">PR 설명</span>
                </div>
                <div className="pl-6 max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm theme-text-secondary">{prBody || '설정되지 않음'}</pre>
                </div>
              </div>
              
              <div className="p-4 rounded-lg glass-effect animate-fade-in-up stagger-5">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">🤖</span>
                  <span className="font-semibold theme-text">AI 요약</span>
                </div>
                <div className="pl-6 max-h-32 overflow-y-auto">
                  <p className="text-sm theme-text-secondary">{aiSummary || '생성되지 않음'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Box>
      <div className="mx-auto z-10 animate-fade-in-up animate-delay-400">
        <div className="flex justify-center items-center space-x-4">
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
