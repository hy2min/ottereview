import { BookOpen, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const FloatingGuideButton = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Guide 페이지에서는 버튼을 숨김
  const shouldHide = location.pathname === '/' || location.pathname === '/guide'

  useEffect(() => {
    if (shouldHide) {
      setIsVisible(false)
      return
    }

    // 페이지 로드 후 1초 뒤에 버튼 표시
    const showTimer = setTimeout(() => {
      setIsVisible(true)
    }, 1000)

    return () => clearTimeout(showTimer)
  }, [shouldHide])

  const handleGuideClick = () => {
    navigate('/')
  }

  const handleMouseEnter = () => {
    setIsExpanded(true)
  }

  const handleMouseLeave = () => {
    setIsExpanded(false)
  }

  if (shouldHide || !isVisible) return null

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div
        className={`
          group relative flex items-center transition-all duration-300 ease-out cursor-pointer
          ${isExpanded ? 'pr-4' : ''}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleGuideClick}
      >
        {/* 확장된 텍스트 */}
        <div
          className={`
            absolute right-16 top-1/2 -translate-y-1/2 
            bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-200 
            px-4 py-2 rounded-lg shadow-lg border border-slate-200 dark:border-gray-600
            whitespace-nowrap font-medium text-sm
            transition-all duration-300 ease-out
            ${
              isExpanded
                ? 'opacity-100 translate-x-0 scale-100'
                : 'opacity-0 translate-x-4 scale-95 pointer-events-none'
            }
          `}
        >
          가이드 페이지로 이동
          {/* 화살표 */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
            <div className="w-0 h-0 border-l-[6px] border-l-white dark:border-l-gray-800 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent"></div>
          </div>
        </div>

        {/* 메인 버튼 */}
        <button
          className={`
            relative w-14 h-14 bg-gradient-to-r from-primary-500 to-primary-600 
            hover:from-primary-600 hover:to-primary-700
            text-white rounded-full shadow-lg hover:shadow-xl
            transition-all duration-300 ease-out
            flex items-center justify-center
            group-hover:scale-110 group-hover:rotate-3
            focus:outline-none focus:ring-4 focus:ring-primary-500/20
            animate-bounce
          `}
          style={{
            animationDuration: '2s',
            animationIterationCount: '3',
            animationDelay: '0.5s',
          }}
        >
          <BookOpen className="w-6 h-6" />

          {/* 리플 효과 */}
          <div className="absolute inset-0 rounded-full bg-primary-400/30 animate-ping"></div>

          {/* 글로우 효과 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400/20 to-primary-500/20 blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>

        {/* 도움말 뱃지 (처음 3초간만 표시) */}
        <div
          className={`
            absolute -top-2 -right-1 w-6 h-6 bg-red-500 text-white text-xs 
            rounded-full flex items-center justify-center font-bold
            animate-pulse transition-opacity duration-500
            ${isVisible ? 'opacity-100' : 'opacity-0'}
          `}
          style={{
            animation: isVisible ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 3' : 'none',
          }}
        >
          !
        </div>
      </div>
    </div>
  )
}

export default FloatingGuideButton
