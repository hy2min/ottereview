import { useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

const CustomSelect = ({ options, value, onChange, placeholder = '선택하세요', ...props }) => {
  const [isOpen, setIsOpen] = useState(false)
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

  const selectedOption = options.find((option) => option.value === value)

  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } })
    setIsOpen(false)
  }

  const baseClasses = 'theme-bg-secondary border theme-border w-full box-border'
  
  const selectClasses = twMerge(
    baseClasses,
    'px-3 py-2 theme-text cursor-pointer',
    isOpen ? 'rounded-t-lg border-b-transparent' : 'rounded-lg'
  )

  const dropdownClasses = twMerge(
    'border theme-border w-full box-border theme-bg-secondary',
    'absolute z-50 top-full left-0 right-0 max-h-60 overflow-y-auto rounded-b-lg border-t-transparent'
  )

  return (
    <div ref={selectRef} className="relative w-full" {...props}>
      <div 
        className={selectClasses} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex justify-between items-center">
          <span className={selectedOption ? 'theme-text' : 'theme-text-muted'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="theme-text-secondary">
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className={dropdownClasses}>
          {options.map((option) => (
            <div
              key={option.value || `empty-${option.label}`}
              className={twMerge(
                'px-3 py-2 cursor-pointer',
                option.value === value 
                  ? 'bg-orange-500 text-white' 
                  : 'theme-text hover:bg-gray-200 hover:!text-gray-900 dark:hover:bg-black/20 dark:hover:!text-white'
              )}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomSelect