import { useEffect, useRef, useState } from 'react'

import { useAuthStore } from '@/features/auth/authStore'
import Button from '@/components/Button'
import Badge from '@/components/Badge'

import { fetchChat } from './chatApi'
import ChatRoomCard from './ChatRoomCard'
import { useChatStore } from './chatStore'

const ChatRoomList = () => {
  const rooms = useChatStore((state) => state.rooms)
  const setRooms = useChatStore((state) => state.setRooms)
  const accessToken = useAuthStore((state) => state.accessToken)
  const scrollRef = useRef(null)
  const [needsSlide, setNeedsSlide] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

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

  // 슬라이드 필요 여부 계산
  useEffect(() => {
    if (rooms.length === 0) {
      setNeedsSlide(false)
      return
    }

    const checkSlideNeeded = () => {
      const scrollContainer = scrollRef.current
      if (!scrollContainer) return

      const cardWidth = window.innerWidth < 640 ? 192 : 212
      const containerWidth = scrollContainer.offsetWidth
      const totalCardsWidth = rooms.length * cardWidth
      const visibleCards = Math.floor(containerWidth / cardWidth)
      
      setNeedsSlide(rooms.length > visibleCards)
    }

    checkSlideNeeded()
    window.addEventListener('resize', checkSlideNeeded)
    
    return () => window.removeEventListener('resize', checkSlideNeeded)
  }, [rooms.length])

  // 슬라이드 함수들
  const slideLeft = () => {
    if (!needsSlide) return
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    const cardWidth = window.innerWidth < 640 ? 192 : 212
    const containerWidth = scrollContainer.offsetWidth
    const visibleCards = Math.floor(containerWidth / cardWidth)
    
    const newIndex = Math.max(0, currentIndex - visibleCards)
    setCurrentIndex(newIndex)
    
    scrollContainer.scrollTo({
      left: newIndex * cardWidth,
      behavior: 'smooth'
    })
  }

  const slideRight = () => {
    if (!needsSlide) return
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    const cardWidth = window.innerWidth < 640 ? 192 : 212
    const containerWidth = scrollContainer.offsetWidth
    const visibleCards = Math.floor(containerWidth / cardWidth)
    const maxIndex = Math.max(0, rooms.length - visibleCards)
    
    const newIndex = Math.min(maxIndex, currentIndex + visibleCards)
    setCurrentIndex(newIndex)
    
    scrollContainer.scrollTo({
      left: newIndex * cardWidth,
      behavior: 'smooth'
    })
  }

  // 슬라이드가 필요한 경우에만 원본 데이터 사용, 아니면 그대로 표시
  const displayRooms = rooms

  return (
    <div className="soft-container p-4 h-fit">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium theme-text">💬 실시간 채팅방</h3>
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm">
            {rooms.length}개 활성
          </Badge>
          {needsSlide && (
            <div className="flex items-center gap-1">
              <Button
                onClick={slideLeft}
                variant="ghost"
                size="sm"
                disabled={currentIndex === 0}
                className="p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <Button
                onClick={slideRight}
                variant="ghost"
                size="sm"
                disabled={currentIndex >= rooms.length - Math.floor(scrollRef.current?.offsetWidth / (window.innerWidth < 640 ? 192 : 212) || 1)}
                className="p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          )}
        </div>
      </div>
      {rooms.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm theme-text-muted">참여한 채팅방이 없습니다</p>
        </div>
      ) : (
        <div className="relative">
          {needsSlide && (
            <>
              <div
                className="absolute left-0 top-0 bottom-0 w-8 z-10 flex items-center justify-center cursor-pointer hover:bg-gradient-to-r hover:from-black/10 hover:to-transparent transition-all"
                onClick={slideLeft}
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <div
                className="absolute right-0 top-0 bottom-0 w-8 z-10 flex items-center justify-center cursor-pointer hover:bg-gradient-to-l hover:from-black/10 hover:to-transparent transition-all"
                onClick={slideRight}
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </>
          )}
          <div 
            ref={scrollRef}
            className="overflow-hidden chat-room-scroll"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-3 pb-2">
              {displayRooms.map((room, index) => (
                <div key={`${room.roomId}-${index}`} className="flex-shrink-0">
                  <ChatRoomCard room={room} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatRoomList
