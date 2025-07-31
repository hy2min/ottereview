import { matchRoutes, useLocation, useNavigate } from 'react-router-dom'

import { protectedRoutes } from '../../app/routes'
import { useUserStore } from '../../store/userStore'
import Button from '../Button'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useUserStore((state) => state.logout)

  const matches = matchRoutes(protectedRoutes, location)
  const matchedRoute = matches?.[0]?.route
  const title = matchedRoute?.title || ''

  return (
    <header className="bg-transparent py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-3 bg-white border-2 border-black shadow-pixel p-4 rounded-4xl">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xl justify-self-start cursor-pointer"
          >
            🦦 Ottereview
          </button>
          <div className="text-xl text-gray-800 justify-self-center">{title}</div>
          <div className="justify-self-end">
            <Button onClick={logout} variant="secondary">
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
