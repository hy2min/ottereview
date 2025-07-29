import { Stomp } from '@stomp/stompjs'
import * as fabric from 'fabric'
import { useEffect, useRef, useState } from 'react'
import SockJS from 'sockjs-client'

const Whiteboard = () => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [canvas, setCanvas] = useState(null)
  const [stompClient, setStompClient] = useState(null)
  const [tool, setTool] = useState('pen')
  const [roomId, setRoomId] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  // 랜덤 유저 ID + 색상
  const [userId] = useState(() => crypto.randomUUID())
  const [color] = useState(() => {
    const hue = Math.floor(Math.random() * 360)
    return `hsl(${hue}, 100%, 40%)`
  })

  // 🎨 캔버스 생성 및 초기화
  useEffect(() => {
    const container = containerRef.current
    const newCanvas = new fabric.Canvas(canvasRef.current, {
      width: container.offsetWidth,
      height: container.offsetHeight,
      backgroundColor: '#ffffff',
      isDrawingMode: true,
    })

    newCanvas.freeDrawingBrush = new fabric.PencilBrush(newCanvas)
    newCanvas.freeDrawingBrush.width = 3
    newCanvas.freeDrawingBrush.color = color

    setCanvas(newCanvas)

    const handleResize = () => {
      newCanvas.setWidth(container.offsetWidth)
      newCanvas.setHeight(container.offsetHeight)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      newCanvas.dispose()
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // ✏️ 도구 설정 변경
  useEffect(() => {
    if (!canvas) return

    if (tool === 'pen') {
      canvas.isDrawingMode = true
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
      canvas.freeDrawingBrush.width = 3
      canvas.freeDrawingBrush.color = color
    } else {
      canvas.isDrawingMode = false
    }

    canvas.renderAll()
  }, [tool, canvas])

  // 🌐 SockJS + STOMP 연결

  const connectAndSubscribe = () => {
    const token = localStorage.getItem('accessToken')
    if (!roomId) {
      alert('roomId를 입력하세요')
      return
    }
    const socket = new SockJS('http://localhost:8080/ws')
    const stomp = Stomp.over(socket)

    stomp.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        console.log('[STOMP] Connected')

        stomp.subscribe(`/topic/meetings/${roomId}/chat`, (msg) => {
          try {
            const data = JSON.parse(msg.body)
            const parsed = JSON.parse(data.message)

            if (data.userId !== userId && parsed?.path) {
              const path = new fabric.Path(parsed.path, {
                fill: null,
                stroke: data.color || 'black',
                strokeWidth: parsed.strokeWidth || 3,
              })
              canvas.add(path)
            }
          } catch (e) {
            console.error('[ERROR] 메시지 처리 실패:', e)
          }
        })

        setStompClient(stomp)
        setIsSubscribed(true)
      },
      (err) => {
        console.error('[STOMP] 연결 실패:', err)
        alert('WebSocket 연결 실패')
      }
    )
  }

  // ✏️ 그림 그릴 때 → 서버로 전송
  useEffect(() => {
    if (!canvas || !stompClient || !isSubscribed) return

    const handleDraw = (opt) => {
      const path = opt.path

      const messagePayload = {
        path: path.path,
        strokeWidth: path.strokeWidth,
      }

      const payload = {
        userId,
        color,
        type: 'TALK',
        message: JSON.stringify(messagePayload),
      }
      stompClient.send(`/app/meetings/${roomId}/chat`, {}, JSON.stringify(payload))
    }

    canvas.on('path:created', handleDraw)
    return () => canvas.off('path:created', handleDraw)
  }, [canvas, stompClient, isSubscribed])

  // 🧹 전체 클리어
  const handleClear = () => {
    if (!canvas || !stompClient || !roomId) return
    stompClient.send(
      `/app/meetings/${roomId}/chat`,
      {},
      JSON.stringify({
        type: 'CLEAR',
        message: '',
      })
    )

    canvas.clear()
    canvas.backgroundColor = '#ffffff'
  }

  return (
    <div style={{ width: '100%', height: '100vh' }} ref={containerRef}>
      <div style={{ padding: '10px', background: '#f5f5f5', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Room ID 입력"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button onClick={connectAndSubscribe} disabled={isSubscribed}>
          방 구독
        </button>

        <button onClick={() => setTool('pen')}>✏️ Pen</button>
        <button onClick={handleClear}>🗑️ Clear</button>
      </div>
      <canvas ref={canvasRef} />
    </div>
  )
}

export default Whiteboard
