import { GitBranch, GitPullRequest, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Toast = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()

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
        theme-bg-primary border theme-border rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/30 p-5 mb-3 min-w-80 max-w-96 backdrop-blur-sm
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm theme-text">
              {toast.pusherName}님이 <span className="text-orange-600 dark:text-orange-400">{toast.branchName}</span> 브랜치에 푸시했습니다
            </p>
            <button 
              onClick={handleClose}
              className="flex-shrink-0 p-1.5 hover:theme-bg-tertiary rounded-lg transition-colors duration-200"
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
          
          {/* PR 생성 바로가기 버튼 */}
          <div className="mt-4 pt-4 border-t theme-border">
            <button 
              onClick={() => navigate(toast.prCreateUrl)}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 hover:from-orange-600 hover:to-orange-700 dark:hover:from-orange-700 dark:hover:to-orange-800 text-white text-sm font-medium rounded-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <GitPullRequest className="w-4 h-4" />
              PR 생성하러 가기
            </button>
          </div>
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