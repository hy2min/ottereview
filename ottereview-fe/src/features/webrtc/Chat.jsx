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
    const socket = new SockJS('https://i13c108.p.ssafy.io/api/ws')
    const stompClient = Stomp.over(socket)

    const token = useAuthStore.getState().accessToken

    stompClient.connect(
      {
        Authorization: `Bearer ${token}`,
      },
      () => {
        setIsConnected(true)
        console.log('채팅 연결 성공')

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
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
      }}
    >
      {/* 연결 상태 표시 */}
      <div
        style={{
          padding: '0.5rem 1rem',
          fontSize: '0.75rem',
          color: isConnected ? '#10b981' : '#ef4444',
          backgroundColor: isConnected ? '#d1fae5' : '#fee2e2',
          textAlign: 'center',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        {isConnected ? '🟢 연결됨' : '🔴 연결 중...'}
      </div>

      {/* 메시지 영역 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          minHeight: 0, // 중요: flex 축소 허용
          maxHeight: '100%',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '0.875rem',
              marginTop: '2rem',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
            <p>아직 메시지가 없습니다.</p>
            <p>첫 번째 메시지를 보내보세요!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  maxWidth: '85%',
                  alignSelf: 'flex-start', // 모든 메시지를 왼쪽 정렬
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.25rem',
                  }}
                >
                  <span
                    style={{
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      color: '#374151',
                    }}
                  >
                    {msg.senderName || '익명'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                    }}
                  >
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#1f2937',
                    lineHeight: '1.4',
                    wordBreak: 'break-word',
                  }}
                >
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
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white',
          flexShrink: 0, // 입력 영역이 축소되지 않도록
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-end',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            disabled={!isConnected}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.875rem',
              lineHeight: '1.4',
              resize: 'none',
              minHeight: '40px',
              maxHeight: '120px',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.2s',
              backgroundColor: isConnected ? 'white' : '#f3f4f6',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6'
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db'
              e.target.style.boxShadow = 'none'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !isConnected}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: !input.trim() || !isConnected ? '#d1d5db' : '#3b82f6',
              color: !input.trim() || !isConnected ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: !input.trim() || !isConnected ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              minWidth: '60px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (input.trim() && isConnected) {
                e.target.style.backgroundColor = '#2563eb'
              }
            }}
            onMouseLeave={(e) => {
              if (input.trim() && isConnected) {
                e.target.style.backgroundColor = '#3b82f6'
              }
            }}
          >
            전송
          </button>
        </div>

        {/* 입력 상태 안내 */}
        <div
          style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#6b7280',
            textAlign: 'center',
          }}
        >
          {!isConnected && '연결을 기다리는 중...'}
          {isConnected && messages.length > 0 && `${messages.length}개의 메시지`}
        </div>
      </div>
    </div>
  )
}

export default Chat
