import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { protectedRoutes } from '@/app/routes'
import Header from '@/components/Header'
import ToastContainer from '@/components/Toast'
import { useAuthStore } from '@/features/auth/authStore'
import InstallComplete from '@/features/auth/InstallComplete'
import OAuthCallbackPage from '@/features/auth/OAuthCallbackPage'
import AudioChatRoom from '@/features/webrtc/AudioChatRoom'
import { useSSE } from '@/hooks/useSSE'
import { api } from '@/lib/api'
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
  
  // 토스트 상태 관리
  const [toasts, setToasts] = useState([])
  
  // 푸시 이벤트 핸들러
  const handlePushEvent = useCallback((pushData) => {
    setToasts((prev) => [...prev, pushData])
  }, [])

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
  if (pathname === '/install-complete') return <InstallComplete />

  const isLoggedIn = !!user
  
  // 토스트 닫기 핸들러
  const handleCloseToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter(toast => toast.id !== toastId))
  }, [])
  
  // 로그인된 사용자에게 전역 SSE 연결 제공
  useSSE(isLoggedIn, handlePushEvent)

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
      <main className="max-w-6xl mx-auto px-8 sm:px-10 lg:px-12 mb-4">
        <Routes>
          {protectedRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      
      {/* 전역 토스트 */}
      <ToastContainer toasts={toasts} onCloseToast={handleCloseToast} />
    </div>
  )
}

export default App
