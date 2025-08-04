import axios from 'axios'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useUserStore } from '../../store/userStore'
import { useAuthStore } from '../auth/authStore'

const OAuthCallbackPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get('code')
    console.log('[OAuth] 받은 code:', code)

    if (!code) {
      alert('인증 코드가 없습니다.')
      return navigate('/')
    }

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/auth/github/callback?code=${code}`)
      .then(async (res) => {
        console.log('[OAuth] 토큰 응답:', res.data)

        const accessToken = res.data.accessToken
        if (!accessToken) {
          console.error('[OAuth] accessToken이 없음')
          alert('토큰 발급 실패')
          return navigate('/')
        }
        useAuthStore.getState().setAccessToken(accessToken)

        // 유저 정보 요청
        const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        useUserStore.getState().setUser(userRes.data)

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
