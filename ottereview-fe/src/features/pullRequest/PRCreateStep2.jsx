import InputBox from '../../components/InputBox'
import { usePRCreateStore } from './stores/prCreateStore'

const PRCreateStep2 = () => {
  const { formData, setFormData } = usePRCreateStore()

  const branchOptions = [
    { label: '브랜치를 선택하세요', value: '' },
    { label: 'main', value: 'main' },
    { label: 'develop', value: 'develop' },
    { label: 'feature/new-feature', value: 'feature/new-feature' },
    { label: 'bugfix/issue-123', value: 'bugfix/issue-123' },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <InputBox
          label="소스 브랜치"
          as="select"
          options={branchOptions}
          value={formData.sourceBranch || ''}
          onChange={(e) => setFormData({ sourceBranch: e.target.value })}
          placeholder="소스 브랜치를 선택하세요"
        />

        <InputBox
          label="타겟 브랜치"
          as="select"
          options={branchOptions}
          value={formData.targetBranch || ''}
          onChange={(e) => setFormData({ targetBranch: e.target.value })}
          placeholder="타겟 브랜치를 선택하세요"
        />
      </div>
      {/* 추가 UI */}
      {formData.sourceBranch &&
        formData.targetBranch &&
        formData.sourceBranch !== formData.targetBranch && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-blue-800">
            <strong>{formData.sourceBranch}</strong> 에서 <strong>{formData.targetBranch}</strong>{' '}
            로의 변경을 생성합니다.
          </div>
        )}
      {formData.sourceBranch &&
        formData.targetBranch &&
        formData.sourceBranch === formData.targetBranch && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-800">
            소스 브랜치와 타겟 브랜치가 동일합니다.
          </div>
        )}
    </div>
  )
}

export default PRCreateStep2
