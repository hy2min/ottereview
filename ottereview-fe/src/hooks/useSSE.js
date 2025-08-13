import { useEffect } from 'react'

import { useAuthStore } from '@/features/auth/authStore'

// 전역 push 이벤트만 관리하는 훅
export const useSSE = (shouldConnect = true) => {
  const accessToken = useAuthStore((state) => state.accessToken)

  useEffect(() => {
    if (!shouldConnect || !accessToken) return

    // push 이벤트 구독 (브랜치 추가/푸시) - 모든 페이지에서 필요
    const pushEventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse/make-clients?action=push`
    )

    // push 이벤트 처리
    pushEventSource.addEventListener('push', (event) => {
      console.log('📤 푸시 이벤트 (전역):', event.data)

      // 브랜치 정보 업데이트 (필요시 추가 로직)
      // 예: 알림 표시, 특정 페이지에서 데이터 새로고침 등
    })

    pushEventSource.onopen = () => console.log('🔌 Push SSE 연결 성공')
    pushEventSource.onerror = (error) => console.error('❌ Push SSE 오류:', error)

    return () => {
      console.log('🔌 Push SSE 연결 해제')
      pushEventSource.close()
    }
  }, [shouldConnect, accessToken])
}
