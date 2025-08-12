import { javascript } from '@codemirror/lang-javascript'
import { Transaction } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import * as yorkie from '@yorkie-js/sdk'
import { basicSetup, EditorView } from 'codemirror'
import { useEffect, useRef, useState } from 'react'

const CodeEditor = ({ roomId, fileName, documentKey }) => {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const docRef = useRef(null)
  const clientRef = useRef(null)
  const [status, setStatus] = useState('connecting') // connecting, connected, error
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!roomId || !fileName || !documentKey) return

    console.log('Yorkie CodeEditor 초기화 시작:', { roomId, fileName, documentKey })

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

        // 2. 문서 생성 및 연결 (ChatRoom에서 전달받은 documentKey 사용)
        const doc = new yorkie.Document(documentKey, {
          enableDevtools: true,
        })

        await client.attach(doc)
        docRef.current = doc
        console.log('Yorkie 문서 연결 완료:', documentKey)

        // 초기 content 확인 (Conflict에서 이미 생성되었을 수 있음)
        doc.update((root) => {
          if (!root.content) {
            root.content = new yorkie.Text()
            // 기본 템플릿 (Conflict에서 이미 설정되지 않은 경우에만)
            const defaultCode = `// 파일: ${fileName}
// 충돌 해결용 코드 편집기
// 실시간으로 다른 사용자와 함께 편집할 수 있습니다

function hello() {
  console.log("Hello, collaborative coding!");
}

// TODO: 충돌을 해결하고 올바른 코드를 작성하세요
`
            root.content.edit(0, 0, defaultCode)
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

        // 4. EditorView 생성 (언어 지원 및 테마 추가)
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

        // 파일 확장자에 따른 언어 설정
        const getLanguageExtension = (fileName) => {
          const ext = fileName.split('.').pop()?.toLowerCase()
          switch (ext) {
            case 'js':
            case 'jsx':
            case 'ts':
            case 'tsx':
              return javascript()
            default:
              return javascript() // 기본값
          }
        }

        view = new EditorView({
          doc: '',
          extensions: [
            basicSetup,
            getLanguageExtension(fileName),
            oneDark, // 다크 테마
            updateListener,
            EditorView.theme({
              '&': {
                height: '100%',
                fontSize: '14px',
              },
              '.cm-content': {
                fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
                lineHeight: '1.5',
              },
              '.cm-editor': {
                height: '100%',
              },
              '.cm-scroller': {
                height: '100%',
              },
            }),
          ],
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
  }, [roomId, fileName, documentKey]) // documentKey 변경시 재초기화

  if (status === 'error') {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
          padding: '2rem',
          backgroundColor: '#fee2e2',
          borderRadius: '8px',
        }}
      >
        <div style={{ fontSize: '2rem' }}>❌</div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#dc2626' }}>연결 오류</h3>
          <p style={{ margin: '0 0 1rem 0', color: '#7f1d1d' }}>{error}</p>
          <details style={{ fontSize: '0.875rem', color: '#991b1b' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>해결 방법</summary>
            <ul style={{ textAlign: 'left', paddingLeft: '1.5rem' }}>
              <li>Yorkie 환경변수 확인</li>
              <li>개발 서버 재시작</li>
              <li>네트워크 연결 확인</li>
            </ul>
          </details>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 상태 표시 헤더 */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: status === 'connected' ? '#dcfce7' : '#fef3c7',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: status === 'connected' ? '#166534' : '#92400e',
          }}
        >
          📄 {fileName}
        </div>
        <div
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '500',
            backgroundColor: status === 'connected' ? '#16a34a' : '#f59e0b',
            color: 'white',
          }}
        >
          {status === 'connecting' ? '🔄 연결 중...' : '✅ 실시간 협업'}
        </div>
      </div>

      {/* 에디터 영역 */}
      <div
        ref={editorRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          opacity: status === 'connected' ? 1 : 0.7,
        }}
      />

      {/* 디버그 정보 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            padding: '0.5rem',
            fontSize: '0.75rem',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            borderTop: '1px solid #e5e7eb',
            flexShrink: 0,
          }}
        >
          🐛 Debug: {status} | 문서키: {documentKey}
        </div>
      )}
    </div>
  )
}

export default CodeEditor
