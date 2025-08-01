import { twMerge } from 'tailwind-merge'

const Box = ({ children, shadow = false, className, ...props }) => {
  const base = 'bg-white border-2 border-black p-4 rounded-[8px]'
  const shadowClass = shadow ? 'shadow-pixel' : ''
  return (
    <div className={twMerge(base, shadowClass, className)} {...props}>
      {children}
    </div>
  )
}

export default Box
