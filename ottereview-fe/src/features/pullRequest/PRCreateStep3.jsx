import { usePRCreateStore } from './prCreateStore'

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
      <div className="p-4 border">
        <h2 className="text-xl font-bold mb-4">PR 생성 3</h2>

        <div className="space-y-2">
          <div className="flex gap-8">
            <div className="w-1/2 border p-4">
              <h3 className="font-bold mb-2">리뷰어 목록</h3>
              {mockReviewers.map((name) => (
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
              <h3 className="font-bold mb-2">선택된 리뷰어</h3>
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
      </div>

      {/* 이동 버튼 */}
      <div className="flex justify-between">
        <button className="border px-4 py-1" onClick={() => goToStep(2)}>
          이전
        </button>
        <button className="border px-4 py-1" onClick={() => goToStep(4)}>
          다음
        </button>
      </div>
    </div>
  )
}

export default PRCreateStep3
