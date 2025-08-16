import { Stomp } from '@stomp/stompjs'
import { useEffect, useRef, useState } from 'react'
import SockJS from 'sockjs-client'

import { useAuthStore } from '@/features/auth/authStore'

const Chat = ({ roomId }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const stompClientRef = useRef(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

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
    <div className="h-full flex flex-col theme-bg-primary">
      {/* 연결 상태 표시 */}
      <div className={`px-4 py-2 text-xs text-center border-b theme-border ${
        isConnected 
          ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20' 
          : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
      }`}>
        {isConnected ? '🟢 연결됨' : '🔴 연결 중...'}
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 theme-bg-secondary min-h-0 max-h-full">
        {messages.length === 0 ? (
          <div className="text-center theme-text-muted text-sm mt-8">
            <div className="text-3xl mb-2">💬</div>
            <p>아직 메시지가 없습니다.</p>
            <p>첫 번째 메시지를 보내보세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className="theme-bg-primary rounded-xl p-3 shadow-sm theme-border border max-w-[85%] self-start"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm theme-text">
                    {msg.senderName || '익명'}
                  </span>
                  <span className="text-xs theme-text-muted">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div className="text-sm theme-text leading-relaxed break-words">
                  {msg.message}
                </div>
              </div>
            ))}
            {/* 스크롤을 위한 빈 div */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="p-4 border-t theme-border theme-bg-primary flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            disabled={!isConnected}
            className={`flex-1 p-3 theme-border border rounded-lg text-sm resize-none min-h-[40px] max-h-[120px] font-inherit outline-none transition-all duration-200 theme-bg-primary theme-text ${
              isConnected ? '' : 'theme-bg-secondary'
            } focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !isConnected}
            className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-w-[60px] h-[40px] flex items-center justify-center ${
              !input.trim() || !isConnected
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
            }`}
          >
            전송
          </button>
        </div>

        {/* 입력 상태 안내 */}
        <div className="mt-2 text-xs theme-text-muted text-center">
          {!isConnected && '연결을 기다리는 중...'}
          {isConnected && messages.length > 0 && `${messages.length}개의 메시지`}
        </div>
      </div>
    </div>
  )
}

export default Chat
