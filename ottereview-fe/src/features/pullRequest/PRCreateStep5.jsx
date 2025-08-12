import { useNavigate } from 'react-router-dom'

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
}) => {
  const navigate = useNavigate()

  const handleSubmit = async () => {
    try {
      const submitData = {
        source: validationBranches.source,
        target: validationBranches.target,
        repoId,
      }
      console.log('PR 제출 데이터:', submitData)
      await submitPR(submitData)
      
      // PR 생성 완료 시 댓글 상태 초기화
      resetCommentStates?.()
      
      // navigate('/dashboard')
    } catch (err) {
      console.error(err)
      alert('제출 실패')
    }
  }

  return (
    <div className="space-y-4">
      <Box shadow>
        <div className="space-y-4">
          <h3 className="text-lg font-medium mb-4">PR 생성 정보 확인</h3>
          <div className="space-y-2">
            <div className="flex">
              <span className="font-medium w-24">PR 제목:</span>
              <span>{prTitle || '(없음)'}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">설명:</span>
              <span className="break-words">{prBody || '(없음)'}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">소스 브랜치:</span>
              <span>{validationBranches?.source || '(미지정)'}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">타겟 브랜치:</span>
              <span>{validationBranches?.target || '(미지정)'}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">리뷰어:</span>
              <span>
                {selectedReviewers.length > 0 
                  ? selectedReviewers.map(r => r.githubUsername).join(', ')
                  : '(없음)'}
              </span>
            </div>
          </div>
        </div>
      </Box>
      <div className="mx-auto z-10">
        <div className="flex justify-center items-center space-x-3">
          <Button
            onClick={() => {
              goToStep(4)
            }}
            variant="secondary"
          >
            이전
          </Button>

          <Button onClick={handleSubmit} variant="primary">
            제출
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PRCreateStep5