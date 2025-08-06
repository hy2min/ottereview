import InputBox from '../../components/InputBox'
import { usePRCreateStore } from './stores/prCreateStore'

const conventionOptions = [
  { label: '선택 안 함', value: '' },
  { label: 'camelCase', value: 'camelCase' },
  { label: 'PascalCase', value: 'PascalCase' },
  { label: 'snake_case', value: 'snake_case' },
  { label: 'kebab-case', value: 'kebab-case' },
  { label: 'CONSTANT_CASE', value: 'CONSTANT_CASE' },
]

const PRCreateStep1 = () => {
  const formData = usePRCreateStore((state) => state.formData)
  const setFormData = usePRCreateStore((state) => state.setFormData)

  return (
    <div className="space-y-4">
      <InputBox
        label="파일명 규칙"
        as="select"
        options={conventionOptions}
        value={formData.file_names || ''}
        onChange={(e) => setFormData({ file_names: e.target.value })}
      />
      <InputBox
        label="함수명 규칙"
        as="select"
        options={conventionOptions}
        value={formData.function_names || ''}
        onChange={(e) => setFormData({ function_names: e.target.value })}
      />
      <InputBox
        label="변수명 규칙"
        as="select"
        options={conventionOptions}
        value={formData.variable_names || ''}
        onChange={(e) => setFormData({ variable_names: e.target.value })}
      />
      <InputBox
        label="클래스명 규칙"
        as="select"
        options={conventionOptions}
        value={formData.class_names || ''}
        onChange={(e) => setFormData({ class_names: e.target.value })}
      />
      <InputBox
        label="상수명 규칙"
        as="select"
        options={conventionOptions}
        value={formData.constant_names || ''}
        onChange={(e) => setFormData({ constant_names: e.target.value })}
      />
    </div>
  )
}

export default PRCreateStep1
