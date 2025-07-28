import { useNavigate } from 'react-router-dom'

import { submitPR } from './prApi'
import { usePRCreateStore } from './prCreateStore'

const PRCreateStep4 = ({ goToStep }) => {
  const navigate = useNavigate()
  const formData = usePRCreateStore((state) => state.formData)

  const handleSubmit = async () => {
    try {
      await submitPR(formData)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      alert('제출 실패')
    }
  }

  return (
    <div className="space-y-4">
      {/* 정보 요약 박스 */}
      <div className="p-4 border">
        <h2 className="text-xl font-bold mb-4">PR 생성 4</h2>

        <div className="space-y-2">
          <p>
            <strong>PR 제목:</strong> {formData.title || '(없음)'}
          </p>
          <p>
            <strong>설명:</strong> {formData.description || '(없음)'}
          </p>
          <p>
            <strong>타겟 브랜치:</strong> {formData.targetBranch || '(미지정)'}
          </p>
          <p>
            <strong>선택된 리뷰어:</strong>{' '}
            {formData.reviewers.length > 0 ? formData.reviewers.join(', ') : '(없음)'}
          </p>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-between">
        <button className="border px-4 py-1" onClick={() => goToStep(3)}>
          이전
        </button>
        <button className="border px-4 py-1" onClick={handleSubmit}>
          제출
        </button>
      </div>
    </div>
  )
}

export default PRCreateStep4
