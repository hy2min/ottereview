import { X } from 'lucide-react'
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
  variant = 'default', // 'default', 'alert', 'confirm'
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

  // variant에 따른 스타일링
  const variantClasses = {
    default: 'theme-bg-primary border theme-border',
    alert: 'bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 shadow-xl',
    confirm: 'bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 shadow-xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      {...props}
    >
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={variant === 'default' ? onClose : undefined} // alert/confirm은 배경 클릭으로 닫기 비활성화
      />

      {/* 모달 컨텐츠 */}
      <div
        className={twMerge(
          'relative w-full rounded-xl shadow-2xl animate-in zoom-in-95 duration-200',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
      >
        {/* 헤더 - default variant일 때만 제목과 닫기 버튼 표시 */}
        {variant === 'default' && title && (
          <div className="flex items-center justify-between p-6">
            <h3 className="font-semibold theme-text text-lg">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* 바디 */}
        <div
          className={twMerge(
            variant === 'default' && title && 'p-4',
            variant === 'default' && !title && 'p-6',
            variant !== 'default' && 'p-6'
          )}
        >
          {children}
        </div>

        {/* 푸터 */}
        {footer && (
          <div
            className={twMerge(
              'flex gap-3 px-6 pb-6',
              variant === 'default' && 'justify-end',
              variant !== 'default' && 'justify-center'
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
