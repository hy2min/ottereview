import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import Header from '../components/Header'
import OAuthCallbackPage from '../features/auth/OAuthCallbackPage'
import ChatRoom from '../pages/ChatRoom'
import Landing from '../pages/Landing'
import { useUserStore } from '../store/userStore'
import { protectedRoutes } from './routes'

const App = () => {
  const user = useUserStore((state) => state.user) // user로 로그인 여부 판단
  const { pathname } = useLocation()

  // 예외 라우팅: 테스트용 채팅방은 라우팅 바깥에서 직접 렌더링
  if (pathname === '/chatroom/test') {
    return <ChatRoom />
  }

  const isLoggedIn = !!user // null이 아니면 로그인된 상태

  return (
    <div className="min-h-screen">
      {isLoggedIn && <Header />}
      <main className="max-w-7xl mx-auto px-8 sm:px-10 lg:px-12">
        <Routes>
          {/* 🔓 로그인 없이 접근 가능한 경로 */}
          <Route path="/" element={<Landing />} />
          <Route path="/oauth/github/callback" element={<OAuthCallbackPage />} />

          {/* 🔐 로그인 이후 접근 가능한 경로 */}
          {isLoggedIn ? (
            <>
              {protectedRoutes.map(({ path, element }) => (
                <Route key={path} path={path} element={element} />
              ))}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/" replace />} />
          )}
        </Routes>
      </main>
    </div>
  )
}

export default App
