import { twMerge } from 'tailwind-merge'

const Section = ({ children, className, ...props }) => {
  const baseClasses = 'bg-white border-2 border-black shadow-pixel p-4 rounded-[8px]'

  const classes = twMerge(baseClasses, className)

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export default Section
