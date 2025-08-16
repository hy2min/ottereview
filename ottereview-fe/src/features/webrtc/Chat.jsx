import { Stomp } from '@stomp/stompjs'
import { useEffect, useRef, useState } from 'react'
import SockJS from 'sockjs-client'

import { useAuthStore } from '@/features/auth/authStore'
import { useUserStore } from '@/store/userStore'

const Chat = ({ roomId }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const stompClientRef = useRef(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const user = useUserStore((state) => state.user)

  // 메시지 목록 끝으로 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 새 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // WebSocket 연결
  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/api/ws')
    const stompClient = Stomp.over(socket)

    const token = useAuthStore.getState().accessToken

    stompClient.connect(
      {
        Authorization: `Bearer ${token}`,
      },
      () => {
        setIsConnected(true)

        if (stompClientRef.current?.connected) {
          stompClientRef.current.unsubscribe('chat-sub')
        }

        stompClient.subscribe(
          `/topic/meetings/${roomId}/chat`,
          (msg) => {
            const body = JSON.parse(msg.body)
            setMessages((prev) => [...prev, body])
          },
          { id: 'chat-sub' }
        )
        stompClientRef.current = stompClient
      },
      (error) => {
        console.log('STOMP error', error)
        setIsConnected(false)
      }
    )

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.disconnect()
        setIsConnected(false)
      }
    }
  }, [roomId])

  const sendMessage = () => {
    if (!input.trim() || !stompClientRef.current?.connected) return

    const chatMessage = {
      type: 'TALK',
      message: input,
    }

    stompClientRef.current.send(`/app/meetings/${roomId}/chat`, {}, JSON.stringify(chatMessage))
    setInput('')

    // 포커스를 다시 입력창으로
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* 연결 상태 표시 */}
      <div className={`px-4 py-3 text-xs text-center border-b theme-border rounded-t-lg ${
        isConnected 
          ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20' 
          : 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20'
      }`}>
        {isConnected ? '🟢 실시간 연결됨' : '🟠 연결 중...'}
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 theme-bg-primary min-h-0 max-h-full">
        {messages.length === 0 ? (
          <div className="text-center theme-text-muted text-sm mt-8">
            <div className="text-4xl mb-3 opacity-60">💬</div>
            <p className="text-base font-medium mb-1">아직 메시지가 없습니다</p>
            <p className="text-sm opacity-75">첫 번째 메시지를 보내보세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg, i) => {
              // 디버그용 로그
              if (i === 0) {
                console.log('Message data:', msg)
                console.log('User data:', user)
              }
              const isMyMessage = user && (
                msg.senderName === user.username || 
                msg.senderName === user.login || 
                msg.senderName === user.name ||
                msg.senderId === user.id
              )
              return (
                <div
                  key={i}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl transition-all duration-200 ${
                      isMyMessage
                        ? 'bg-primary-500 text-white rounded-br-md'
                        : 'theme-bg-secondary theme-text rounded-bl-md'
                    }`}
                  >
                    {!isMyMessage && (
                      <div className="text-xs font-medium mb-1 text-primary-600 dark:text-primary-400">
                        {msg.senderName || '익명'}
                      </div>
                    )}
                    <div className="text-sm leading-relaxed break-words">
                      {msg.message}
                    </div>
                    <div className={`text-xs mt-1 opacity-70 ${
                      isMyMessage ? 'text-right text-white/80' : 'theme-text-muted'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="p-4 border-t theme-border theme-bg-secondary flex-shrink-0 rounded-b-lg">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            disabled={!isConnected}
            className={`soft-input flex-1 resize-none min-h-[44px] max-h-[120px] ${
              isConnected ? '' : 'opacity-50'
            }`}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !isConnected}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-w-[70px] h-[44px] flex items-center justify-center btn-interactive ${
              !input.trim() || !isConnected
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer shadow-lg hover:shadow-xl'
            }`}
          >
            전송
          </button>
        </div>

        {/* 입력 상태 안내 */}
        <div className="mt-3 text-xs theme-text-muted text-center">
          {!isConnected && '연결을 기다리는 중...'}
          {isConnected && messages.length > 0 && `총 ${messages.length}개의 메시지`}
          {isConnected && messages.length === 0 && 'Enter로 메시지 전송'}
        </div>
      </div>
    </div>
  )
}

export default Chat
