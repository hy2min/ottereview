import { LogOut, Moon, Plus, Sun } from 'lucide-react'
import { matchRoutes, useLocation, useNavigate } from 'react-router-dom'

import { protectedRoutes } from '@/app/routes'
import { useAuthStore } from '@/features/auth/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useUserStore } from '@/store/userStore'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const logout = useUserStore((state) => state.logout)
  const clearUser = useUserStore((state) => state.clearUser)
  const clearTokens = useAuthStore((state) => state.clearTokens)
  const user = useUserStore((state) => state.user)

  const { theme, toggleTheme } = useThemeStore()

  const matches = matchRoutes(protectedRoutes, location)
  const matchedRoute = matches?.[0]?.route
  const title = matchedRoute?.title || ''

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
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-gray-200/50 dark:border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <button
            onClick={() => navigate('/dashboard')}
            className="group flex items-center gap-4 hover:scale-105 transition-all duration-500"
            onMouseEnter={(e) => {
              const logo = e.currentTarget.querySelector('.logo-img')
              if (logo) {
                logo.style.transform = 'rotate(360deg) scale(1.1)'
                logo.style.filter = 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.6))'
              }
            }}
            onMouseLeave={(e) => {
              const logo = e.currentTarget.querySelector('.logo-img')
              if (logo) {
                logo.style.transform = 'rotate(0deg) scale(1)'
                logo.style.filter = 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
              }
            }}
          >
            <div className="relative">
              {/* Animated glow background */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-30 blur-lg transition-all duration-500 rounded-xl animate-pulse" />

              {/* Logo container with enhanced effects */}
              <div className="relative w-12 h-12 bg-white dark:bg-slate-800 rounded-xl p-1.5 shadow-lg group-hover:shadow-2xl transition-all duration-500 border-2 border-gray-200/50 dark:border-slate-700/50 group-hover:border-blue-400/50 dark:group-hover:border-blue-500/50">
                <img
                  src="/otter_logo.png"
                  alt="Ottereview Logo"
                  className="logo-img w-full h-full object-contain transition-all duration-700 ease-in-out"
                />

                {/* Sparkle effects */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300" />
                <div
                  className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-80 group-hover:animate-pulse transition-all duration-500"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>

            <div className="hidden sm:block">
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-cyan-600 dark:group-hover:from-blue-400 dark:group-hover:via-purple-400 dark:group-hover:to-cyan-400 transition-all duration-500">
                Ottereview
              </span>
              {/* Underline animation */}
              <div className="h-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          </button>

          {/* Page Title */}
          {title && (
            <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
              <div className="px-4 py-2 bg-gray-100/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-slate-700/50">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {title}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Import Repository Button */}
            <button
              onClick={handleImportRepo}
              className="group relative inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white font-semibold text-sm rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-110 overflow-hidden"
              title="새 레포지토리 연결"
              onMouseEnter={(e) => {
                e.target.style.boxShadow =
                  '0 0 30px rgba(34, 197, 94, 0.5), 0 0 60px rgba(16, 185, 129, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Animated background layers */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700 transform -skew-x-12" />

              <Plus
                size={18}
                className="relative z-10 group-hover:rotate-90 group-hover:scale-110 transition-all duration-500"
              />
              <span className="relative z-10 hidden sm:inline tracking-wide">레포 연결</span>

              {/* Button pulse effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-green-400/30 animate-ping" />
            </button>
            {/* User Info
            {user && (
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-gray-100/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-slate-700/50">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-32 truncate">
                  {user.name || 'User'}
                </span>
              </div>
            )} */}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="group relative inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 hover:from-red-600 hover:via-pink-600 hover:to-red-700 text-white font-semibold text-sm rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-110 overflow-hidden"
              onMouseEnter={(e) => {
                e.target.style.boxShadow =
                  '0 0 30px rgba(239, 68, 68, 0.5), 0 0 60px rgba(236, 72, 153, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Animated background layers */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-pink-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700 transform -skew-x-12" />

              <LogOut
                size={18}
                className="relative z-10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500"
              />
              <span className="relative z-10 hidden sm:inline tracking-wide">로그아웃</span>

              {/* Button pulse effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-red-400/30 animate-ping" />
            </button>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="group relative p-3 bg-gray-100/60 dark:bg-slate-800/60 hover:bg-gray-200/80 dark:hover:bg-slate-700/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50 transition-all duration-500 hover:scale-110 hover:shadow-lg overflow-hidden"
              title={theme === 'light' ? '다크 모드로 변경' : '라이트 모드로 변경'}
              onMouseEnter={(e) => {
                e.target.style.boxShadow =
                  theme === 'light'
                    ? '0 0 25px rgba(139, 92, 246, 0.3)'
                    : '0 0 25px rgba(251, 191, 36, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Background shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700 transform -skew-x-12" />

              {theme === 'light' ? (
                <Moon
                  size={20}
                  className="relative z-10 text-gray-600 dark:text-gray-300 group-hover:text-purple-600 group-hover:rotate-180 group-hover:scale-110 transition-all duration-500"
                />
              ) : (
                <Sun
                  size={20}
                  className="relative z-10 text-gray-600 dark:text-gray-300 group-hover:text-yellow-500 group-hover:rotate-180 group-hover:scale-110 transition-all duration-500"
                />
              )}

              {/* Icon glow effect */}
              <div
                className={`absolute inset-2 rounded-lg opacity-0 group-hover:opacity-50 blur-sm transition-all duration-500 ${theme === 'light' ? 'bg-purple-500' : 'bg-yellow-500'}`}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
