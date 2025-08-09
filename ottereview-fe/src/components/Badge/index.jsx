import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const Badge = ({
  children,
  variant = 'default',
  size = 'lg',
  withDot = false,
  className,
  ...props
}) => {
  const base = 'inline-flex items-center rounded-full font-medium'
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    primary: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    pink: 'bg-pink-100 text-pink-800',
    teal: 'bg-teal-100 text-teal-800',
    cyan: 'bg-cyan-100 text-cyan-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    lime: 'bg-lime-100 text-lime-800',
    amber: 'bg-amber-100 text-amber-800',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-800',
    rose: 'bg-rose-100 text-rose-800',
    sky: 'bg-sky-100 text-sky-800',
    emerald: 'bg-emerald-100 text-emerald-800',

    // 우선순위 전용
    priorityLow: 'bg-gray-200 text-gray-800',
    priorityMedium: 'bg-amber-200 text-amber-900',
    priorityHigh: 'bg-red-500 text-white',
  }

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[11px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  }

  const classes = twMerge(clsx(base, variantClasses[variant], sizeClasses[size]), className)

  return (
    <span className={classes} {...props}>
      {withDot && <Dot />}
      {children}
    </span>
  )
}

export default Badge
