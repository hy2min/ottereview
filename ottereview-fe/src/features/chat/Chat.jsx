import { Stomp } from '@stomp/stompjs'
import { useEffect, useRef, useState } from 'react'
import SockJS from 'sockjs-client'

const Chat = ({ roomId }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const stompClientRef = useRef(null)

  // WebSocket 연결
  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws')
    const stompClient = Stomp.over(socket)

    const token = localStorage.getItem('accessToken')

    stompClient.connect(
      {
        Authorization: `Bearer ${token}`,
      },
      () => {
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
      }
    )

    return () => {
      if (stompClientRef.current) stompClientRef.current.disconnect()
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
  }

  return (
    <div>
      <h3>
        채팅 (roomId: <code>{roomId}</code>)
      </h3>

      <div style={{ height: 300, overflowY: 'scroll', border: '1px solid gray', padding: 8 }}>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.senderName}</strong>: {msg.message}
            <div style={{ fontSize: '0.75rem', color: '#666' }}>{msg.timestamp}</div>
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="메시지를 입력하세요"
      />
      <button onClick={sendMessage}>전송</button>
    </div>
  )
}

export default Chat
