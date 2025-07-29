import { useNavigate } from 'react-router-dom'

import FormSectionBox from '../../components/FormSectionBox'
import NavigationButton from '../../components/Buttons/NavigationButton'
import { submitPR } from './prApi'
import { usePRCreateStore } from './stores/prCreateStore'

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
      <FormSectionBox title={`PR 생성 4`}>
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
      </FormSectionBox>

      {/* 하단 버튼 */}
      <NavigationButton onPrev={() => goToStep(3)} onNext={handleSubmit} nextLabel="제출" />
    </div>
  )
}

export default PRCreateStep4
