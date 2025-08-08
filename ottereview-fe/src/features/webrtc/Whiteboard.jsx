import 'tldraw/tldraw.css'

import randomColor from 'randomcolor'
import { useCallback, useMemo, useRef, useState } from 'react'
import { createTLStore, defaultShapeUtils, Tldraw } from 'tldraw'
import { names, uniqueNamesGenerator } from 'unique-names-generator'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const Whiteboard = ({ roomId }) => {
  const [loading, setLoading] = useState(true)

  // 사용자 임의 식별자, 이름, 색상 생성 (인증 없이 구분용)
  const [userId] = useState(() => `instance:${crypto.randomUUID()}`)
  const [color] = useState(() => randomColor())
  const [name] = useState(() => uniqueNamesGenerator({ dictionaries: [names] }))

  const editorRef = useRef(null)

  // Yjs Doc, WebsocketProvider, Tldraw store 생성 및 동기화
  const store = useMemo(() => {
    const doc = new Y.Doc()
    console.log('roomId:', roomId);
    // JWT 토큰 없이 WebSocket URL, roomId만 경로에 포함
    const wsUrl = `ws://localhost:8080/api/yjs`
    const provider = new WebsocketProvider(wsUrl, roomId, doc)
  
    // 로컬 사용자 상태 설정 (임의 이름과 색상)
    provider.awareness.setLocalStateField('user', { name, color })

    provider.on('status', event => {
      if (event.status === 'connected') {
        console.log('화이트보드 WebSocket 연결 성공');
      } else if (event.status === 'disconnected') {
        console.log('화이트보드 WebSocket 연결 끊김');
      }
    });

    const store = createTLStore({ shapeUtils: defaultShapeUtils })

    const shapesMap = doc.getMap('shapes')

    // Yjs에서 store로 동기화
    shapesMap.observe(event => {
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add' || change.action === 'update') {
          const shape = shapesMap.get(key)
          if (shape) store.put([shape])
        } else if (change.action === 'delete') {
          store.remove([key])
        }
      })
    })

    // store에서 Yjs로 동기화
    store.listen(change => {
      if (change.source !== 'user') return

      Object.values(change.changes.added).forEach(record => {
        if (record.typeName === 'shape') {
          shapesMap.set(record.id, record)
        }
      })
      Object.values(change.changes.updated).forEach(([_, to]) => {
        if (to.typeName === 'shape') {
          shapesMap.set(to.id, to)
        }
      })
      Object.values(change.changes.removed).forEach(record => {
        if (record.typeName === 'shape') {
          shapesMap.delete(record.id)
        }
      })
    }, { source: 'user', scope: 'document' })

    return store
  }, [roomId, name, color])

  // 에디터 마운트 시 사용자 정보 업데이트 및 로딩 완료 처리
  const onMount = useCallback(editor => {
    editorRef.current = editor
    editor.updateInstanceState({ id: userId, meta: { name, color } })
    setLoading(false)
  }, [userId, name, color])

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <Tldraw store={store} onMount={onMount} showUi={!loading} autofocus />
    </div>
  )
}

export default Whiteboard
