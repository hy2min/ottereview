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

  const baseBoxClasses = 'theme-bg-secondary border theme-border w-full box-border'

  const selectBoxClasses = twMerge(
    baseBoxClasses,
    'px-3 py-2 theme-text',
    isOpen ? 'rounded-t-lg rounded-b-none border-b-transparent' : 'rounded-lg',
    'cursor-pointer transition-colors hover:theme-bg-tertiary'
  )

  const dropdownBoxClasses = twMerge(
    baseBoxClasses,
    'absolute z-10 top-full left-0 max-h-60 overflow-y-auto theme-shadow-lg border-t-0',
    'rounded-b-lg rounded-t-none'
  )

  const getOptionClass = (optionValue) => {
    const isSelected = optionValue === selectedOption?.value
    return twMerge(
      'px-3 py-2 cursor-pointer transition-colors theme-text',
      isSelected ? 'bg-orange-500 text-white' : 'hover:theme-bg-tertiary'
    )
  }

  return (
    <div ref={selectRef} className="relative w-full" {...props}>
      <div className={selectBoxClasses} onClick={() => setIsOpen(!isOpen)}>
        <div className="flex justify-between items-center">
          <span className={selectedOption ? 'theme-text' : 'theme-text-muted'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`w-4 h-4 transform transition-transform theme-text-secondary ${isOpen ? 'rotate-180' : ''}`}
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
