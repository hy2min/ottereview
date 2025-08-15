import { useCallback, useEffect, useRef } from 'react'

import { useAuthStore } from '@/features/auth/authStore'
import { useUserStore } from '@/store/userStore'

// 전역 push 이벤트만 관리하는 훅
export const useSSE = (shouldConnect = true, onPushEvent = null) => {
  const accessToken = useAuthStore((state) => state.accessToken)
  const setSseReconnectCallback = useAuthStore((state) => state.setSseReconnectCallback)
  const user = useUserStore((state) => state.user)
  const eventSourceRef = useRef(null)

  // SSE 연결 함수
  const connectSSE = useCallback(() => {
    if (!shouldConnect || !accessToken || !user?.githubId) return

    // 기존 연결이 있으면 먼저 종료
    if (eventSourceRef.current) {
      console.log('🔌 기존 Push SSE 연결 해제')
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    console.log('🔌 Push SSE 연결 시작 (토큰:', accessToken.substring(0, 10) + '...)')

    // push 이벤트 구독 (브랜치 추가/푸시) - 모든 페이지에서 필요
    const pushEventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse/make-clients?github-id=${user.githubId}`
    )

    eventSourceRef.current = pushEventSource

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

    pushEventSource.onopen = () => {
      console.log('🔌 Push SSE 연결 성공')
    }
    
    pushEventSource.onerror = (error) => {
      console.error('❌ Push SSE 오류:', error)
    }
  }, [shouldConnect, accessToken, user?.githubId, onPushEvent])

  // 초기 연결 및 재연결 콜백 등록
  useEffect(() => {
    // 초기 연결
    connectSSE()

    // authStore에 재연결 콜백 등록
    setSseReconnectCallback(connectSSE)

    return () => {
      console.log('🔌 Push SSE 연결 해제')
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      // 콜백 제거
      setSseReconnectCallback(null)
    }
  }, [connectSSE, setSseReconnectCallback])

  // 컴포넌트 언마운트 시 연결 정리
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        console.log('🔌 컴포넌트 언마운트로 인한 Push SSE 연결 해제')
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [])
}
