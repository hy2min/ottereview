import { useCallback, useEffect, useRef } from 'react'

import { useAuthStore } from '@/features/auth/authStore'
import { useUserStore } from '@/store/userStore'

// 전역 SSE 이벤트 관리하는 훅 (push + update)
export const useSSE = (shouldConnect = true, onPushEvent = null, onUpdateEvent = null) => {
  const accessToken = useAuthStore((state) => state.accessToken)
  const setSseReconnectCallback = useAuthStore((state) => state.setSseReconnectCallback)
  const user = useUserStore((state) => state.user)
  const eventSourceRef = useRef(null)

  // SSE 연결 함수
  const connectSSE = useCallback(() => {
    if (!shouldConnect || !accessToken || !user?.githubId) return

    // 기존 연결이 있으면 먼저 종료
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    console.log('🔌 SSE 연결 시작 (토큰:', accessToken.substring(0, 10) + '...)')

    // 통합 SSE 이벤트 구독 (push + update)
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse/make-clients?github-id=${user.githubId}`
    )

    eventSourceRef.current = eventSource

    // push 이벤트 처리
    eventSource.addEventListener('push', (event) => {
      console.log('📤 푸시 이벤트 (전역):', event.data)

      try {
        const pushData = JSON.parse(event.data)

        // 토스트 데이터 생성
        const toastData = {
          id: Date.now() + Math.random(), // 고유 ID
          pusherName: pushData.pusher?.name || 'Unknown',
          repoName: pushData.repository?.full_name || 'Unknown',
          branchName: pushData.branchName,
          commitCount: pushData.commits?.length || 0,
          timestamp: new Date(),
        }
        
        console.log('🍞 토스트 데이터 생성:', toastData)
        
        if (onPushEvent) {
          console.log('🍞 onPushEvent 콜백 호출')
          onPushEvent(toastData)
        } else {
          console.log('❌ onPushEvent 콜백이 없음')
        }
      } catch (error) {
        console.error('푸시 이벤트 파싱 오류:', error)
      }
    })

    // update 이벤트 처리
    eventSource.addEventListener('update', (event) => {
      console.log('🔄 업데이트 이벤트 (전역):', event.data)

      if (onUpdateEvent) {
        onUpdateEvent(event.data)
      }
    })

    eventSource.onopen = () => {
      console.log('🔌 SSE 연결 성공')
    }

    eventSource.onerror = (error) => {
      console.error('❌ SSE 오류:', error)
    }
  }, [shouldConnect, accessToken, user?.githubId, onPushEvent, onUpdateEvent])

  // 초기 연결 및 재연결 콜백 등록
  useEffect(() => {
    // 초기 연결
    connectSSE()

    // authStore에 재연결 콜백 등록
    setSseReconnectCallback(connectSSE)

    return () => {
      console.log('🔌 SSE 연결 해제')
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
        console.log('🔌 컴포넌트 언마운트로 인한 SSE 연결 해제')
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [])
}
