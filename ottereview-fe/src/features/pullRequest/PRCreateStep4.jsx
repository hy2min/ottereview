import { useEffect, useState } from 'react'

import Box from '@/components/Box'
import Button from '@/components/Button'

const PRCreateStep4 = ({ goToStep, formData, updateFormData, validationBranches }) => {
  const [selectedReviewers, setSelectedReviewers] = useState([])

  const reviewers = validationBranches?.preReviewers || []

  // 컴포넌트 마운트 시 기존 formData의 reviewers로 초기화
  useEffect(() => {
    console.log('reviewers:', reviewers)
    setSelectedReviewers(formData.reviewers || [])
  }, [formData.reviewers, reviewers])

  const handleSelect = (githubUsername) => {
    if (!selectedReviewers.includes(githubUsername)) {
      setSelectedReviewers([...selectedReviewers, githubUsername])
    }
  }

  const handleDeselect = (githubUsername) => {
    setSelectedReviewers(selectedReviewers.filter((r) => r !== githubUsername))
  }

  const handleNextStep = () => {
    updateFormData({ reviewers: selectedReviewers })
    console.log(formData)
    goToStep(5)
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <Box shadow className="w-1/2 h-80 flex flex-col">
          <h3 className="mb-2 flex-shrink-0">리뷰어 목록</h3>
          <div className="flex-1 overflow-y-auto">
            {reviewers.length > 0 ? (
              reviewers
                .filter((reviewer) => !selectedReviewers.includes(reviewer.githubUsername))
                .map((reviewer) => (
                  <div key={reviewer.githubUsername} className="flex justify-between my-4 mr-2">
                    <span>{reviewer.githubUsername}</span>
                    <Button
                      onClick={() => handleSelect(reviewer.githubUsername)}
                      disabled={selectedReviewers.includes(reviewer.githubUsername)}
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
              selectedReviewers.map((githubUsername) => (
                <div key={githubUsername} className="flex justify-between my-4 mr-2">
                  <span>{githubUsername}</span>
                  <Button onClick={() => handleDeselect(githubUsername)} variant="" size="sm">
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

          <Button onClick={handleNextStep} variant="primary">
            다음
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PRCreateStep4