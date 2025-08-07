import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const Badge = ({ children, variant = 'default', size = 'lg', className, ...props }) => {
  const base = 'inline-flex items-center rounded-full font-medium'
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
  }
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  }

  const classes = twMerge(clsx(base, variantClasses[variant], sizeClasses[size]), className)

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}

export default Badge
