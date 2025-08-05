import 'tldraw/tldraw.css'

import * as yorkie from '@yorkie-js/sdk'
import randomColor from 'randomcolor'
import { useCallback, useEffect, useState } from 'react'
import { Tldraw, createTLStore, defaultShapeUtils } from 'tldraw'
import { names, uniqueNamesGenerator } from 'unique-names-generator'

let client
let doc

const WhiteboardY = ({ roomId }) => {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }))

  // 1. 사용자 ID 생성
  useEffect(() => {
    const id = `user-${Math.random().toString(36).substring(2, 9)}`
    setUserId(id)
  }, [])

  // 2. Tldraw 마운트 시 Yorkie 초기화
  const onMount = useCallback(
    async (editor) => {
      if (!userId) return
      setLoading(true)

      const randomName = uniqueNamesGenerator({ dictionaries: [names] })
      const userColor = randomColor()

      // Yorkie 클라이언트 연결
      client = new yorkie.Client({
        rpcAddr: import.meta.env.VITE_YORKIE_API_ADDR,
        apiKey: import.meta.env.VITE_YORKIE_API_KEY,
      })
      await client.activate()

      doc = new yorkie.Document(`whiteboard-${roomId}`, { enableDevtools: true })

      await client.attach(doc, {
        initialPresence: {
          tdUser: {
            id: userId,
            point: [0, 0],
            selectedIds: [],
            color: userColor,
            metadata: { name: randomName },
          },
        },
      })

      // 데이터 초기화 (CRDT-friendly 구조)
      doc.update((root) => {
        if (!root.shapes) root.shapes = {}
        if (!root.bindings) root.bindings = {}
        if (!root.assets) root.assets = {}
      })

      // 변경 수신 처리
      doc.subscribe((event) => {
        if (event.type === 'remote-change') {
          const root = doc.getRoot()
          const shapes = JSON.parse(root.shapes.toJSON())
          const bindings = JSON.parse(root.bindings.toJSON())
          const assets = JSON.parse(root.assets.toJSON())

          editor.store.batch(() => {
            editor.replacePageContent(shapes, bindings, assets)
          })
        }
      })

      // presence 동기화
      doc.subscribe('others', () => {
        const peers = doc.getPresences().map((p) => p.presence.tdUser)
        console.log('현재 접속자 목록:', peers)
      })

      await client.sync()
      editor.zoomToFit()
      setLoading(false)
    },
    [roomId, userId]
  )

  // 3. 변경 발생 시 Yorkie에 반영
  const onChangePage = useCallback((app, shapes, bindings) => {
    if (!doc) return
    doc.update((root) => {
      root.shapes = {}
      root.bindings = {}
      root.assets = {}

      for (const [id, shape] of Object.entries(shapes)) {
        root.shapes[id] = shape
      }
      for (const [id, binding] of Object.entries(bindings)) {
        root.bindings[id] = binding
      }
      for (const [id, asset] of Object.entries(app.assets)) {
        root.assets[id] = asset
      }
    })
  }, [])

  // 4. 포인터 / 선택 정보 presence 반영
  const onChangePresence = useCallback((app, user) => {
    if (!doc || !client?.isActive()) return
    doc.update((_, presence) => {
      presence.set({ tdUser: user })
    })
  }, [])

  // 5. 로딩 중 UI
  if (!userId) {
    return <div>🔄 사용자 정보 로딩 중...</div>
  }

  return (
    <div style={{ height: '500px', border: '1px solid #ccc', marginTop: '2rem' }}>
      <Tldraw
        store={store}
        onMount={onMount}
        onChangePage={onChangePage}
        onChangePresence={onChangePresence}
        showUi={!loading}
        autofocus
      />
    </div>
  )
}

export default WhiteboardY
