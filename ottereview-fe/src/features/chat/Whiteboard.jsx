import 'tldraw/tldraw.css'

import * as yorkie from '@yorkie-js/sdk'
import randomColor from 'randomcolor'
import { useCallback, useEffect, useState } from 'react'
import { Tldraw } from 'tldraw'
import { names, uniqueNamesGenerator } from 'unique-names-generator'

let client
let doc

export default function Whiteboard({ roomId }) {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null) // New state for backend userId

  // 1. 사용자 ID 시뮬레이션 (실제 앱에서는 백엔드에서 받아올 수도 있음)
  useEffect(() => {
    const fetchedUserId = `user-${Math.random().toString(36).substring(2, 9)}`
    setUserId(fetchedUserId)
  }, [])

  // 2. Tldraw 초기 마운트 처리
  const onMount = useCallback(
    (app) => {
      if (!userId) return
      const randomName = uniqueNamesGenerator({ dictionaries: [names] })
      const userColor = randomColor()

      // 2-1. 캔버스 로딩 및 일시정지
      setLoading(true)

      // 2-2. Yorkie 설정 및 연동
      const setup = async () => {
        client = new yorkie.Client({
          rpcAddr: import.meta.env.VITE_YORKIE_API_ADDR,
          apiKey: import.meta.env.VITE_YORKIE_API_KEY,
        })
        await client.activate()

        doc = new yorkie.Document(roomId)
        await client.attach(doc, {
          initialPresence: {
            tdUser: {
              id: userId,
              point: [0, 0],
              color: userColor,
              status: 'connected',
              selectedIds: [],
              metadata: { name: randomName },
            },
          },
        })

        doc.update((root) => {
          if (!root.shapes) root.shapes = {}
          if (!root.bindings) root.bindings = {}
          if (!root.assets) root.assets = {}
        })

        doc.subscribe((event) => {
          if (event.type === 'remote-change') {
            const root = doc.getRoot()
            app.replacePageContent(
              JSON.parse(root.shapes.toJSON()),
              JSON.parse(root.bindings.toJSON()),
              JSON.parse(root.assets.toJSON())
            )
          }
        })

        doc.subscribe('others', () => {
          const peers = doc.getPresences().map((p) => p.presence.tdUser)
          console.log('🧑‍🤝‍🧑 현재 접속자:', peers)
        })

        await client.sync()

        app.zoomToFit()
        setLoading(false)
      }

      setup()
    },
    [roomId, userId]
  )

  // 3. 사용자 페이지 내 수정사항이 생겼을 때 → Yorkie에 동기화
  const onChangePage = useCallback((app, shapes, bindings) => {
    if (!doc) return
    doc.update((root) => {
      root.shapes = { ...shapes }
      root.bindings = { ...bindings }
      root.assets = { ...app.assets }
    })
  }, [])

  // 4. 사용자 포인터/선택 변화 시 presence 업데이트
  const onChangePresence = useCallback((app, user) => {
    if (!doc || !client?.isActive()) return
    doc.update((root, presence) => {
      presence.set({ tdUser: user })
    })
  }, [])

  // 5. userId 없으면 로딩
  if (!userId) {
    return <div>🔄 사용자 정보 로딩 중...</div>
  }

  return (
    <div style={{ height: '500px', border: '1px solid #ccc', marginTop: '2rem' }}>
      <Tldraw
        onMount={onMount}
        onChangePage={onChangePage}
        onChangePresence={onChangePresence}
        showUi={!loading}
        autofocus
      />
    </div>
  )
}
