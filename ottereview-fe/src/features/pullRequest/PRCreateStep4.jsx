import { usePRCreateStore } from './stores/prCreateStore'

const PRCreateStep4 = () => {
  const formData = usePRCreateStore((state) => state.formData)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p>PR 제목: {formData.title || '(없음)'}</p>
        <p>설명: {formData.description || '(없음)'}</p>
        <p>타겟 브랜치: {formData.targetBranch || '(미지정)'}</p>
        <p>
          선택된 리뷰어: {formData.reviewers.length > 0 ? formData.reviewers.join(', ') : '(없음)'}
        </p>
      </div>
    </div>
  )
}

export default PRCreateStep4
