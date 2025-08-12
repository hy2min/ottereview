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
    default: 'theme-bg-tertiary theme-text border theme-border',
    success: 'bg-green-100 text-green-700 border border-green-200',
    warning: 'bg-amber-100 text-amber-700 border border-amber-200',
    danger: 'bg-red-100 text-red-700 border border-red-200',
    primary: 'bg-blue-100 text-blue-700 border border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border border-orange-200',
    pink: 'bg-pink-100 text-pink-700 border border-pink-200',
    teal: 'bg-teal-100 text-teal-700 border border-teal-200',
    cyan: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
    indigo: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    lime: 'bg-lime-100 text-lime-700 border border-lime-200',
    amber: 'bg-amber-100 text-amber-700 border border-amber-200',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200',
    rose: 'bg-rose-100 text-rose-700 border border-rose-200',
    sky: 'bg-sky-100 text-sky-700 border border-sky-200',
    emerald: 'bg-emerald-100 text-emerald-700 border border-emerald-200',

    // 우선순위 전용
    priorityLow: 'theme-bg-tertiary theme-text-muted border theme-border',
    priorityMedium: 'bg-amber-100 text-amber-700 border border-amber-200',
    priorityHigh: 'bg-red-600 text-white border border-red-600',
  }

  const sizeClasses = {
    xs: 'px-1.5 py-1 text-[11px]',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-xs',
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
