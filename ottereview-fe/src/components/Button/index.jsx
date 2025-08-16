import { clsx } from 'clsx'
import { useEffect, useRef } from 'react'
import { twMerge } from 'tailwind-merge'

const Button = ({ children, variant = 'primary', size = 'md', className, onClick, ...props }) => {
  const buttonRef = useRef(null)

  const baseClasses =
    'inline-flex items-center justify-center rounded-lg font-medium focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer'

  const variants = {
    primary: 'bg-orange-600 dark:bg-orange-700 text-white hover:bg-orange-700 dark:hover:bg-orange-600 active:bg-orange-800 dark:active:bg-orange-500 shadow-sm hover:shadow-md',
    secondary: 'theme-bg-secondary theme-text hover:theme-bg-tertiary border theme-border shadow-sm hover:shadow-md',
    success: 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600 active:bg-green-800 dark:active:bg-green-500 shadow-sm hover:shadow-md',
    danger: 'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600 active:bg-red-800 dark:active:bg-red-500 shadow-sm hover:shadow-md',
    outline: 'border-2 theme-border theme-bg-primary theme-text hover:theme-bg-tertiary',
    ghost: 'theme-text hover:theme-bg-tertiary rounded-md',
    header: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 shadow-sm hover:shadow-md',
    theme: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600',
  }

  const sizes = {
    xs: 'p-2.5 text-sm',
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
    xl: 'px-4 py-2.5 text-sm',
  }

  const classes = twMerge(clsx(baseClasses, variants[variant], sizes[size]), className)

  useEffect(() => {
    const handleMouseUp = () => {
      buttonRef.current?.blur()
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  return (
    <button ref={buttonRef} className={classes} {...props} onClick={onClick}>
      {children}
    </button>
  )
}

export default Button
