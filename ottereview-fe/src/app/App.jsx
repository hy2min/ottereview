import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { protectedRoutes } from '@/app/routes'
import Header from '@/components/Header'
import { useAuthStore } from '@/features/auth/authStore'
import OAuthCallbackPage from '@/features/auth/OAuthCallbackPage'
<<<<<<< HEAD
import AudioChatRoom from '@/features/webrtc/AudioChatRoom'
=======
import AudioChatRoom from '@/features/chat/AudioChatRoom'
import { api } from '@/lib/api'
>>>>>>> 0c6cbf64194a07a9a9a2eae2b3cd6c8ebec05947
import ChatRoom from '@/pages/ChatRoom'
import Landing from '@/pages/Landing'
import { useUserStore } from '@/store/userStore'

const App = () => {
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const clearUser = useUserStore((state) => state.clearUser)
  const clearTokens = useAuthStore((state) => state.clearTokens)
  const accessToken = useAuthStore((state) => state.accessToken)
  const { pathname } = useLocation()
  const attemptedFetch = useRef(false)

  // user 복원 로직
  useEffect(() => {
    if (!user && accessToken && !attemptedFetch.current) {
      attemptedFetch.current = true
      api
        .get('/api/users/me')
        .then((res) => {
          setUser(res.data)
        })
        .catch((err) => {
          console.error('🧨 유저 복원 실패:', err)
          clearUser()
          clearTokens()
          window.location.href = '/'
        })
    }
  }, [user, accessToken, setUser, clearUser, clearTokens])

  if (pathname === '/chatroom/test') return <ChatRoom />
  if (pathname === '/audiotest') return <AudioChatRoom />

  const isLoggedIn = !!user

  if (!isLoggedIn) {
    return (
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/oauth/github/callback" element={<OAuthCallbackPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-8 sm:px-10 lg:px-12">
        <Routes>
          {protectedRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
