import { Navigate, Route, Routes } from 'react-router-dom'

import Header from '../components/Header'
import Landing from '../pages/Landing'
import { useUserStore } from '../store/userStore'
import { protectedRoutes } from './routes'

const App = () => {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn)

  return (
    <div className="bg-gray-50 min-h-screen">
      {isLoggedIn && <Header />}
      <main className="max-w-7xl mx-auto px-8 sm:px-10 lg:px-12">
        <Routes>
          {!isLoggedIn ? (
            <>
              <Route path="/" element={<Landing />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              {protectedRoutes.map(({ path, element }) => (
                <Route key={path} path={path} element={element} />
              ))}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  )
}

export default App
