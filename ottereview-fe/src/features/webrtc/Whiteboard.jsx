import 'tldraw/tldraw.css'

import { Stomp } from '@stomp/stompjs'
import randomColor from 'randomcolor'
import { useCallback, useEffect, useRef, useState } from 'react'
import SockJS from 'sockjs-client'
import { createTLStore, defaultShapeUtils, Tldraw } from 'tldraw'
import { names, uniqueNamesGenerator } from 'unique-names-generator'

import { useAuthStore } from '@/features/auth/authStore'

const Whiteboard = ({ roomId }) => {
  const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }))
  const [loading, setLoading] = useState(true)

  // 사용자의 고유 ID, 색상, 이름을 생성
  const [userId] = useState(() => `instance:${crypto.randomUUID()}`)
  const [color] = useState(() => randomColor())
  const [name] = useState(() => uniqueNamesGenerator({ dictionaries: [names] }))

  const editorRef = useRef(null)
  const stompClientRef = useRef(null)

  // STOMP 웹소켓 연결을 설정
  useEffect(() => {
    const token = useAuthStore.getState().accessToken
    const socket = new SockJS('http://i13c108.p.ssafy.io:8080/ws')
    const stomp = Stomp.over(socket)
    stomp.debug = () => {} // 디버그 로그 비활성화

    stomp.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        console.log('[STOMP] connected')
        // 화이트보드 토픽을 구독
        stomp.subscribe(`/topic/meetings/${roomId}/whiteboard`, (msg) => {
          const editor = editorRef.current
          if (!editor) return

          const data = JSON.parse(msg.body)

          // 자신이 보낸 메시지는 무시
          if (data.senderName === name) {
            return
          }

          const { type, content } = data
          const shape = content ? JSON.parse(content) : null

          try {
            if (type === 'DRAW') {
              // 다른 사용자로부터 받은 도형 정보를 스토어에 추가/업데이트
              editor.store.put([shape], 'remote')
            } else if (type === 'ERASE') {
              // 다른 사용자로부터 받은 삭제 정보를 반영
              editor.deleteShapes([shape.id])
            } else if (type === 'CLEAR') {
              // 캔버스를 초기화합니다. (필요시)
              // editor.store.loadSnapshot({ store: {} })
            }
          } catch (error) {
            console.error('Failed to apply remote change:', error)
          }
        })

        stompClientRef.current = stomp
      },
      (err) => console.error('[STOMP] connection failed', err)
    )

    return () => {
      stompClientRef.current?.disconnect()
    }
  }, [roomId, name])

  // Tldraw 에디터가 마운트될 때 호출
  const onMount = useCallback(
    (editor) => {
      editorRef.current = editor
      editor.updateInstanceState({ id: userId, meta: { name, color } })
      setLoading(false)

      // 스토어 변경 리스너를 설정
      const handleChange = (change) => {
        if (change.source !== 'user') return

        const stomp = stompClientRef.current
        if (!stomp?.connected) return

        // 추가된 도형 처리
        for (const record of Object.values(change.changes.added)) {
          if (record.typeName !== 'shape') continue
          const payload = {
            type: 'DRAW',
            color: record.props.color || color,
            content: JSON.stringify(record),
          }
          stomp.send(`/app/meetings/${roomId}/whiteboard`, {}, JSON.stringify(payload))
        }

        // 업데이트된 도형 처리
        for (const [from, to] of Object.values(change.changes.updated)) {
          if (to.typeName !== 'shape') continue
          const payload = {
            type: 'DRAW',
            color: to.props.color || color,
            content: JSON.stringify(to),
          }
          stomp.send(`/app/meetings/${roomId}/whiteboard`, {}, JSON.stringify(payload))
        }

        // 삭제된 도형 처리
        for (const record of Object.values(change.changes.removed)) {
          if (record.typeName !== 'shape') continue
          const payload = {
            type: 'ERASE',
            content: JSON.stringify({ id: record.id }), // ID 정보만 전송
          }
          stomp.send(`/app/meetings/${roomId}/whiteboard`, {}, JSON.stringify(payload))
        }
      }

      editor.store.listen(handleChange, { source: 'user', scope: 'document' })
    },
    [userId, name, color, roomId]
  )

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <Tldraw store={store} onMount={onMount} showUi={!loading} autofocus />
    </div>
  )
}

export default Whiteboard
