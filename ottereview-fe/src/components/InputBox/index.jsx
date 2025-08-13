import MDEditor from '@uiw/react-md-editor'
import { twMerge } from 'tailwind-merge'

import CustomSelect from '@/components/InputBox/CustomSelect'

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
  const base = 'bg-white border-2 border-black rounded-[8px]'

  const inputSpecificClasses = 'w-full px-2 py-1'
  const textareaSpecificClasses = 'w-full px-2 py-1 resize-none h-full min-h-20'

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
              data-color-mode="light"
              height="100%"
              visibleDragBar={false}
              preview="edit"
              className="!border-2 !border-black !rounded-[8px] !shadow-none [&_.w-md-editor-toolbar]:!bg-transparent"
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
    <div className={`relative ${as === 'textarea' ? 'flex flex-col h-full' : 'space-y-1'}`}>
      <label className="block font-medium mb-1">{label}</label>
      <div className={as === 'textarea' ? 'flex-1 min-h-0' : ''}>{renderControl()}</div>
    </div>
  )
}

export default InputBox
