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
    <header className="bg-transparent py-4">
      <div className="max-w-8xl mx-auto px-4">
        <div className="grid grid-cols-3 items-center border-2 border-black rounded-4xl bg-white px-6 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xl justify-self-start cursor-pointer"
          >
            🦦 Ottereview
          </button>
          <div className="text-xl text-gray-800 justify-self-center">{title}</div>
          <div className="justify-self-end">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
