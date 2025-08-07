import { ArrowDown } from 'lucide-react'

import Box from '@/components/Box'
import Button from '@/components/Button'

const Landing = () => {
  const handleLogin = () => {
    const githubLoginUrl = `${import.meta.env.VITE_API_URL}/api/auth/login`

    window.location.href = githubLoginUrl
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-6">
      <Box shadow className="p-8">
        <div className="space-y-4">
          <h1 className="text-3xl">🦦 Ottereview에 오신 걸 환영합니다!</h1>
          <p className="text-gray-600 text-lg">
            GitHub PR을 리뷰하고 충돌을 해결하는 협업 서비스입니다.
          </p>
          <Button onClick={handleLogin} variant="secondary">
            GitHub로 로그인
          </Button>
        </div>
      </Box>
    </div>
  )
}

export default Landing
