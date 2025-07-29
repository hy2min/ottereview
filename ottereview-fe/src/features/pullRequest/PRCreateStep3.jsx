import NavigationButton from '../../components/Buttons/NavigationButton'
import FormSectionBox from '../../components/FormSectionBox'
import { usePRCreateStore } from './stores/prCreateStore'

const mockReviewers = ['heejoo', 'alice', 'bob', 'charlie']

const PRCreateStep3 = ({ goToStep }) => {
  const { formData, setFormData } = usePRCreateStore()

  const handleSelect = (name) => {
    if (!formData.reviewers.includes(name)) {
      setFormData({ reviewers: [...formData.reviewers, name] })
    }
  }

  const handleDeselect = (name) => {
    setFormData({
      reviewers: formData.reviewers.filter((r) => r !== name),
    })
  }

  return (
    <div className="space-y-4">
      <FormSectionBox title={`PR 생성 3`}>
        <div className="space-y-2">
          <div className="flex gap-8">
            <div className="w-1/2 border p-4">
              <h3 className="mb-2">리뷰어 목록</h3>
              {mockReviewers
                .filter((name) => !formData.reviewers.includes(name))
                .map((name) => (
                  <div key={name} className="flex justify-between mb-1">
                    <span>{name}</span>
                    <button
                      className="border px-2 py-0.5"
                      onClick={() => handleSelect(name)}
                      disabled={formData.reviewers.includes(name)}
                    >
                      추가
                    </button>
                  </div>
                ))}
            </div>

            <div className="w-1/2 border p-4">
              <h3 className="mb-2">선택된 리뷰어</h3>
              {formData.reviewers.map((name) => (
                <div key={name} className="flex justify-between mb-1">
                  <span>{name}</span>
                  <button className="border px-2 py-0.5" onClick={() => handleDeselect(name)}>
                    제거
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FormSectionBox>

      {/* 이동 버튼 */}
      <NavigationButton onPrev={() => goToStep(2)} onNext={() => goToStep(4)} />
    </div>
  )
}

export default PRCreateStep3
