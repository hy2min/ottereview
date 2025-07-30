import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const Button = ({ children, variant = 'primary', size = 'md', className, ...props }) => {
  const layoutClasses = 'inline-flex items-center justify-center rounded-[8px], font-medium'
  const visualClasses = 'border-2 border-black shadow-pixel [image-rendering:pixelated]'
  const interactionClasses = [
    'transition-all duration-200',
    'hover:shadow-pixel-lg hover:-translate-y-1',
    'active:shadow-pixel-inset active:translate-y-0',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
  ]

  const baseClasses = clsx(layoutClasses, visualClasses, interactionClasses)

  const variants = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const classes = twMerge(clsx(baseClasses, variants[variant], sizes[size]), className)

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button
