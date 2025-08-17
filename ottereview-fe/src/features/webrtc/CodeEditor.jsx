import { javascript } from '@codemirror/lang-javascript'
import { Transaction } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import * as yorkie from '@yorkie-js/sdk'
import { basicSetup, EditorView } from 'codemirror'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { api } from '@/lib/api'

const CodeEditor = ({ conflictFiles }) => {
  const { roomId } = useParams()
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const docRef = useRef(null)
  const clientRef = useRef(null)
  // 🔧 추가: 문서 상태 추적을 위한 Map
  const attachedDocsRef = useRef(new Map())

  const [selectedFileName, setSelectedFileName] = useState('')
  const [availableFiles, setAvailableFiles] = useState([])
  const [status, setStatus] = useState('connecting') // connecting, connected, error
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState(null)

  // 파일명을 안전한 문서 키로 변환하는 함수
  const sanitizeFileName = (fileName) => {
    return fileName.replace(/[^a-zA-Z0-9_-]/g, '_')
  }

  // 현재 선택된 파일의 문서 키 생성
  const currentDocumentKey =
    selectedFileName && roomId ? `${roomId}_${sanitizeFileName(selectedFileName)}` : null

  // 🔧 추가: 문서 상태 확인 함수
  const isDocumentAttached = (doc) => {
    try {
      return doc && doc.getStatus() === 'attached'
    } catch {
      return false
    }
  }

  // 🔧 추가: 안전한 문서 detach 함수
  const safeDetachDocument = async (client, doc, documentKey) => {
    if (!client || !doc) {
      return
    }

    try {
      if (isDocumentAttached(doc)) {
        await client.detach(doc)
      }
    } catch {
      // detach 실패해도 계속 진행
    }
  }

  // 🔧 추가: 모든 문서 정리 함수
  const cleanupAllDocuments = async () => {
    const client = clientRef.current
    if (!client) return

    for (const [documentKey, docInfo] of attachedDocsRef.current.entries()) {
      // 구독 해제
      if (docInfo.unsubscribeFunc) {
        try {
          docInfo.unsubscribeFunc()
        } catch {}
      }

      // 문서 detach
      await safeDetachDocument(client, docInfo.doc, documentKey)
    }

    attachedDocsRef.current.clear()
  }

  // 🔧 추가: 현재 문서 저장 함수
  const saveCurrentDocument = async () => {
    const doc = docRef.current
    const view = viewRef.current

    if (!doc || !view) {
      return false
    }

    try {
      // Yorkie 문서의 변경사항을 강제로 동기화
      const currentContent = view.state.doc.toString()
      const documentContent = doc.getRoot().content?.toString() || ''

      if (currentContent !== documentContent) {
        doc.update((root) => {
          if (!root.content) {
            root.content = new yorkie.Text()
          }
          // 전체 내용을 새로운 내용으로 교체
          const currentLength = root.content.length
          if (currentLength > 0) {
            root.content.edit(0, currentLength, currentContent)
          } else {
            root.content.edit(0, 0, currentContent)
          }
        }, `자동 저장: ${selectedFileName}`)

        setLastSaveTime(new Date())
        setHasUnsavedChanges(false)
        return true
      } else {
        return true
      }
    } catch {
      return false
    }
  }

  // 파일 선택 핸들러 (자동 저장 포함)
  const handleFileSelect = async (filename) => {
    if (selectedFileName === filename) {
      return
    }

    // 현재 파일이 있으면 저장
    if (selectedFileName && docRef.current && viewRef.current) {
      await saveCurrentDocument()
    }

    setSelectedFileName(filename)
    setHasUnsavedChanges(false) // 새 파일로 전환하므로 변경사항 초기화
  }

  // 미팅룸 정보에서 파일 목록 가져오기
  const fetchMeetingRoomFiles = async (roomId) => {
    try {
      const response = await api.get(`/api/meetings/${roomId}`)

      let files = []

      if (response.data) {
        const data = response.data
        if (Array.isArray(data.files)) {
          files = extractFileNames(data.files)
        }

        return files
      }
    } catch {
      throw error
    }
  }

  // 파일명 추출 헬퍼 함수
  const extractFileNames = (items) => {
    if (!Array.isArray(items)) {
      return []
    }

    return items
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim()
        }

        if (typeof item === 'object' && item !== null) {
          const fileName = item.file_name || item.fileName || item.filename || item.name || null
          return fileName
        }

        return null
      })
      .filter((fileName) => fileName && typeof fileName === 'string' && fileName.trim() !== '')
  }

  // Yorkie 클라이언트 초기화
  useEffect(() => {
    if (!roomId) {
      setError('Room ID가 필요합니다.')
      setStatus('error')
      setLoading(false)
      return
    }

    const initializeYorkie = async () => {
      try {
        setLoading(true)
        setStatus('connecting')
        setError(null)

        // 1. 미팅룸에서 파일 목록 가져오기
        let filesToUse = []
        try {
          const meetingFiles = await fetchMeetingRoomFiles(roomId)
          filesToUse = meetingFiles
        } catch {
          filesToUse = Array.isArray(conflictFiles) ? conflictFiles : []
        }

        if (filesToUse.length === 0) {
          throw new Error('편집할 파일 목록이 없습니다.')
        }

        setAvailableFiles(filesToUse)

        // 2. Yorkie 환경변수 확인
        const rpcAddr = import.meta.env.VITE_YORKIE_API_ADDR
        const apiKey = import.meta.env.VITE_YORKIE_API_KEY

        if (!rpcAddr || !apiKey) {
          throw new Error('Yorkie 환경변수가 설정되지 않았습니다.')
        }

        // 3. Yorkie 클라이언트 생성 및 활성화
        const client = new yorkie.Client({
          rpcAddr,
          apiKey,
          syncLoopDuration: 50,
          reconnectStreamDelay: 1000,
        })

        await client.activate()
        clientRef.current = client

        // 4. 첫 번째 파일을 기본 선택
        if (filesToUse.length > 0 && !selectedFileName) {
          setSelectedFileName(filesToUse[0])
        }

        setStatus('connected')
      } catch (error) {
        setError(error.message || '클라이언트 초기화에 실패했습니다.')
        setStatus('error')
      } finally {
        setLoading(false)
      }
    }

    initializeYorkie()

    // 🔧 수정: 모든 문서를 먼저 정리 후 클라이언트 deactivate
    return () => {
      const cleanup = async () => {
        try {
          await cleanupAllDocuments()
          if (clientRef.current) {
            await clientRef.current.deactivate()
            clientRef.current = null
          }
        } catch {}
      }
      cleanup()
    }
  }, [roomId])

  // 선택된 파일에 대한 문서 연결 및 에디터 초기화
  useEffect(() => {
    if (!currentDocumentKey || !clientRef.current || status !== 'connected') {
      return
    }

    let view = null
    let doc = null
    let unsubscribeFunc = null

    const initializeEditor = async () => {
      try {
        const client = clientRef.current
        if (!client) {
          throw new Error('Yorkie 클라이언트가 준비되지 않았습니다.')
        }

        // 1. 기존 에디터 정리
        if (viewRef.current) {
          viewRef.current.destroy()
          viewRef.current = null
        }

        // 🔧 수정: 기존 문서 확인 및 재사용/detach 처리
        let existingDocInfo = attachedDocsRef.current.get(currentDocumentKey)

        if (existingDocInfo) {
          // 기존 문서가 여전히 attach되어 있는지 확인
          if (isDocumentAttached(existingDocInfo.doc)) {
            doc = existingDocInfo.doc
            unsubscribeFunc = existingDocInfo.unsubscribeFunc
          } else {
            // 상태에서 제거
            attachedDocsRef.current.delete(currentDocumentKey)
            existingDocInfo = null
          }
        }

        if (!existingDocInfo) {
          // 🔧 핵심 수정: disableGC 옵션 추가
          doc = new yorkie.Document(currentDocumentKey, { disableGC: true })

          try {
            await client.attach(doc, { initialPresence: {} })
          } catch (attachError) {
            if (attachError.message.includes('document is attached')) {
              // 이미 attach된 상태이므로 그대로 진행
            } else {
              throw attachError
            }
          }

          // 문서 이벤트 구독
          unsubscribeFunc = doc.subscribe((event) => {
            if (event.type === 'snapshot' || event.type === 'remote-change') {
              syncText()
            }
          })

          // 🔧 추가: 문서 정보를 Map에 저장
          attachedDocsRef.current.set(currentDocumentKey, {
            doc,
            unsubscribeFunc,
            lastAccessed: Date.now(),
          })
        }

        docRef.current = doc

        // 3. 기존 문서 내용 확인 및 초기화
        const existingContent = doc.getRoot().content
        if (existingContent) {
          const contentPreview = existingContent.toString().substring(0, 100)
        } else {
          doc.update((root) => {
            if (!root.content) {
              root.content = new yorkie.Text()
            }
          }, 'content 초기화')
        }

        // 4. 에디터 동기화 함수
        const syncText = () => {
          try {
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
          } catch {}
        }

        // 5. 파일 확장자에 따른 언어 설정
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

        // 6. 에디터 업데이트 리스너 (변경사항 추적 포함)
        const updateListener = EditorView.updateListener.of((v) => {
          if (!doc || !v.docChanged) return

          for (const tr of v.transactions) {
            const events = ['input', 'delete', 'move', 'undo', 'redo']
            const userEvent = events.some((e) => tr.isUserEvent(e))

            if (!userEvent || tr.annotation(Transaction.remote)) continue

            // 변경사항 발생 시 unsaved 상태로 변경
            setHasUnsavedChanges(true)

            tr.changes.iterChanges((from, to, _, __, inserted) => {
              try {
                const text = inserted.toJSON().join('\n')

                doc.update((root) => {
                  if (!root.content) {
                    root.content = new yorkie.Text()
                  }
                  root.content.edit(from, to, text)
                }, `사용자 편집: ${selectedFileName}`)

                // 편집 직후 변경사항 저장됨으로 표시 (Yorkie가 실시간 동기화하므로)
                setHasUnsavedChanges(false)
                setLastSaveTime(new Date())
              } catch {}
            })
          }
        })

        // 7. CodeMirror 에디터 생성
        view = new EditorView({
          doc: '',
          extensions: [
            basicSetup,
            getLanguageExtension(selectedFileName),
            oneDark,
            updateListener,
            EditorView.domEventHandlers({
              keydown: (event) => {
                // Ctrl+S 또는 Cmd+S로 수동 저장
                if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                  event.preventDefault()
                  saveCurrentDocument()
                  return true
                }
                return false
              },
            }),
            EditorView.theme({
              '&': {
                height: '100%',
                fontSize: '14px',
                width: '100%',
                maxWidth: '100%',
              },
              '.cm-content': {
                fontFamily: 'JetBrains Mono, "SF Mono", Consolas, Monaco, "Courier New", monospace',
                lineHeight: '1.6',
                padding: '1rem',
                width: '100%',
                maxWidth: '100%',
              },
              '.cm-editor': {
                height: '100%',
                borderRadius: '0',
                width: '100%',
                maxWidth: '100%',
              },
              '.cm-scroller': {
                height: '100%',
                width: '100%',
                maxWidth: '100%',
                overflowX: 'auto',
                overflowY: 'auto',
              },
              '.cm-focused': { outline: 'none' },
              '.cm-line': {
                maxWidth: '100%',
              },
            }),
          ],
          parent: editorRef.current,
        })

        viewRef.current = view

        // 8. 기존 문서 내용을 에디터에 로드
        syncText()
      } catch (error) {
        setError(error.message || '에디터 초기화에 실패했습니다.')
        setStatus('error')
      }
    }

    initializeEditor()

    // 🔧 수정: 에디터만 정리하고 문서는 Map에서 관리
    return () => {
      // 에디터만 정리
      if (view) {
        view.destroy()
      }

      // docRef는 초기화하지만 실제 문서는 Map에서 관리됨
      docRef.current = null
    }
  }, [currentDocumentKey, selectedFileName, status])

  // 컴포넌트 언마운트 시 정리 (자동 저장 포함)
  useEffect(() => {
    return () => {
      // 언마운트 전 현재 변경사항 저장
      if (hasUnsavedChanges && docRef.current && viewRef.current) {
        saveCurrentDocument().catch(() => {})
      }

      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }

      // 문서들은 클라이언트 정리 시점에서 함께 처리됨
      docRef.current = null
    }
  }, [])

  // 에러 상태 렌더링
  if (status === 'error') {
    return (
      <div className="h-full flex items-center justify-center flex-col gap-4 p-8 bg-red-50 dark:bg-red-900/30 rounded-lg m-4">
        <div className="text-4xl">❌</div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">연결 오류</h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <details className="text-sm text-red-800 dark:text-red-200">
            <summary className="cursor-pointer mb-2">해결 방법</summary>
            <ul className="text-left list-disc list-inside space-y-1">
              <li>URL의 roomId 파라미터 확인</li>
              <li>미팅룸 API 응답 확인</li>
              <li>Yorkie 환경변수 설정 확인</li>
              <li>네트워크 연결 상태 확인</li>
              <li>개발 서버 재시작</li>
              <li>브라우저 개발자 도구에서 상세 에러 확인</li>
            </ul>
          </details>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-full flex flex-col"
      style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}
    >
      {/* 파일 탭 영역 */}
      {availableFiles.length > 0 && (
        <div className="flex theme-bg-tertiary border-b theme-border px-4 py-2 gap-2 flex-wrap flex-shrink-0">
          {availableFiles.map((fileName) => (
            <button
              key={fileName}
              onClick={() => handleFileSelect(fileName)}
              className={`px-4 py-2 rounded-t-md text-sm font-medium transition-all duration-200 flex items-center gap-2 border-b-2 ${
                selectedFileName === fileName
                  ? 'theme-bg-primary theme-text font-semibold border-b-blue-500 shadow-sm'
                  : 'bg-transparent theme-text-secondary border-b-transparent hover:theme-bg-secondary hover:text-blue-500'
              }`}
            >
              <span>📄</span>
              <span>{fileName}</span>
              {selectedFileName === fileName && (
                <span
                  className={`text-xs ${hasUnsavedChanges ? 'text-orange-500' : 'text-green-500'}`}
                >
                  {hasUnsavedChanges ? '◯' : '●'}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 상태 표시 헤더 */}
      {selectedFileName && (
        <div
          className={`px-4 py-3 border-b flex justify-between items-center flex-shrink-0 ${
            status === 'connected'
              ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
              : loading
                ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700'
                : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
          }`}
        >
          <div
            className={`text-sm font-medium ${
              status === 'connected'
                ? 'text-green-800 dark:text-green-200'
                : loading
                  ? 'text-yellow-800 dark:text-yellow-200'
                  : 'text-red-800 dark:text-red-200'
            }`}
          >
            📄 {selectedFileName}
            <span className="ml-2 text-xs font-mono">({sanitizeFileName(selectedFileName)})</span>
            {/* 변경사항 및 저장 상태 표시 */}
            {hasUnsavedChanges ? (
              <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                ● 변경사항 있음
              </span>
            ) : lastSaveTime ? (
              <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                ✓ 저장됨 ({lastSaveTime.toLocaleTimeString()})
              </span>
            ) : null}
            {/* 🔧 추가: 현재 attach된 문서 수 표시 */}
            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
              [{attachedDocsRef.current.size} docs attached]
            </span>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
              status === 'connected'
                ? 'bg-green-500 dark:bg-green-600'
                : loading
                  ? 'bg-yellow-500 dark:bg-yellow-600'
                  : 'bg-red-500 dark:bg-red-600'
            }`}
          >
            {loading ? '🔄 연결 중...' : status === 'connected' ? '✅ 실시간 협업' : '❌ 연결 실패'}
          </div>
        </div>
      )}

      {/* 에디터 영역 */}
      <div
        ref={editorRef}
        className="flex-1"
        style={{
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          opacity: status === 'connected' && selectedFileName ? 1 : 0.7,
        }}
      >
        {!selectedFileName && (
          <div className="h-full flex items-center justify-center text-center theme-text-secondary p-8">
            {loading ? (
              <div className="space-y-4">
                <div className="text-3xl">📁</div>
                <div className="text-lg">파일 목록을 불러오는 중...</div>
                <div className="text-sm theme-text-muted">
                  미팅룸 API에서 파일 목록을 가져오고 있습니다.
                </div>
              </div>
            ) : availableFiles.length > 0 ? (
              <div className="space-y-4">
                <div className="text-3xl">📂</div>
                <div className="text-lg">편집할 파일을 선택해주세요</div>
                <div className="text-sm theme-text-muted">
                  위의 파일 탭을 클릭하여 협업 편집을 시작하세요.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-3xl">📭</div>
                <div className="text-lg">사용 가능한 파일이 없습니다</div>
                <div className="text-sm theme-text-muted">
                  미팅룸에 설정된 충돌 파일이 없습니다.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CodeEditor
