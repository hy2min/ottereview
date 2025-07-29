import { Stomp } from '@stomp/stompjs'
import { useEffect, useRef, useState } from 'react'
import SockJS from 'sockjs-client'

const ChatSection = ({ roomId, userId }) => {
  const [stompClient, setStompClient] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const messageBoxRef = useRef(null)

  useEffect(() => {
    if (!roomId || !userId) return

    const socket = new SockJS('https://localhost:8080/ws')
    const client = Stomp.over(socket)

    client.connect({}, () => {
      client.subscribe(`/topic/meetings/${roomId}/chat`, (msg) => {
        const data = JSON.parse(msg.body)

        if (data.type === 'TALK' && data.message && data.userId !== userId) {
          setMessages((prev) => [
            ...prev,
            { userId: data.userId, content: JSON.parse(data.message).text },
          ])
        }
      })
      setStompClient(client)
    })
    return () => {
      if (client.connected) client.disconnect()
    }
  }, [roomId, userId])

  const sendMessage = () => {
    if (!input.trim() || !stompClient) return

    const payload = {
      type: 'TALK',
      userId,
      message: JSON.stringify({ text: input }),
    }
    stompClient.send(`app/meetings/${roomId}/chat`, {}, JSON.stringify(payload))
    setMessages((prev) => [...prev, { userId, content: input }])
    setInput('')
  }
  useEffect(() => {
    messageBoxRef.current?.scrollTo({ top: messageBoxRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  return (
    <div
      style={{
        width: '300px',
        height: '100vh',
        borderLeft: '1px solid #ccc',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }} ref={messageBoxRef}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: '5px' }}>
            <b>{msg.userId === userId ? '나' : msg.userId}:</b> {msg.content}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', padding: '10px', borderTop: '1px solid #ccc' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          style={{ flex: 1, marginRight: '5px' }}
        />
        <button onClick={sendMessage}>전송</button>
      </div>
    </div>
  )
}

export default ChatSection
