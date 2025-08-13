import { clsx } from 'clsx'
import { useEffect, useRef } from 'react'
import { twMerge } from 'tailwind-merge'

const Button = ({ children, variant = 'primary', size = 'md', className, onClick, ...props }) => {
  const buttonRef = useRef(null)

  const baseClasses =
    'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none'

  const variants = {
    primary: 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 dark:active:bg-blue-500 shadow-sm hover:shadow-md',
    secondary: 'theme-bg-secondary theme-text hover:theme-bg-tertiary border theme-border shadow-sm hover:shadow-md',
    success: 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600 active:bg-green-800 dark:active:bg-green-500 shadow-sm hover:shadow-md',
    danger: 'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600 active:bg-red-800 dark:active:bg-red-500 shadow-sm hover:shadow-md',
    outline: 'border-2 theme-border theme-bg-primary theme-text hover:theme-bg-tertiary',
    ghost: 'theme-text hover:theme-bg-tertiary rounded-md',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
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
