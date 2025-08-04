import axios from 'axios'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useUserStore } from '../../store/userStore'
import { useAuthStore } from '../auth/authStore'

const OAuthCallbackPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get('code')

    if (!code) {
      alert('인증 코드가 없습니다.')
      return navigate('/')
    }

    axios
      .get(`${import.meta.env.VITE_API_URL}/auth/github/callback?code=${code}`)
      .then(async (res) => {
        const accessToken = res.data.accessToken
        useAuthStore.getState().setAccessToken(accessToken)

        // 유저 정보 요청
        const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        useUserStore.getState().setUser(userRes.data)

        navigate('/dashboard')
      })
      .catch(() => {
        alert('로그인 실패')
        navigate('/')
      })
  }, [])

  return <div className="p-8 text-center">로그인 처리 중...</div>
}

export default OAuthCallbackPage
