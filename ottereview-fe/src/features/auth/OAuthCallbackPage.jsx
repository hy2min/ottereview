import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/authStore'
import { api } from '@/lib/api'
import useLoadingDots from '@/lib/utils/useLoadingDots'
import { useUserStore } from '@/store/userStore'

const OAuthCallbackPage = () => {
  const navigate = useNavigate()
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const clearUser = useUserStore((state) => state.clearUser)
  const clearTokens = useAuthStore((state) => state.clearTokens)

  const [loading, setLoading] = useState(true)
  const loadingDots = useLoadingDots(loading, loading ? 300 : 0)

  // user가 설정되면 대시보드로 이동
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get('code')

    if (!code) {
      alert('인증 코드가 없습니다.')
      setLoading(false)
      return navigate('/')
    }

    api
      .get(`/api/auth/github/callback?code=${code}`, {
        withCredentials: true,
      })
      .then(async (res) => {
        const accessToken = res.data.accessToken
        if (!accessToken) {
          console.error('[OAuth] accessToken이 없음')
          alert('토큰 발급 실패')
          setLoading(false)
          return navigate('/')
        }

        setAccessToken(accessToken)
        await Promise.resolve()
        const userRes = await api.get('/api/users/me')
        setUser(userRes.data)

        setLoading(false)
      })
      .catch((err) => {
        console.error('[OAuth] 로그인 실패:', err)
        clearTokens()
        clearUser()
        alert('로그인 실패')
        setLoading(false)
        navigate('/')
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="theme-text text-xl">로그인 처리 중{loadingDots}</p>
      </div>
    </div>
  )
}

export default OAuthCallbackPage
