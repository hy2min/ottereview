import { LogOut, Moon, Plus, Sun } from 'lucide-react'
import { matchRoutes, useLocation, useNavigate } from 'react-router-dom'

import { protectedRoutes } from '@/app/routes'
import { useAuthStore } from '@/features/auth/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useUserStore } from '@/store/userStore'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const user = useUserStore((state) => state.user)
  const logout = useUserStore((state) => state.logout)
  const clearUser = useUserStore((state) => state.clearUser)
  const clearTokens = useAuthStore((state) => state.clearTokens)

  const { theme, toggleTheme } = useThemeStore()
  
  const isLoggedIn = !!user
  const isDashboard = location.pathname === '/dashboard'

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
          {/* Center Logo & Page Info */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
            <button
              onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}
              className="group flex items-center gap-3 hover:scale-105 transition-all duration-500"
            >
              {/* Logo Image */}
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 opacity-0 group-hover:opacity-30 blur-lg transition-all duration-500 rounded-xl animate-pulse" />
                <div className="relative w-10 h-10 bg-white dark:bg-gray-800 rounded-xl p-1.5 shadow-lg group-hover:shadow-2xl transition-all duration-500 border-2 border-gray-200/50 dark:border-gray-600/50 group-hover:border-orange-400/50 dark:group-hover:border-orange-500/50">
                  <img
                    src="/OtteReview.png"
                    alt="OtteReview Logo"
                    className="w-full h-full object-contain transition-all duration-700 ease-in-out"
                  />
                </div>
              </div>

              {/* Text Logo */}
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 opacity-0 group-hover:opacity-20 blur-md transition-all duration-500 rounded-lg" />
                <div className="relative h-8 overflow-hidden">
                  <img
                    src="/otter_logo.png"
                    alt="Otter Logo"
                    className="h-full object-contain transition-all duration-700 ease-in-out"
                  />
                </div>
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-center rounded-full" />
              </div>
            </button>
            
            {/* Page Title - smaller text below logo */}
            {title && (
              <div className="mt-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {title}
                </span>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Import Repository Button - 대시보드에서만 표시 */}
            {isLoggedIn && isDashboard && (
              <button
                onClick={handleImportRepo}
                className="group relative inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 font-medium text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                title="새 레포지토리 연결"
              >
                <Plus size={16} className="text-gray-600 dark:text-gray-300" />
                <span className="hidden sm:inline">레포 연결</span>
              </button>
            )}

            {/* Logout Button - 로그인된 상태에서만 표시 */}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="group relative inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                title="로그아웃"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            )}
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-200"
              title={theme === 'light' ? '다크 모드로 변경' : '라이트 모드로 변경'}
            >
              {theme === 'light' ? (
                <Moon size={18} className="text-gray-600 dark:text-gray-300" />
              ) : (
                <Sun size={18} className="text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
