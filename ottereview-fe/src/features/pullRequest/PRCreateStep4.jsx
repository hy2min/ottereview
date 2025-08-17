import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, FileText, Settings } from 'lucide-react'

import Badge from '@/components/Badge'
import Box from '@/components/Box'
import Button from '@/components/Button'
import { generateAISummary, savePRAdditionalInfo } from '@/features/pullRequest/prApi'

const PRCreateStep4 = ({
  goToStep,
  repoId,
  validationBranches,
  aiOthers,
  selectedReviewers,
  setSelectedReviewers,
  setAISummary,
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const reviewers = useMemo(() => validationBranches?.preReviewers || [], [validationBranches])
  const aiRecommendedReviewers = useMemo(
    () => aiOthers?.reviewers?.result || [],
    [aiOthers]
  )
  // AI 추천 리뷰어인지 확인하는 함수
  const isAIRecommended = (githubUsername) => {
    return aiRecommendedReviewers.some(
      (aiReviewer) => aiReviewer.github_username === githubUsername
    )
  }

  // 컴포넌트 마운트 시 초기화 (이미 선택된 것이 있으면 유지)
  useEffect(() => {}, [reviewers, selectedReviewers])

  const handleSelect = (githubUsername) => {
    // 이미 선택된 리뷰어인지 확인 (객체 배열에서)
    const isAlreadySelected = selectedReviewers.some((r) => r.githubUsername === githubUsername)
    if (!isAlreadySelected) {
      const reviewerToAdd = reviewers.find((r) => r.githubUsername === githubUsername)
      if (reviewerToAdd) {
        setSelectedReviewers([...selectedReviewers, reviewerToAdd])
      }
    }
  }

  const handleDeselect = (githubUsername) => {
    setSelectedReviewers(selectedReviewers.filter((r) => r.githubUsername !== githubUsername))
  }

  const handleNextStep = async () => {
    if (isGenerating) return // 이미 진행 중이면 중복 실행 방지

    setIsGenerating(true)
    try {
      // 객체 배열에서 ID만 추출 (find 불필요!)
      const selectedReviewerIds = selectedReviewers.map((reviewer) => reviewer.id)

      // AI 요약 생성 호출
      const aiSummaryResult = await (async () => {
        try {
          const AISummary = await generateAISummary({
            source: validationBranches?.source,
            target: validationBranches?.target,
            repoId,
          })
          const result = AISummary?.result
          setAISummary(result)
          console.log('AI 요약 생성 완료')
          console.log(AISummary)
          return result
        } catch (summaryError) {
          console.error('AI 요약 생성 실패:', summaryError)
          // AI 요약 실패해도 다음 단계로 진행
          return null
        }
      })()

      // 추가 정보 저장 API 호출 (summary 포함)
      const additionalInfo = {
        source: validationBranches?.source,
        target: validationBranches?.target,
        reviewers: selectedReviewerIds || [], // null 방지
        summary: aiSummaryResult || null, // AI 요약 결과 포함
      }

      await savePRAdditionalInfo(repoId, additionalInfo)

      goToStep(5)
    } catch (error) {
      console.error('추가 정보 저장 실패:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-in-left">
      <div className="text-center mb-6 animate-fade-in-up">
        <h2 className="text-2xl font-semibold theme-text mb-2">리뷰어 선택</h2>
        <p className="theme-text-secondary">코드 리뷰를 받을 리뷰어를 선택해주세요</p>
      </div>
      
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
        <Box shadow className="w-full md:w-1/2 h-96 flex flex-col premium-card animate-slide-in-left">
          <h3 className="mb-3 flex-shrink-0 text-lg font-semibold theme-text flex items-center space-x-2">
            <span>👥</span>
            <span>리뷰어 목록</span>
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {reviewers.length > 0 ? (
              reviewers
                .filter(
                  (reviewer) =>
                    !selectedReviewers.some(
                      (selected) => selected.githubUsername === reviewer.githubUsername
                    )
                )
                .map((reviewer, index) => (
                  <div
                    key={reviewer.githubUsername}
                    className={`flex justify-between items-center p-3 mr-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-all duration-200`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                        {reviewer.githubUsername.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-medium">{reviewer.githubUsername}</span>
                        {isAIRecommended(reviewer.githubUsername) && (
                          <Badge variant="primary" size="sm" className="mt-1 animate-pulse w-fit">
                            <span className="flex items-center space-x-1">
                              <span>🤖</span>
                              <span>AI 추천</span>
                            </span>
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSelect(reviewer.githubUsername)}
                      disabled={isGenerating || selectedReviewers.some(
                        (selected) => selected.githubUsername === reviewer.githubUsername
                      )}
                      variant="primary"
                      size="sm"
                      className="btn-interactive transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <span className="flex items-center space-x-1">
                        <span>+</span>
                        <span>추가</span>
                      </span>
                    </Button>
                  </div>
                ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="text-4xl mb-2 opacity-50">👥</div>
                <div className="theme-text-muted text-sm">리뷰 요청 가능한 협업자가 없습니다.</div>
              </div>
            )}
          </div>
        </Box>

        <Box shadow className="w-full md:w-1/2 h-96 flex flex-col premium-card animate-slide-in-right">
          <h3 className="mb-3 flex-shrink-0 text-lg font-semibold theme-text flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>선택된 리뷰어</span>
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {selectedReviewers.length > 0 ? (
              selectedReviewers.map((reviewer, index) => (
                <div
                  key={reviewer.githubUsername}
                  className={`flex justify-between items-center p-3 mr-2 rounded-lg bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 transition-all duration-200`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                      {reviewer.githubUsername.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-900 font-medium">{reviewer.githubUsername}</span>
                      {isAIRecommended(reviewer.githubUsername) && (
                        <Badge variant="primary" size="xs" className="mt-1 w-fit">
                          <span className="flex items-center space-x-1">
                            <span>🤖</span>
                            <span>AI</span>
                          </span>
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDeselect(reviewer.githubUsername)}
                    disabled={isGenerating}
                    variant="danger"
                    size="sm"
                    className="btn-interactive transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <span className="flex items-center space-x-1">
                      <span>✗</span>
                      <span>제거</span>
                    </span>
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <FileText className="w-16 h-16 mb-2 opacity-30 text-orange-500" />
                <div className="theme-text-muted text-sm">선택된 리뷰어가 없습니다.</div>
              </div>
            )}
          </div>
        </Box>
      </div>
      <div className="mx-auto z-10 animate-fade-in-up">
        <div className="flex justify-center items-center space-x-4 mb-8">
          <Button
            onClick={() => {
              goToStep(3)
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
            onClick={handleNextStep} 
            variant="primary" 
            disabled={isGenerating}
            className="btn-interactive glow-on-hover transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
          >
            <span className="flex items-center space-x-2">
              {isGenerating ? (
                <>
                  <Settings className="w-4 h-4 animate-spin" />
                  <span>AI 요약 생성중...</span>
                </>
              ) : (
                <>
                  <span>다음</span>
                  <span>→</span>
                </>
              )}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PRCreateStep4
