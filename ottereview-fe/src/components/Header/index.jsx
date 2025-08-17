import { Bell, LogOut, Moon, Plus, Sun } from 'lucide-react'
import { matchRoutes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

import { protectedRoutes } from '@/app/routes'
import Button from '@/components/Button'
import NotificationPanel from '@/components/Notification'
import { useAuthStore } from '@/features/auth/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useUserStore } from '@/store/userStore'
import { useNotificationStore } from '@/store/notificationStore'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const notificationRef = useRef(null)

  const user = useUserStore((state) => state.user)
  const logout = useUserStore((state) => state.logout)
  const clearUser = useUserStore((state) => state.clearUser)
  const clearTokens = useAuthStore((state) => state.clearTokens)
  const getUnreadCount = useNotificationStore((state) => state.getUnreadCount)

  const { theme, toggleTheme } = useThemeStore()
  
  const unreadCount = getUnreadCount()
  
  const isLoggedIn = !!user
  const isDashboard = location.pathname === '/dashboard'

  // 알림 패널 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false)
      }
    }

    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNotificationOpen])

  const matches = matchRoutes(protectedRoutes, location)
  const matchedRoute = matches?.[0]?.route
  
  // 페이지별 제목 설정
  const getPageTitle = () => {
    if (matchedRoute?.title) return matchedRoute.title
    
    switch (location.pathname) {
      case '/':
        return isLoggedIn ? '대시보드' : '가이드'
      case '/landing':
        return '랜딩'
      case '/guide':
        return '가이드'
      default:
        return ''
    }
  }
  
  const title = getPageTitle()

  const handleLogout = async () => {
    await logout()
    clearUser()
    clearTokens()
    navigate('/')
  }

  const handleImportRepo = () => {
    const importUrl = import.meta.env.VITE_GITHUB_IMPORT_URL
    const width = 600
    const height = 700

    const popup = window.open(
      importUrl,
      '_blank',
      `width=${width},height=${height},left=${(screen.width - width) / 2},top=${(screen.height - height) / 2},scrollbars=yes,resizable=yes`
    )

    // 팝업 완료 후 대시보드에 메시지 전송
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        // Dashboard에 업데이트 알림
        window.postMessage({ type: 'GITHUB_INSTALL_COMPLETE' }, window.location.origin)
      }
    }, 1000)
  }

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md theme-bg-primary border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Logo */}
          <div className="flex items-center">
            <button
              onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}
              className="group flex items-center gap-3 hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              {/* Logo Image */}
              <div className="relative">
                <img
                  src="/OtteReview.png"
                  alt="OtteReview Logo"
                  className="w-12 h-12 object-contain transition-all duration-300 ease-in-out group-hover:scale-110"
                />
              </div>

              {/* Text Logo */}
              <div className="relative">
                <img
                  src="/otter_logo.png"
                  alt="Otter Logo"
                  className="h-8 object-contain transition-all duration-300 ease-in-out"
                />
              </div>
            </button>
            
            {/* Page Title - next to logo */}
            {title && (
              <div className="ml-4 pl-4 border-l border-gray-200 dark:border-gray-600">
                <span className="text-sm font-medium theme-text-secondary">
                  {title}
                </span>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Import Repository Button - 대시보드에서만 표시 */}
            {isLoggedIn && isDashboard && (
              <Button
                variant="header"
                size="xl"
                onClick={handleImportRepo}
                className="group relative inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                title="새 레포지토리 연결"
              >
                <Plus size={16} className="text-white" />
                <span className="hidden sm:inline">레포 연결</span>
              </Button>
            )}

            {/* Logout Button - 로그인된 상태에서만 표시 */}
            {isLoggedIn && (
              <Button
                variant="danger"
                size="xl"
                onClick={handleLogout}
                className="gap-2"
                title="로그아웃"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">로그아웃</span>
              </Button>
            )}
            
            {/* Theme Toggle */}
            <Button
              variant="theme"
              size="xs"
              onClick={toggleTheme}
              className="p-2.5 theme-bg-secondary border theme-border hover:theme-bg-tertiary rounded-lg transition-all duration-200 theme-shadow"
              title={theme === 'light' ? '다크 모드로 변경' : '라이트 모드로 변경'}
            >
              {theme === 'light' ? (
                <Moon size={18} className="theme-text" />
              ) : (
                <Sun size={18} className="theme-text" />
              )}
            </Button>

            {/* Notification Button - 로그인된 상태에서만 표시 */}
            {isLoggedIn && (
              <div className="relative" ref={notificationRef}>
                <Button
                  variant="theme"
                  size="xs"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2.5 theme-bg-secondary border theme-border hover:theme-bg-tertiary rounded-lg transition-all duration-200 theme-shadow"
                  title="알림"
                >
                  <Bell size={18} className="theme-text" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
                
                <NotificationPanel 
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
