import { Transaction } from '@codemirror/state'
import * as yorkie from '@yorkie-js/sdk'
import { basicSetup, EditorView } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { useEffect, useRef, useState } from 'react'

const CodeEditor = ({ roomId, conflictFiles }) => {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const docRef = useRef(null)
  const clientRef = useRef(null)

  const [selectedFileName, setSelectedFileName] = useState('')
  const [roomDocuments, setRoomDocuments] = useState([])
  const [status, setStatus] = useState('connecting') // connecting, connected, error
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // 현재 선택된 파일의 문서 키 생성
  const currentDocumentKey = selectedFileName
    ? `${roomId}_${selectedFileName.replace(/[^a-zA-Z0-9_-]/g, '_')}`
    : null

  // 파일 선택 핸들러
  const handleFileSelect = (filename) => {
    setSelectedFileName(filename)
    console.log('📝 파일 선택:', filename)
  }

  // Yorkie 클라이언트 초기화 및 방 문서들 로드
  useEffect(() => {
    if (!roomId) return

    console.log('Yorkie CodeEditor 초기화 시작:', { roomId, conflictFiles })

    const initializeYorkie = async () => {
      try {
        setLoading(true)
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
        const client = new yorkie.Client({
          rpcAddr,
          apiKey,
          syncLoopDuration: 50,
          reconnectStreamDelay: 1000,
        })

        await client.activate()
        clientRef.current = client
        console.log('Yorkie 클라이언트 활성화 완료')

        // 2. roomId로 시작하는 모든 Yorkie 문서 검색
        try {
          // 실제 Yorkie client에서 모든 문서 목록 가져오기
          const allDocuments = await client.listDocuments()
          console.log(
            '📋 전체 문서 목록:',
            allDocuments.map((doc) => doc.getKey())
          )

          // roomId로 시작하는 문서들만 필터링
          const filteredDocs = allDocuments.filter((doc) => doc.getKey().startsWith(`${roomId}_`))
          console.log(
            `🔍 Room ${roomId}에 해당하는 문서들:`,
            filteredDocs.map((doc) => doc.getKey())
          )

          // 문서 키에서 파일명 추출
          const roomDocs = filteredDocs.map((doc) => {
            const docKey = doc.getKey()
            // roomId_ 부분을 제거하고 파일명 추출
            const fileName = docKey.substring(`${roomId}_`.length).replace(/_/g, '.')
            return { key: docKey, fileName }
          })

          // conflictFiles에 있는 파일들 중 실제 문서가 없는 경우 추가
          for (const fileName of conflictFiles) {
            const expectedDocKey = `${roomId}_${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}`
            const exists = roomDocs.some((doc) => doc.key === expectedDocKey)

            if (!exists) {
              console.log(`➕ 새 문서 추가 예정: ${expectedDocKey}`)
              roomDocs.push({ key: expectedDocKey, fileName })
            }
          }

          setRoomDocuments(roomDocs)
          console.log(`📄 최종 Room ${roomId} 문서 목록:`, roomDocs)
        } catch (docError) {
          console.warn('Yorkie 문서 목록 조회 실패, conflictFiles로 대체:', docError)
          // Yorkie 문서 목록 조회 실패 시 conflictFiles 기반으로 생성
          const fallbackDocs = conflictFiles.map((fileName) => ({
            key: `${roomId}_${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
            fileName,
          }))
          setRoomDocuments(fallbackDocs)
        }

        // 3. 첫 번째 파일을 기본 선택
        if (conflictFiles.length > 0) {
          setSelectedFileName(conflictFiles[0])
        }

        setStatus('connected')
        console.log('Yorkie 클라이언트 초기화 완료')
      } catch (error) {
        console.error('Yorkie 클라이언트 초기화 실패:', error)
        setError(error.message)
        setStatus('error')
      } finally {
        setLoading(false)
      }
    }

    initializeYorkie()

    return () => {
      console.log('Yorkie 클라이언트 정리 중...')
      if (clientRef.current) {
        clientRef.current.deactivate().catch(console.error)
      }
    }
  }, [roomId, conflictFiles])

  // 선택된 파일에 대한 문서 연결 및 에디터 초기화
  useEffect(() => {
    if (!currentDocumentKey || !clientRef.current || status !== 'connected') return

    console.log('문서 연결 시작:', currentDocumentKey)

    let view
    let doc

    const initializeEditor = async () => {
      try {
        const client = clientRef.current

        // 1. 문서 생성 및 연결
        doc = new yorkie.Document(currentDocumentKey, {
          enableDevtools: true,
        })

        await client.attach(doc)
        docRef.current = doc
        console.log('Yorkie 문서 연결 완료:', currentDocumentKey)

        // 초기 content 확인
        doc.update((root) => {
          if (!root.content) {
            root.content = new yorkie.Text()
            // 기본 템플릿
            const defaultCode = `// 파일: ${selectedFileName}
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

        // 2. 문서 변경 이벤트 감지 및 반영
        const syncText = () => {
          const yText = doc.getRoot().content
          const currentView = viewRef.current
          if (currentView && yText) {
            const newContent = yText.toString()
            const currentContent = currentView.state.doc.toString()

            if (newContent !== currentContent) {
              currentView.dispatch({
                changes: {
                  from: 0,
                  to: currentView.state.doc.length,
                  insert: newContent,
                },
                annotations: [Transaction.remote.of(true)],
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

        // 3. EditorView 생성
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
              return javascript()
          }
        }

        // 기존 에디터 정리
        if (viewRef.current) {
          viewRef.current.destroy()
        }

        view = new EditorView({
          doc: '',
          extensions: [
            basicSetup,
            getLanguageExtension(selectedFileName),
            oneDark,
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
        console.log('에디터 초기화 완료:', selectedFileName)
      } catch (error) {
        console.error('에디터 초기화 실패:', error)
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
              annotations: [Transaction.remote.of(true)],
            })
          } catch (error) {
            console.error('편집 작업 적용 실패:', error)
          }
        }
      }
    }

    initializeEditor()

    return () => {
      console.log('문서 정리 중:', currentDocumentKey)
      if (doc && clientRef.current) {
        clientRef.current.detach(doc).catch(console.error)
      }
      if (view) {
        view.destroy()
      }
    }
  }, [currentDocumentKey, selectedFileName, status])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
      }
    }
  }, [])

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
      {/* 파일 탭 영역 */}
      {conflictFiles.length > 0 && (
        <div className="flex bg-gray-50 border-b border-gray-200 px-4 py-2 gap-2 flex-wrap flex-shrink-0">
          {conflictFiles.map((fileName) => (
            <button
              key={fileName}
              onClick={() => handleFileSelect(fileName)}
              className={`px-4 py-2 rounded-t-md border-none text-sm font-medium cursor-pointer transition-all duration-200 flex items-center gap-2 border-b-2 ${
                selectedFileName === fileName
                  ? 'bg-white text-gray-800 font-semibold border-b-blue-500'
                  : 'bg-transparent text-gray-600 border-b-transparent hover:bg-blue-50'
              }`}
            >
              <span>📄</span>
              <span>{fileName}</span>
              {selectedFileName === fileName && <span className="text-xs text-green-500">●</span>}
            </button>
          ))}
        </div>
      )}

      {/* 상태 표시 헤더 */}
      {selectedFileName && (
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
            📄 {selectedFileName}
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
            {status === 'connecting' || loading ? '🔄 연결 중...' : '✅ 실시간 협업'}
          </div>
        </div>
      )}

      {/* 에디터 영역 */}
      <div
        ref={editorRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          opacity: status === 'connected' && selectedFileName ? 1 : 0.7,
          display: 'flex',
          alignItems: selectedFileName ? 'stretch' : 'center',
          justifyContent: selectedFileName ? 'stretch' : 'center',
        }}
      >
        {!selectedFileName && (
          <div className="flex items-center justify-center h-full text-gray-600 text-lg flex-col gap-4 p-8">
            {loading ? (
              <>
                <div>📁 파일을 불러오는 중...</div>
                <div className="text-base text-gray-400">Yorkie 문서를 준비하고 있습니다.</div>
              </>
            ) : conflictFiles.length > 0 ? (
              <>
                <div>📂 편집할 파일을 선택해주세요</div>
                <div className="text-base text-gray-400">
                  위의 파일 탭을 클릭하여 협업 편집을 시작하세요.
                </div>
              </>
            ) : (
              <>
                <div>📭 사용 가능한 파일이 없습니다</div>
                <div className="text-base text-gray-400">
                  Conflict 페이지에서 파일을 선택해주세요.
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 디버그 정보 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && selectedFileName && (
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
          🐛 Debug: {status} | 문서키: {currentDocumentKey} | 문서수: {roomDocuments.length}
        </div>
      )}
    </div>
  )
}

export default CodeEditor
