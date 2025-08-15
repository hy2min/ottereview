import MDEditor from '@uiw/react-md-editor'
import { twMerge } from 'tailwind-merge'

import CustomSelect from '@/components/InputBox/CustomSelect'
import { useThemeStore } from '@/store/themeStore'

const InputBox = ({
  label,
  as = 'input',
  type = 'text',
  options = [], // CustomSelect로 전달될 options
  value,
  onChange,
  className,
  placeholder,
  markdown = false, // 마크다운 에디터 사용 여부
  ...props
}) => {
  const { theme } = useThemeStore()
  const base = 'theme-bg-primary theme-border border-2 rounded-[8px] px-2 py-1 theme-text'

  const inputSpecificClasses = 'w-full'
  const textareaSpecificClasses = 'w-full resize-none min-h-[80px]'

  const inputClasses = twMerge(base, inputSpecificClasses, className)
  const textareaClasses = twMerge(base, textareaSpecificClasses, className)

  const renderControl = () => {
    if (as === 'textarea') {
      if (markdown) {
        return (
          <div className="h-59">
            <MDEditor
              value={value}
              onChange={(val) => onChange({ target: { value: val || '' } })}
              data-color-mode={theme === 'dark' ? 'dark' : 'light'}
              height="100%"
              visibleDragBar={false}
              preview="edit"
              className="!border-2 !rounded-[8px] !shadow-none [&_.w-md-editor-toolbar]:!bg-transparent theme-border"
            />
          </div>
        )
      }
      return (
        <textarea
          className={textareaClasses}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          {...props}
        />
      )
    }

    if (as === 'select') {
      return (
        <CustomSelect
          options={options}
          value={value}
          onChange={onChange}
          className={className}
          placeholder={placeholder} // placeholder prop 전달
          {...props} // InputBox로 넘어온 추가 props를 CustomSelect에 전달
        />
      )
    }

    return (
      <input className={inputClasses} type={type} value={value} onChange={onChange} {...props} />
    )
  }

  return (
    <div className="relative space-y-2">
      {label && <label className="block text-sm font-medium theme-text">{label}</label>}
      {renderControl()}
    </div>
  )
}

export default InputBox
