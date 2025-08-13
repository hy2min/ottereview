import { matchRoutes, useLocation, useNavigate } from 'react-router-dom'

import { protectedRoutes } from '@/app/routes'
import Button from '@/components/Button'
import { useAuthStore } from '@/features/auth/authStore'
import { useUserStore } from '@/store/userStore'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const logout = useUserStore((state) => state.logout)
  const clearUser = useUserStore((state) => state.clearUser)
  const clearTokens = useAuthStore((state) => state.clearTokens)

  const matches = matchRoutes(protectedRoutes, location)
  const matchedRoute = matches?.[0]?.route
  const title = matchedRoute?.title || ''

  const handleLogout = async () => {
    await logout()
    clearUser()
    clearTokens()
    navigate('/')
  }

  const handleImportRepo = () => {
    const importUrl = import.meta.env.VITE_GITHUB_IMPORT_URL
    const width = 600
    const height = 700

    const popup = window.open(
      importUrl,
      '_blank',
      `width=${width},height=${height},left=${(screen.width - width) / 2},top=${(screen.height - height) / 2},scrollbars=yes,resizable=yes`
    )

    // 팝업 완료 후 대시보드에 메시지 전송
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        // Dashboard에 업데이트 알림
        window.postMessage({ type: 'GITHUB_INSTALL_COMPLETE' }, window.location.origin)
      }
    }, 1000)
  }

  return (
    <header className="bg-transparent pb-1 pt-2">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-3 bg-gray-300 border-2 border-black shadow-pixel p-4 rounded-4xl">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xl justify-self-start cursor-pointer"
          >
            🦦 Ottereview
          </button>
          <div className="text-xl text-gray-800 justify-self-center">{title}</div>
          <div className="justify-self-end flex gap-2">
            <Button onClick={handleImportRepo} variant="" className="bg-white">
              레포지토리 연결
            </Button>
            <Button onClick={handleLogout} variant="" className="bg-white">
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
