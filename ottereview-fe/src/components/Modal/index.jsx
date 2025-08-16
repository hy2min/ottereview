import { useEffect } from 'react'
import { twMerge } from 'tailwind-merge'

import Button from '@/components/Button'

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  className,
  size = 'md',
  ...props 
}) => {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      {...props}
    >
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className={twMerge(
        'relative w-full theme-bg-primary border theme-border rounded-lg theme-shadow-lg',
        sizeClasses[size],
        className
      )}>
        {/* 헤더 */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b theme-border">
            <h3 className="text-lg font-semibold theme-text">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
            >
              ✕
            </Button>
          </div>
        )}
        
        {/* 바디 */}
        <div className="p-4">
          {children}
        </div>
        
        {/* 푸터 */}
        {footer && (
          <div className="flex justify-end gap-2 p-4 border-t theme-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal