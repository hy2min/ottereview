import { twMerge } from 'tailwind-merge'

const Box = ({ children, shadow = false, pixelHover = false, className, as: Component = 'div', onClick, ...props }) => {
  const base = 'theme-bg-secondary border theme-border p-4 rounded-lg transition-colors duration-200'
  const shadowClass = shadow ? 'theme-shadow' : ''
  const hoverClass = pixelHover ? 'hover:theme-shadow-lg hover:-translate-y-0.5 transition-all duration-200' : ''
  const cursorClass = onClick ? 'cursor-pointer' : ''
  
  return (
    <Component 
      className={twMerge(base, shadowClass, hoverClass, cursorClass, className)} 
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  )
}

export default Box
