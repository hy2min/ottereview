import FormField from '../../components/FormField'
import { usePRCreateStore } from './stores/prCreateStore'

const PRCreateStep2 = () => {
  const { formData, setFormData } = usePRCreateStore()

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FormField label="PR 제목">
          <input
            className="w-full border px-2 py-1"
            type="text"
            value={formData.title || ''}
            onChange={(e) => setFormData({ title: e.target.value })}
          />
        </FormField>

        <FormField label="PR 설명">
          <textarea
            className="w-full border px-2 py-1 resize-none"
            value={formData.description || ''}
            onChange={(e) => setFormData({ description: e.target.value })}
          />
        </FormField>

        <FormField label="타겟 브랜치">
          <select
            className="w-full border px-2 py-1"
            value={formData.targetBranch || ''}
            onChange={(e) => setFormData({ targetBranch: e.target.value })}
          >
            <option value="">브랜치를 선택하세요</option>
            <option value="main">main</option>
            <option value="develop">develop</option>
          </select>
        </FormField>
      </div>
      <div className="bg-white border p-4 mt-4">파일별 코드 미리보기 박스 (mock)</div>
    </div>
  )
}

export default PRCreateStep2
