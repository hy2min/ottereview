import { useEffect, useState } from 'react'

import Box from '@/components/Box'

const InstallComplete = () => {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    // 부모 창(원본 페이지)에 설치 완료 메시지 전송
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        {
          type: 'GITHUB_INSTALL_COMPLETE',
          timestamp: Date.now(),
        },
        window.location.origin
      )
    }

    // 카운트다운 타이머
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // 창 닫기
          window.close()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Box shadow className="text-center max-w-md">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold theme-text mb-2">GitHub 앱 설치 완료!</h1>
          <p className="theme-text-secondary">레포지토리가 성공적으로 연결되었습니다.</p>
        </div>

        <div className="text-sm theme-text-muted">{countdown}초 후 창이 자동으로 닫힙니다...</div>

        <button
          onClick={() => window.close()}
          className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          수동으로 닫기
        </button>
      </Box>
    </div>
  )
}

export default InstallComplete
