import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import Header from '../components/Header'
import AudioComponent from '../features/chat/AudioComponent'
import ChatRoom from '../pages/ChatRoom'
import Dashboard from '../pages/Dashboard'
import Landing from '../pages/Landing'
import { useUserStore } from '../store/userStore'
import { protectedRoutes } from './routes'

const App = () => {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn)

  return (
    <div className="min-h-screen">
      {isLoggedIn && <Header />}
      <main className="max-w-7xl mx-auto px-8 sm:px-10 lg:px-12">
        <Routes>
          {/* ✅ 비로그인 사용자 경로 */}
          {!isLoggedIn ? (
            <>
              <Route path="/" element={<Landing />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              {/* ✅ 로그인 후 보호된 페이지들 */}
              {protectedRoutes.map(({ path, element }) => (
                <Route key={path} path={path} element={element} />
              ))}

              {/* ✅ 테스트용 페이지도 라우터로 등록 */}
              <Route path="/chatroom/test" element={<ChatRoom />} />
              <Route path="/audiotest" element={<AudioComponent />} />

              {/* ✅ 예외 경로는 대시보드로 */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  )
}

export default App
