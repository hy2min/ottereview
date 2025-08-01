import { useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

const CustomSelect = ({ options, value, onChange, placeholder = '선택하세요', ...props }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find((option) => option.value === value) || null
  const selectRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleOptionClick = (optionValue) => {
    onChange({ target: { value: optionValue } })
    setIsOpen(false)
  }

  const baseBoxClasses = 'bg-white border-2 border-black w-full box-border'

  const selectBoxClasses = twMerge(
    baseBoxClasses,
    'px-2 py-1',
    isOpen ? 'rounded-t-[8px] rounded-b-none' : 'rounded-[8px]',
    'cursor-pointer'
  )

  const dropdownBoxClasses = twMerge(
    baseBoxClasses,
    'absolute z-10 top-full left-0 max-h-60 overflow-y-auto shadow-lg border-t-0',
    'rounded-b-[8px] rounded-t-none'
  )

  const getOptionClass = (optionValue) => {
    const isSelected = optionValue === selectedOption?.value
    return twMerge(
      'p-2 cursor-pointer',
      isSelected ? 'bg-blue-500 text-white' : 'hover:bg-blue-100'
    )
  }

  return (
    <div ref={selectRef} className="relative w-full" {...props}>
      <div className={selectBoxClasses} onClick={() => setIsOpen(!isOpen)}>
        <div className="flex justify-between items-center">
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
          <svg
            className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <ul className={dropdownBoxClasses}>
          {options.map((option) => (
            <li
              key={option.value}
              className={getOptionClass(option.value)}
              onClick={(e) => {
                e.stopPropagation()
                handleOptionClick(option.value)
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default CustomSelect
