import Button from '../../components/Button'
import { usePRCreateStore } from './stores/prCreateStore'

const mockReviewers = ['heejoo', 'alice', 'bob', 'charlie']

const PRCreateStep3 = () => {
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
      <div className="flex gap-8">
        <div className="w-1/2 border p-4">
          <h3 className="mb-2">리뷰어 목록</h3>
          {mockReviewers
            .filter((name) => !formData.reviewers.includes(name))
            .map((name) => (
              <div key={name} className="flex justify-between my-4">
                <span>{name}</span>
                <Button
                  onClick={() => handleSelect(name)}
                  disabled={formData.reviewers.includes(name)}
                  variant=""
                  size="sm"
                >
                  추가
                </Button>
              </div>
            ))}
        </div>

        <div className="w-1/2 border p-4">
          <h3 className="mb-2">선택된 리뷰어</h3>
          {formData.reviewers.map((name) => (
            <div key={name} className="flex justify-between my-4">
              <span>{name}</span>
              <Button onClick={() => handleDeselect(name)} variant="" size="sm">
                제거
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PRCreateStep3
