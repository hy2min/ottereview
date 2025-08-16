import { GitBranch,X } from 'lucide-react'
import { useEffect, useState } from 'react'

const Toast = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 애니메이션을 위한 딜레이
    setTimeout(() => setIsVisible(true), 100)
    
    // 자동 닫기 (5초 후)
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(toast.id), 300) // 애니메이션 완료 후 제거
    }, 10000)

    return () => clearTimeout(timer)
  }, [toast.id, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(toast.id), 300)
  }

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        bg-white border-2 border-black rounded-lg shadow-lg p-4 mb-3 min-w-80 max-w-96
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-green-500 border-2 border-black rounded-lg flex items-center justify-center">
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm theme-text">
              {toast.pusherName}님이 <span className="text-orange-600 dark:text-orange-400">{toast.branchName}</span> 브랜치에 푸시했습니다
            </p>
            <button 
              onClick={handleClose}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 theme-text-secondary" />
            </button>
          </div>
          
          <p className="text-sm theme-text-secondary mt-1">
            <span className="font-medium">{toast.repoName}</span>
          </p>
          
          <p className="text-xs theme-text-muted mt-1">
            {toast.commitCount}개 커밋 • 방금 전
          </p>
        </div>
      </div>
    </div>
  )
}

const ToastContainer = ({ toasts, onCloseToast }) => {
  console.log('🍞 ToastContainer 렌더링:', toasts)
  
  if (toasts.length === 0) {
    console.log('🍞 토스트 없음')
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {toasts.map((toast) => (
        <Toast 
          key={toast.id} 
          toast={toast} 
          onClose={onCloseToast}
        />
      ))}
    </div>
  )
}

export default ToastContainer