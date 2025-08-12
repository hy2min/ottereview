import { Moon, Sun } from 'lucide-react'
import { matchRoutes, useLocation, useNavigate } from 'react-router-dom'

import { protectedRoutes } from '@/app/routes'
import Button from '@/components/Button'
import { useAuthStore } from '@/features/auth/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useUserStore } from '@/store/userStore'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const logout = useUserStore((state) => state.logout)
  const clearUser = useUserStore((state) => state.clearUser)
  const clearTokens = useAuthStore((state) => state.clearTokens)
  
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

  return (
    <header className="bg-transparent pb-1 pt-2">
      <div className="max-w-7xl mx-auto px-4">
        <div className="soft-container grid grid-cols-3 items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xl justify-self-start cursor-pointer text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            🦦 Ottereview
          </button>
          <div className="text-xl justify-self-center font-medium" style={{color: 'var(--text-primary)'}}>{title}</div>
          <div className="justify-self-end flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="theme-btn"
              title={theme === 'light' ? '다크 모드로 변경' : '라이트 모드로 변경'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <Button onClick={handleLogout} variant="secondary">
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
