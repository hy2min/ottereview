import { useUserStore } from '../../store/userStore'

const Landing = () => {
  const login = useUserStore((state) => state.login)

  const handleLogin = () => {
    login() // GitHub 연동 없이 로그인 상태 전환
    // 실제로는 여기서 GitHub redirect 처리할 예정
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-6">
      <h1 className="text-3xl font-bold">🦦 Ottereview에 오신 걸 환영합니다!</h1>
      <p className="text-gray-600 text-lg">
        GitHub PR을 리뷰하고 충돌을 해결하는 협업 서비스입니다.
      </p>
      <button
        onClick={handleLogin}
        className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
      >
        GitHub로 로그인
      </button>
    </div>
  )
}

export default Landing
