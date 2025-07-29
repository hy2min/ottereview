import { useNavigate } from 'react-router-dom'

import NavigationButton from '../../components/Buttons/NavigationButton'
import FormSectionBox from '../../components/FormSectionBox'
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
            <p>PR 제목: {formData.title || '(없음)'}</p>
          </p>
          <p>
            <p>설명: {formData.description || '(없음)'}</p>
          </p>
          <p>
            <p>타겟 브랜치: {formData.targetBranch || '(미지정)'}</p>
          </p>
          <p>
            <p>
              선택된 리뷰어:{' '}
              {formData.reviewers.length > 0 ? formData.reviewers.join(', ') : '(없음)'}
            </p>
          </p>
        </div>
      </FormSectionBox>

      {/* 하단 버튼 */}
      <NavigationButton onPrev={() => goToStep(3)} onNext={handleSubmit} nextLabel="제출" />
    </div>
  )
}

export default PRCreateStep4
