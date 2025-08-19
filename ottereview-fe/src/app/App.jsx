import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { protectedRoutes } from '@/app/routes'
import FloatingGuideButton from '@/components/FloatingGuideButton'
import Header from '@/components/Header'
import ToastContainer from '@/components/Toast'
import { useAuthStore } from '@/features/auth/authStore'
import InstallComplete from '@/features/auth/InstallComplete'
import OAuthCallbackPage from '@/features/auth/OAuthCallbackPage'
import AudioChatRoom from '@/features/webrtc/AudioChatRoom'
import { useSSE } from '@/hooks/useSSE'
import { api } from '@/lib/api'
import ChatRoom from '@/pages/ChatRoom'
import Guide from '@/pages/Guide'
import Landing from '@/pages/Landing'
import { useNotificationStore } from '@/store/notificationStore'
import { useThemeStore } from '@/store/themeStore'
import { useUserStore } from '@/store/userStore'

const App = () => {
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const clearUser = useUserStore((state) => state.clearUser)
  const clearTokens = useAuthStore((state) => state.clearTokens)
  const accessToken = useAuthStore((state) => state.accessToken)
  const initTheme = useThemeStore((state) => state.initTheme)
  const addNotification = useNotificationStore((state) => state.addNotification)
  const { pathname } = useLocation()
  const attemptedFetch = useRef(false)

  // 토스트 상태 관리
  const [toasts, setToasts] = useState([])

  // 푸시 이벤트 핸들러
  const handlePushEvent = useCallback(
    (pushData) => {
      // 토스트에 추가
      setToasts((prev) => {
        const newToasts = [...prev, pushData]
        return newToasts
      })

      // 알림으로도 저장
      addNotification({
        id: pushData.id,
        type: 'push',
        title: `${pushData.pusherName}님이 푸시했습니다`,
        message: `${pushData.repoName}의 ${pushData.branchName} 브랜치에 ${pushData.commitCount}개 커밋`,
        data: pushData,
        timestamp: pushData.timestamp,
      })
    },
    [addNotification]
  )

  // 테마 초기화
  useEffect(() => {
    initTheme()
  }, [initTheme])

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
          clearUser()
          clearTokens()
          window.location.href = '/'
        })
    }
  }, [user, accessToken, setUser, clearUser, clearTokens])

  const isLoggedIn = !!user

  // 토스트 닫기 핸들러
  const handleCloseToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId))
  }, [])

  // 로그인된 사용자에게 전역 SSE 연결 제공
  useSSE(isLoggedIn, handlePushEvent)

  // 조건부 렌더링들은 모든 hooks 다음에
  if (pathname === '/chatroom/test') return <ChatRoom />
  if (pathname === '/audiotest') return <AudioChatRoom />
  if (pathname === '/install-complete') return <InstallComplete />
  if (pathname.startsWith('/oauth/github/callback')) return <OAuthCallbackPage />

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Guide />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <FloatingGuideButton />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <main>
              <Guide />
            </main>
          }
        />
        <Route
          path="*"
          element={
            <main className="max-w-6xl mx-auto px-8 sm:px-10 lg:px-12 mt-4 mb-4">
              <Routes>
                {protectedRoutes.map(({ path, element }) => (
                  <Route key={path} path={path} element={element} />
                ))}
              </Routes>
            </main>
          }
        />
      </Routes>

      {/* 전역 토스트 */}
      <ToastContainer toasts={toasts} onCloseToast={handleCloseToast} />

      {/* 플로팅 가이드 버튼 */}
      <FloatingGuideButton />
    </div>
  )
}

export default App
