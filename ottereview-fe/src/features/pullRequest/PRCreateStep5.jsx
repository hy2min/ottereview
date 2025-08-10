import { useNavigate } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import { submitPR } from '@/features/pullRequest/prApi'

const PRCreateStep5 = ({ goToStep, formData, repoId }) => {
  const navigate = useNavigate()

  const handleSubmit = async () => {
    try {
      console.log(formData)
      await submitPR({formData, repoId})
      
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
              <span>{formData.title || '(없음)'}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">설명:</span>
              <span className="break-words">{formData.description || '(없음)'}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">소스 브랜치:</span>
              <span>{formData.source || '(미지정)'}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">타겟 브랜치:</span>
              <span>{formData.target || '(미지정)'}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">리뷰어:</span>
              <span>
                {formData.reviewers && formData.reviewers.length > 0 
                  ? formData.reviewers.join(', ') 
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