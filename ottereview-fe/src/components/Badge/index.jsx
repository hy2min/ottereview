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
    success: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700',
    warning: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
    danger: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700',
    primary: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700',
    orange: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700',
    pink: 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-700',
    teal: 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700',
    cyan: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700',
    indigo: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700',
    lime: 'bg-lime-100 dark:bg-lime-900 text-lime-700 dark:text-lime-300 border border-lime-200 dark:border-lime-700',
    amber: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
    fuchsia: 'bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-700',
    rose: 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700',
    sky: 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700',
    emerald: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700',

    // 우선순위 전용
    priorityLow: 'theme-bg-tertiary theme-text-muted border theme-border',
    priorityMedium: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
    priorityHigh: 'bg-red-600 dark:bg-red-700 text-white border border-red-600 dark:border-red-700',
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
