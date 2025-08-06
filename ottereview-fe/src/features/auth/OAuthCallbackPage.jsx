import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/authStore'
import { api } from '@/lib/api'
import { useUserStore } from '@/store/userStore'

const OAuthCallbackPage = () => {
  const navigate = useNavigate()
  const setUser = useUserStore((state) => state.setUser)
  const setAccessToken = useAuthStore((state) => state.setAccessToken)

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get('code')

    if (!code) {
      alert('인증 코드가 없습니다.')
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
          return navigate('/')
        }

        setAccessToken(accessToken) // interceptor가 자동으로 토큰 붙임
        await Promise.resolve()
        const userRes = await api.get('/api/users/me')
        setUser(userRes.data)

        navigate('/dashboard')
      })
      .catch((err) => {
        console.error('[OAuth] 로그인 실패:', err)
        alert('로그인 실패')
        navigate('/')
      })
  }, [])

  return <div className="p-8 text-center">로그인 처리 중...</div>
}

export default OAuthCallbackPage
