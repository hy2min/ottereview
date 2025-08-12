import { useEffect, useRef } from 'react'

import { useAuthStore } from '@/features/auth/authStore'

import { fetchChat } from './chatApi'
import ChatRoomCard from './ChatRoomCard'
import { useChatStore } from './chatStore'

const ChatRoomList = () => {
  const rooms = useChatStore((state) => state.rooms)
  const setRooms = useChatStore((state) => state.setRooms)
  const accessToken = useAuthStore((state) => state.accessToken)
  const scrollRef = useRef(null)

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const fetchedRooms = await fetchChat(accessToken)
        setRooms(fetchedRooms)
        console.log(fetchedRooms)
      } catch (err) {
        console.error('채팅방 목록 로딩 실패: ', err)
      }
    }
    if (accessToken) {
      fetchRooms()
    }
  }, [accessToken, setRooms])

  // 자동 슬라이드 효과 - 무한 루프
  useEffect(() => {
    if (rooms.length === 0) return

    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let animationId
    // 반응형 카드 너비 계산
    const cardWidth = window.innerWidth < 640 ? 192 : 212 // 모바일: 180px + 12px gap, 데스크톱: 200px + 12px gap
    const speed = 30 // 픽셀/초
    const totalWidth = rooms.length * cardWidth
    let currentPosition = 0

    const animate = () => {
      currentPosition += speed / 60 // 60fps 기준
      
      // 첫 번째 세트가 완전히 지나가면 위치 리셋 (무한 루프)
      if (currentPosition >= totalWidth) {
        currentPosition = 0
      }

      scrollContainer.scrollLeft = currentPosition
      animationId = requestAnimationFrame(animate)
    }

    // 마우스 호버 시 애니메이션 일시정지
    const handleMouseEnter = () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }

    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(animate)
    }

    scrollContainer.addEventListener('mouseenter', handleMouseEnter)
    scrollContainer.addEventListener('mouseleave', handleMouseLeave)

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter)
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [rooms.length])

  // 무한 루프를 위해 채팅방 목록을 3배로 복제
  const extendedRooms = rooms.length > 0 ? [...rooms, ...rooms, ...rooms] : []

  return (
    <div className="soft-container p-4 h-fit">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium theme-text">💬 실시간 채팅방</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs theme-text-muted theme-bg-tertiary px-2 py-1 rounded-full border theme-border">
            {rooms.length}개 활성
          </span>
          {rooms.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs theme-text-muted">자동 슬라이드</span>
            </div>
          )}
        </div>
      </div>
      {rooms.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm theme-text-muted">참여한 채팅방이 없습니다</p>
        </div>
      ) : (
        <div 
          ref={scrollRef}
          className="overflow-hidden chat-room-scroll"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-3 pb-2" style={{ width: `${extendedRooms.length * (window.innerWidth < 640 ? 192 : 212)}px` }}>
            {extendedRooms.map((room, index) => (
              <div key={`${room.roomId}-${index}`} className="flex-shrink-0">
                <ChatRoomCard room={room} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatRoomList
