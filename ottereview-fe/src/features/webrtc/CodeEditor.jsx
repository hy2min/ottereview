import { Transaction } from '@codemirror/state'
import * as yorkie from '@yorkie-js/sdk'
import { basicSetup, EditorView } from 'codemirror'
import { useEffect, useRef } from 'react'

const CollaborativeEditor = ({ roomName }) => {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const docRef = useRef(null)
  const clientRef = useRef(null)

  useEffect(() => {
    if (!roomName) return

    let view
    let client

    const initialize = async () => {
      // 1. Yorkie 클라이언트 생성 및 활성화
      client = new yorkie.Client({
        rpcAddr: import.meta.env.VITE_YORKIE_API_ADDR,
        apiKey: import.meta.env.VITE_YORKIE_API_KEY,
      })
      await client.activate()
      clientRef.current = client

      // 2. 문서 생성 및 연결
      const doc = new yorkie.Document(roomName, {
        enableDevtools: true,
      })
      await client.attach(doc)
      docRef.current = doc

      // 초기 content 생성
      doc.update((root) => {
        if (!root.content) {
          root.content = new yorkie.Text()
        }
      })

      // 3. 문서 변경 이벤트 감지 및 반영
      const syncText = () => {
        const yText = doc.getRoot().content
        const currentView = viewRef.current
        if (currentView && yText) {
          currentView.dispatch({
            changes: {
              from: 0,
              to: currentView.state.doc.length,
              insert: yText.toString(),
            },
            annotations: [Transaction.remote.of(true)],
          })
        }
      }

      doc.subscribe((event) => {
        if (event.type === 'snapshot') syncText()
      })

      doc.subscribe('$.content', (event) => {
        if (event.type === 'remote-change') {
          const { operations } = event.value
          handleOperations(operations)
        }
      })

      await client.sync()

      // 4. EditorView 생성
      const updateListener = EditorView.updateListener.of((v) => {
        if (!doc || !v.docChanged) return
        for (const tr of v.transactions) {
          const events = ['input', 'delete', 'move', 'undo', 'redo', 'select']
          const userEvent = events.some((e) => tr.isUserEvent(e))
          if (!userEvent || tr.annotation(Transaction.remote)) continue

          tr.changes.iterChanges((from, to, _, __, inserted) => {
            const text = inserted.toJSON().join('\n')
            doc.update((root) => {
              root.content.edit(from, to, text)
            })
          })
        }
      })

      view = new EditorView({
        doc: '',
        extensions: [basicSetup, updateListener],
        parent: editorRef.current,
      })
      viewRef.current = view

      syncText()
    }

    const handleOperations = (operations) => {
      const currentView = viewRef.current
      if (!currentView) return
      for (const op of operations) {
        if (op.type === 'edit') {
          currentView.dispatch({
            changes: {
              from: Math.max(0, op.from),
              to: Math.max(0, op.to),
              insert: op.value.content,
            },
            annotations: [Transaction.remote.of(true)],
          })
        }
      }
    }

    initialize()

    return () => {
      if (client) client.deactivate()
      if (view) view.destroy()
    }
  }, [roomName])

  return <div id="editor" ref={editorRef} style={{ height: '400px' }} />
}

export default CollaborativeEditor
