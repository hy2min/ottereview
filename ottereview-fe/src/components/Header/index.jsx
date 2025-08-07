import { matchRoutes, useLocation, useNavigate } from 'react-router-dom'

import { protectedRoutes } from '@/app/routes'
import Button from '@/components/Button'
import { useAuthStore } from '@/features/auth/authStore'
import { useUserStore } from '@/store/userStore'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const logout = useUserStore((state) => state.logout)
  const clearUser = useUserStore((state) => state.clearUser)
  const clearTokens = useAuthStore((state) => state.clearTokens)

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
        <div className="grid grid-cols-3 bg-danger-300 border-2 border-black shadow-pixel p-4 rounded-4xl">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xl justify-self-start cursor-pointer"
          >
            🦦 Ottereview
          </button>
          <div className="text-xl text-gray-800 justify-self-center">{title}</div>
          <div className="justify-self-end">
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
