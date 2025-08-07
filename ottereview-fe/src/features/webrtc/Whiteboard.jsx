import 'tldraw/tldraw.css'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import randomColor from 'randomcolor'
import { names, uniqueNamesGenerator } from 'unique-names-generator'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { createTLStore, createYjsStore, defaultShapeUtils, Tldraw } from '@tldraw/tldraw'
import { names, uniqueNamesGenerator } from 'unique-names-generator'

const Whiteboard = ({ roomId }) => {
  const [loading, setLoading] = useState(true)

  // 사용자의 고유 ID, 색상, 이름을 생성
  const [userId] = useState(() => `instance:${crypto.randomUUID()}`)
  const [color] = useState(() => randomColor())
  const [name] = useState(() => uniqueNamesGenerator({ dictionaries: [names] }))

  const editorRef = useRef(null)

const { store } = useMemo(() => {
    const doc = new Y.Doc()
    const provider = new WebsocketProvider('wss://demos.yjs.dev', roomId, doc)

    // 커서, 사용자 이름, 색상 등 공유
    provider.awareness.setLocalStateField('user', { name, color })

    const baseStore = createTLStore({ shapeUtils: defaultShapeUtils })

    return createYjsStore({
      store: baseStore,
      doc,
      awareness: provider.awareness,
    })
  }, [roomId, name, color])

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
