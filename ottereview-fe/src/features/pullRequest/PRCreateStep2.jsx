import InputBox from '../../components/InputBox'
import { usePRCreateStore } from './stores/prCreateStore'

const PRCreateStep2 = () => {
  const { formData, setFormData } = usePRCreateStore()


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
          label="PR 설명"
          as="textarea" // as="textarea" 지정
          value={formData.description || ''}
          onChange={(e) => setFormData({ description: e.target.value })}
        />

        {/* 타겟 브랜치 (select) */}
        <InputBox
          label="타겟 브랜치"
          as="select"
          options={[
            // options prop으로 옵션 배열 전달
            { label: '브랜치를 선택하세요', value: '' }, // 기본 선택 옵션
            { label: 'main', value: 'main' },
            { label: 'develop', value: 'develop' },
          ]}
          value={formData.targetBranch || ''}
          onChange={(e) => setFormData({ targetBranch: e.target.value })}
        />

      </div>
      <div className="bg-white border-2 border-black p-4 rounded-[8px]">파일별 코드 미리보기 박스 (mock)</div>
    </div>
  )
}

export default PRCreateStep2
