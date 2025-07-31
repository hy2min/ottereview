import { fabric } from 'fabric'
import { useSocketStore } from '../store/socketStore'
import { useEffect, useRef, useState } from 'react'

const Whiteboard = ({ roomId, userId, color }) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [canvas, setCanvas] = useState(null)
  const stompClient = useSocketStore((state) => state.stompClient)

  useEffect(() => {
    const container = containerRef.current
    const newCanvas = new fabric.Canvas(canvasRef.current, {
      width: container.offsetWidth,
      height: container.offsetHeight,
      backgroundColor: '#fff',
      isDrawingMode: true,
    })

    newCanvas.freeDrawingBrush.width = 3
    newCanvas.freeDrawingBrush.color = color
    setCanvas(newCanvas)

    window.addEventListener('resize', () => {
      newCanvas.setWidth(container.offsetWidth)
      newCanvas.setHeight(container.offsetHeight)
    })

    return () => newCanvas.dispose()
  }, [])

  useEffect(() => {
    if (!canvas || !stompClient) return

    stompClient.subscribe(`/topic/meetings/${roomId}/chat`, (msg) => {
      const data = JSON.parse(msg.body)
      if (data.type === 'DRAW' && data.userId !== userId) {
        const parsed = JSON.parse(data.message)
        const path = new fabric.Path(parsed.path, {
          stroke: data.color,
          strokeWidth: parsed.strokeWidth,
          fill: null,
        })
        canvas.add(path)
      }
    })

    canvas.on('path:created', (opt) => {
      const path = opt.path
      stompClient.send(
        `/app/meetings/${roomId}/chat`,
        {},
        JSON.stringify({
          type: 'DRAW',
          userId,
          color,
          message: JSON.stringify({ path: path.path, strokeWidth: path.strokeWidth }),
        })
      )
    })
  }, [canvas, stompClient])

  return (
    <div ref={containerRef} style={{ flex: 1 }}>
      <canvas ref={canvasRef} />
    </div>
  )
}

export default Whiteboard
