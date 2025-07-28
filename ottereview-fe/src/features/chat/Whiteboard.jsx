import { useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'

const Whiteboard = () => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [canvas, setCanvas] = useState(null)
  const [tool, setTool] = useState('pen')

  useEffect(() => {
    const container = containerRef.current
    const newCanvas = new fabric.Canvas(canvasRef.current, {
      width: container.offsetWidth,
      height: container.offsetHeight,
      backgroundColor: '#ffffff',
      isDrawingMode: true,
    })

    // 기본 펜 설정
    newCanvas.freeDrawingBrush = new fabric.PencilBrush(newCanvas)
    newCanvas.freeDrawingBrush.width = 3
    newCanvas.freeDrawingBrush.color = 'black'

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

  useEffect(() => {
    if (!canvas) return

    if (tool === 'pen') {
      canvas.isDrawingMode = true
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
      canvas.freeDrawingBrush.width = 3
      canvas.freeDrawingBrush.color = 'black'
    } else {
      canvas.isDrawingMode = false
    }

    canvas.renderAll()
  }, [tool, canvas])

  const handleClear = () => {
    if (canvas) {
      canvas.clear()
      canvas.backgroundColor = '#ffffff'
    }
  }

  return (
    <div style={{ width: '100%', height: '100vh' }} ref={containerRef}>
      <div style={{ padding: '10px', background: '#f5f5f5', display: 'flex', gap: '10px' }}>
        <button onClick={() => setTool('pen')}>✏️ Pen</button>
        <button onClick={handleClear}>🗑️ Clear</button>
      </div>
      <canvas ref={canvasRef} />
    </div>
  )
}

export default Whiteboard
