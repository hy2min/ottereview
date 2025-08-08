import 'tldraw/tldraw.css'

import randomColor from 'randomcolor'
import { useCallback, useMemo, useRef, useState } from 'react'
import { createTLStore, defaultShapeUtils, Tldraw } from 'tldraw'
import { names, uniqueNamesGenerator } from 'unique-names-generator'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const Whiteboard = ({ roomId }) => {
  const [loading, setLoading] = useState(true)

  // 유저 정보
  const [userId] = useState(() => `instance:${crypto.randomUUID()}`)
  const [color] = useState(() => randomColor())
  const [name] = useState(() => uniqueNamesGenerator({ dictionaries: [names] }))

  const editorRef = useRef(null)

  // store + Yjs 연동
  const store = useMemo(() => {
    // 1. Y.Doc 생성
    const doc = new Y.Doc()

    // 2. WebSocket provider (테스트 서버)
    const provider = new WebsocketProvider('wss://demos.yjs.dev', roomId, doc)
    provider.awareness.setLocalStateField('user', { name, color })

    // 3. tldraw store 생성
    const store = createTLStore({ shapeUtils: defaultShapeUtils })

    // 4. Y.Map 생성 (shapes)
    const shapesMap = doc.getMap('shapes')

    // ---- Yjs → store ----
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

    // ---- store → Yjs ----
    store.listen(
      change => {
        if (change.source !== 'user') return
        Object.values(change.changes.added).forEach(record => {
          if (record.typeName === 'shape') {
            shapesMap.set(record.id, record)
          }
        })
        Object.values(change.changes.updated).forEach(([from, to]) => {
          if (to.typeName === 'shape') {
            shapesMap.set(to.id, to)
          }
        })
        Object.values(change.changes.removed).forEach(record => {
          if (record.typeName === 'shape') {
            shapesMap.delete(record.id)
          }
        })
      },
      { source: 'user', scope: 'document' }
    )

    return store
  }, [roomId, name, color])

  // 에디터 mount 시 호출
  const onMount = useCallback(
    editor => {
      editorRef.current = editor
      editor.updateInstanceState({ id: userId, meta: { name, color } })
      setLoading(false)
    },
    [userId, name, color]
  )

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <Tldraw store={store} onMount={onMount} showUi={!loading} autofocus />
    </div>
  )
}

export default Whiteboard
