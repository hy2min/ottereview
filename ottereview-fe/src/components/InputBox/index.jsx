import { twMerge } from 'tailwind-merge'

import CustomSelect from './CustomSelect'

const InputBox = ({
  label,
  as = 'input',
  type = 'text',
  options = [], // CustomSelect로 전달될 options
  value,
  onChange,
  placeholder, // CustomSelect의 placeholder prop을 위해 추가
  ...props
}) => {
  const base = 'bg-white border-2 border-black rounded-[8px]'

  const inputSpecificClasses = 'w-full px-2 py-1'
  const textareaSpecificClasses = 'w-full px-2 py-1 resize-none'

  const inputClasses = twMerge(base, inputSpecificClasses)
  const textareaClasses = twMerge(base, textareaSpecificClasses)

  const renderControl = () => {
    if (as === 'textarea') {
      return <textarea className={textareaClasses} value={value} onChange={onChange} {...props} />
    }

    if (as === 'select') {
      return (
        <CustomSelect
          options={options}
          value={value}
          onChange={onChange}
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
    <div className="space-y-1">
      <label className="block font-medium">{label}</label>
      {renderControl()}
    </div>
  )
}

export default InputBox
