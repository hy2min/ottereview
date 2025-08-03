import Button from '../../components/Button'

const Landing = () => {
  const handleLogin = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    const redirectUri = import.meta.env.VITE_AUTH_REDIRECT_URI

    const githubLoginUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`

    window.location.href = githubLoginUrl
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-6">
      <h1 className="text-3xl">🦦 Ottereview에 오신 걸 환영합니다!</h1>
      <p className="text-gray-600 text-lg">
        GitHub PR을 리뷰하고 충돌을 해결하는 협업 서비스입니다.
      </p>
      <Button onClick={handleLogin} variant="secondary">
        GitHub로 로그인
      </Button>
    </div>
  )
}

export default Landing
