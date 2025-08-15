import { useEffect, useMemo, useState } from 'react'

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
    <div className="space-y-4">
      <div className="flex space-x-4">
        <Box shadow className="w-1/2 h-80 flex flex-col">
          <h3 className="mb-2 flex-shrink-0">리뷰어 목록</h3>
          <div className="flex-1 overflow-y-auto">
            {reviewers.length > 0 ? (
              reviewers
                .filter(
                  (reviewer) =>
                    !selectedReviewers.some(
                      (selected) => selected.githubUsername === reviewer.githubUsername
                    )
                )
                .map((reviewer) => (
                  <div
                    key={reviewer.githubUsername}
                    className="flex justify-between items-center my-4 mr-2"
                  >
                    <div className="flex items-center space-x-2">
                      <span>{reviewer.githubUsername}</span>
                      {isAIRecommended(reviewer.githubUsername) && (
                        <Badge variant="primary" size="md">
                          AI 추천
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => handleSelect(reviewer.githubUsername)}
                      disabled={selectedReviewers.some(
                        (selected) => selected.githubUsername === reviewer.githubUsername
                      )}
                      variant=""
                      size="sm"
                    >
                      추가
                    </Button>
                  </div>
                ))
            ) : (
              <div className="text-gray-500 text-sm py-4">리뷰 요청 가능한 협업자가 없습니다.</div>
            )}
          </div>
        </Box>

        <Box shadow className="w-1/2 h-80 flex flex-col">
          <h3 className="mb-2 flex-shrink-0">선택된 리뷰어</h3>
          <div className="flex-1 overflow-y-auto">
            {selectedReviewers.length > 0 ? (
              selectedReviewers.map((reviewer) => (
                <div
                  key={reviewer.githubUsername}
                  className="flex justify-between items-center my-4 mr-2"
                >
                  <div className="flex items-center space-x-2">
                    <span>{reviewer.githubUsername}</span>
                    {isAIRecommended(reviewer.githubUsername) && (
                      <Badge variant="primary" size="xs">
                        AI
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDeselect(reviewer.githubUsername)}
                    variant=""
                    size="sm"
                  >
                    제거
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm py-4">선택된 리뷰어가 없습니다.</div>
            )}
          </div>
        </Box>
      </div>
      <div className="mx-auto z-10">
        <div className="flex justify-center items-center space-x-3">
          <Button
            onClick={() => {
              goToStep(3)
            }}
            variant="secondary"
          >
            이전
          </Button>

          <Button onClick={handleNextStep} variant="primary" disabled={isGenerating}>
            {isGenerating ? 'AI 요약 생성중...' : '다음'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PRCreateStep4
