import InputBox from '../../components/InputBox'
import { usePRCreateStore } from './stores/prCreateStore'

const PRCreateStep3 = () => {
  const formData = usePRCreateStore((state) => state.formData)
  const setFormData = usePRCreateStore((state) => state.setFormData)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {/* PR 제목 (기본 input type="text") */}
        <InputBox
          label="PR 제목"
          value={formData.title || ''}
          onChange={(e) => setFormData({ title: e.target.value })}
        />

        {/* PR 설명 (textarea) */}
        <InputBox
          className="h-50"
          label="PR 설명"
          as="textarea"
          value={formData.description || ''}
          onChange={(e) => setFormData({ description: e.target.value })}
        />
      </div>
      <div className="bg-white border-2 border-black p-4 rounded-[8px]">
        파일별 코드 미리보기 박스 (mock)
      </div>
    </div>
  )
}

export default PRCreateStep3
