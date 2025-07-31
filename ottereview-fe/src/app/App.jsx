import { useState } from 'react'

import Chat from '../features/chat/Chat'

const App = () => {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn)

  return (
    <div className="bg-gray-50 min-h-screen">
      {isLoggedIn && <Header />}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
