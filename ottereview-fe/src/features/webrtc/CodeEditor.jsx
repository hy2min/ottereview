import { Transaction } from '@codemirror/state'
import * as yorkie from '@yorkie-js/sdk'
import { basicSetup, EditorView } from 'codemirror'
import { useEffect, useRef, useState } from 'react'

const CodeEditor = ({ roomId, initialCode = null }) => {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const docRef = useRef(null)
  const clientRef = useRef(null)
  const [status, setStatus] = useState('connecting') // connecting, connected, error
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!roomId) return

    console.log('Yorkie CodeEditor 초기화 시작, roomId:', roomId)

    let view
    let client

    const initialize = async () => {
      try {
        setStatus('connecting')
        setError(null)

        // 환경변수 확인
        const rpcAddr = import.meta.env.VITE_YORKIE_API_ADDR
        const apiKey = import.meta.env.VITE_YORKIE_API_KEY

        console.log('Yorkie 설정:', { rpcAddr, hasApiKey: !!apiKey })

        if (!rpcAddr || !apiKey) {
          throw new Error('Yorkie 환경변수가 설정되지 않았습니다.')
        }

        // 1. Yorkie 클라이언트 생성 및 활성화
        client = new yorkie.Client({
          rpcAddr,
          apiKey,
          syncLoopDuration: 50,
          reconnectStreamDelay: 1000,
        })

        await client.activate()
        clientRef.current = client
        console.log('Yorkie 클라이언트 활성화 완료')

        // 2. 문서 생성 및 연결 (roomId를 문서 키로 사용)
        const doc = new yorkie.Document(`code_editor_${roomId}`, {
          enableDevtools: true,
        })

        await client.attach(doc)
        docRef.current = doc
        console.log('Yorkie 문서 연결 완료')

        // 초기 content 생성
        doc.update((root) => {
          if (!root.content) {
            root.content = new yorkie.Text()
            // 초기 코드 템플릿
            const codeToUse =
              initialCode ||
              `// 채팅방 ${roomId}의 협업 코드 편집기\n// 실시간으로 다른 사용자와 함께 편집할 수 있습니다\n\nfunction hello() {\n  console.log("Hello, collaborative coding!");\n}\n\n`

            root.content.edit(0, 0, codeToUse)
          }
        })

        // 3. 문서 변경 이벤트 감지 및 반영
        const syncText = () => {
          const yText = doc.getRoot().content
          const currentView = viewRef.current
          if (currentView && yText) {
            const newContent = yText.toString()
            const currentContent = currentView.state.doc.toString()

            // 내용이 실제로 다를 때만 업데이트
            if (newContent !== currentContent) {
              currentView.dispatch({
                changes: {
                  from: 0,
                  to: currentView.state.doc.length,
                  insert: newContent,
                },
                annotations: [Transaction.remote.of(true)], // 중요: 원격 변경임을 표시
              })
            }
          }
        }

        doc.subscribe((event) => {
          if (event.type === 'snapshot') {
            console.log('Yorkie 문서 스냅샷 받음')
            syncText()
          }
        })

        doc.subscribe('$.content', (event) => {
          if (event.type === 'remote-change') {
            console.log('원격 변경 감지:', event.value)
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

            // 원격 변경이 아니고 사용자 입력인 경우에만 Yorkie로 전송
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

        // 초기 동기화
        syncText()
        setStatus('connected')
        console.log('Yorkie CodeEditor 초기화 완료')
      } catch (error) {
        console.error('Yorkie CodeEditor 초기화 실패:', error)
        setError(error.message)
        setStatus('error')
      }
    }

    const handleOperations = (operations) => {
      const currentView = viewRef.current
      if (!currentView) return

      for (const op of operations) {
        if (op.type === 'edit') {
          try {
            currentView.dispatch({
              changes: {
                from: Math.max(0, op.from),
                to: Math.max(0, op.to),
                insert: op.value.content,
              },
              annotations: [Transaction.remote.of(true)], // 중요: 원격 변경임을 표시
            })
          } catch (error) {
            console.error('편집 작업 적용 실패:', error)
          }
        }
      }
    }

    initialize()

    return () => {
      console.log('Yorkie CodeEditor 정리 중...')
      if (client) {
        client.deactivate().catch(console.error)
      }
      if (view) {
        view.destroy()
      }
    }
  }, [roomId])

  if (status === 'error') {
    return (
      <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '1rem' }}>
        <h3>코드 편집기 연결 오류</h3>
        <div
          style={{
            padding: '15px',
            border: '1px solid #ff6b6b',
            borderRadius: '4px',
            backgroundColor: '#fff5f5',
            color: '#d63031',
          }}
        >
          <strong>오류:</strong> {error}
          <details style={{ marginTop: '10px', fontSize: '0.9em' }}>
            <summary style={{ cursor: 'pointer' }}>해결 방법</summary>
            <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
              <li>환경변수 VITE_YORKIE_API_ADDR와 VITE_YORKIE_API_KEY 확인</li>
              <li>개발 서버 재시작</li>
              <li>네트워크 연결 확인</li>
            </ul>
          </details>
        </div>
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '1rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <h3>협업 코드 편집기 (Room: {roomId})</h3>
        <div
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.8em',
            backgroundColor: status === 'connected' ? '#d4edda' : '#fff3cd',
            color: status === 'connected' ? '#155724' : '#856404',
            border: `1px solid ${status === 'connected' ? '#c3e6cb' : '#ffeaa7'}`,
          }}
        >
          {status === 'connecting' ? '연결 중...' : '연결됨 ✓'}
        </div>
      </div>
      <div
        id="editor"
        ref={editorRef}
        style={{
          height: '400px',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          opacity: status === 'connected' ? 1 : 0.7,
        }}
      />
    </div>
  )
}

export default CodeEditor
