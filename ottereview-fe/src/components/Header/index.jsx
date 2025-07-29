import { matchRoutes, useLocation, useNavigate } from 'react-router-dom'

import { protectedRoutes } from '../../app/routes'
import LogoutButton from '../Buttons/LogoutButton'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const matches = matchRoutes(protectedRoutes, location)
  const matchedRoute = matches?.[0]?.route
  const title = matchedRoute?.title || ''

  return (
    <header className="w-full p-4 border-b flex items-center justify-between bg-white">
      <button
        onClick={() => navigate('/dashboard')}
        className="text-sm font-semibold border px-3 py-1 rounded hover:bg-gray-100"
      >
        🦦 Ottereview
      </button>
      <div className="text-base font-bold text-gray-700">{title}</div>
      <LogoutButton />
    </header>
  )
}

export default Header
