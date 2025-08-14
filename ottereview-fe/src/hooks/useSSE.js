import { useEffect } from 'react'

import { useAuthStore } from '@/features/auth/authStore'
import { useUserStore } from '@/store/userStore'

// 전역 push 이벤트만 관리하는 훅
export const useSSE = (shouldConnect = true, onPushEvent = null) => {
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useUserStore((state) => state.user)

  useEffect(() => {
    if (!shouldConnect || !accessToken) return

    // push 이벤트 구독 (브랜치 추가/푸시) - 모든 페이지에서 필요
    const pushEventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse/make-clients?github-id=${user.githubUsername}`
    )

    // push 이벤트 처리
    pushEventSource.addEventListener('push', (event) => {
      console.log('📤 푸시 이벤트 (전역):', event.data)

      try {
        const pushData = JSON.parse(event.data)

        // 토스트 데이터 생성
        if (onPushEvent) {
          onPushEvent({
            id: Date.now() + Math.random(), // 고유 ID
            pusherName: pushData.pusherName,
            repoName: pushData.repoFullName,
            branchName: pushData.branchName,
            commitCount: pushData.commitCount,
            timestamp: new Date(),
          })
        }
        console.log('푸시데이터 : ', pushData)
      } catch (error) {
        console.error('푸시 이벤트 파싱 오류:', error)
      }
    })

    pushEventSource.onopen = () => console.log('🔌 Push SSE 연결 성공')
    pushEventSource.onerror = (error) => console.error('❌ Push SSE 오류:', error)

    return () => {
      console.log('🔌 Push SSE 연결 해제')
      pushEventSource.close()
    }
  }, [shouldConnect, accessToken, onPushEvent])
}
