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

  const [selectedFileName, setSelectedFileName] = useState('')
  const [availableFiles, setAvailableFiles] = useState([])
  const [status, setStatus] = useState('connecting') // connecting, connected, error
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // 파일명을 안전한 문서 키로 변환하는 함수
  const sanitizeFileName = (fileName) => {
    return fileName.replace(/[^a-zA-Z0-9_-]/g, '_')
  }

  // 현재 선택된 파일의 문서 키 생성
  const currentDocumentKey =
    selectedFileName && roomId ? `${roomId}_${sanitizeFileName(selectedFileName)}` : null

  // 파일 선택 핸들러
  const handleFileSelect = (filename) => {
    if (selectedFileName === filename) {
      console.log('📝 동일한 파일 선택됨, 무시:', filename)
      return
    }

    console.log('📝 파일 선택:', filename, '(이전:', selectedFileName, ')')
    setSelectedFileName(filename)
  }

  // 미팅룸 정보에서 파일 목록 가져오기
  const fetchMeetingRoomFiles = async (roomId) => {
    try {
      console.log(`📡 미팅룸 ${roomId} 파일 목록 요청 중...`)

      const response = await api.get(`/api/meetings/${roomId}`)
      console.log('📋 미팅룸 API 전체 응답:', response.data)

      let files = []

      if (response.data) {
        const data = response.data
        if (Array.isArray(data.files)) {
          files = extractFileNames(data.files)
          console.log('📁 files 배열에서 추출:', files)
        }

        console.log(`✅ 최종 추출된 파일 목록:`, files)

        if (files.length === 0) {
          console.warn('⚠️ 파일 목록이 비어있습니다.')
        }

        return files
      }
    } catch (error) {
      console.error('❌ 미팅룸 파일 목록 요청 실패:', error)
      throw error
    }
  }

  // 파일명 추출 헬퍼 함수
  const extractFileNames = (items) => {
    if (!Array.isArray(items)) {
      console.warn('⚠️ extractFileNames: 입력이 배열이 아닙니다:', items)
      return []
    }

    return items
      .map((item, index) => {
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
      console.error('❌ roomId가 없습니다')
      setError('Room ID가 필요합니다.')
      setStatus('error')
      setLoading(false)
      return
    }

    console.log('🚀 Yorkie CodeEditor 초기화 시작:', { roomId, conflictFiles })

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
        } catch (apiError) {
          console.warn('⚠️ API에서 파일 목록을 가져올 수 없음, fallback 사용:', apiError)
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
        console.log('✅ Yorkie 클라이언트 활성화 완료')

        // 4. 첫 번째 파일을 기본 선택
        if (filesToUse.length > 0 && !selectedFileName) {
          setSelectedFileName(filesToUse[0])
        }

        setStatus('connected')
        console.log('✅ Yorkie 클라이언트 초기화 완료')
      } catch (error) {
        console.error('❌ Yorkie 클라이언트 초기화 실패:', error)
        setError(error.message || '클라이언트 초기화에 실패했습니다.')
        setStatus('error')
      } finally {
        setLoading(false)
      }
    }

    initializeYorkie()

    return () => {
      console.log('🧹 Yorkie 클라이언트 정리 중...')
      if (clientRef.current) {
        clientRef.current.deactivate().catch(console.error)
      }
    }
  }, [roomId])

  // 선택된 파일에 대한 문서 연결 및 에디터 초기화
  useEffect(() => {
    if (!currentDocumentKey || !clientRef.current || status !== 'connected') {
      console.log('📝 에디터 초기화 조건 미충족:', {
        currentDocumentKey,
        hasClient: !!clientRef.current,
        status,
      })
      return
    }

    console.log('📝 문서 연결 시작:', currentDocumentKey)

    let view
    let doc
    let unsubscribeFunctions = []

    const initializeEditor = async () => {
      try {
        const client = clientRef.current

        if (!client) {
          throw new Error('Yorkie 클라이언트가 준비되지 않았습니다.')
        }

        // 1. 기존 에디터와 문서 정리
        if (viewRef.current) {
          console.log('🧹 기존 에디터 정리 중...')
          viewRef.current.destroy()
          viewRef.current = null
        }

        if (docRef.current) {
          console.log('🧹 기존 문서 정리 중...')
          try {
            await client.detach(docRef.current)
          } catch (detachError) {
            console.warn('⚠️ 기존 문서 detach 실패:', detachError)
          }
          docRef.current = null
        }

        console.log('🔗 새 Yorkie 문서에 연결 시도:', currentDocumentKey)

        // 2. 새 문서 생성 및 연결
        doc = new yorkie.Document(currentDocumentKey)

        // 공식 문서에 따른 올바른 attach 방식
        await client.attach(doc, { initialPresence: {} })
        docRef.current = doc
        console.log('✅ Yorkie 문서 연결 완료:', currentDocumentKey)

        // 3. 기존 문서 내용 확인
        const existingContent = doc.getRoot().content
        if (existingContent) {
          const contentPreview = existingContent.toString().substring(0, 100)
          console.log('✅ 기존 문서 내용 발견:', contentPreview + '...')
        } else {
          console.log('ℹ️ 문서에 content가 없습니다.')
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
                console.log('🔄 에디터 내용 동기화')
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
          } catch (syncError) {
            console.error('❌ 동기화 오류:', syncError)
          }
        }

        // 5. 문서 이벤트 구독 (공식 문서 방식)
        const unsubscribeDoc = doc.subscribe((event) => {
          console.log('📡 Yorkie 문서 이벤트:', event.type)
          if (event.type === 'snapshot' || event.type === 'remote-change') {
            syncText()
          }
        })
        unsubscribeFunctions.push(unsubscribeDoc)

        // 6. 파일 확장자에 따른 언어 설정
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

        // 7. 에디터 업데이트 리스너
        const updateListener = EditorView.updateListener.of((v) => {
          if (!doc || !v.docChanged) return

          for (const tr of v.transactions) {
            const events = ['input', 'delete', 'move', 'undo', 'redo']
            const userEvent = events.some((e) => tr.isUserEvent(e))

            if (!userEvent || tr.annotation(Transaction.remote)) continue

            tr.changes.iterChanges((from, to, _, __, inserted) => {
              try {
                const text = inserted.toJSON().join('\n')
                console.log('✏️ 사용자 편집:', { from, to, textLength: text.length })

                doc.update((root) => {
                  if (!root.content) {
                    root.content = new yorkie.Text()
                  }
                  root.content.edit(from, to, text)
                }, `사용자 편집: ${selectedFileName}`)
              } catch (editError) {
                console.error('❌ 편집 업데이트 오류:', editError)
              }
            })
          }
        })

        // 8. CodeMirror 에디터 생성 (너비 제한 추가)
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

        // 9. 기존 문서 내용을 에디터에 로드
        syncText()
        console.log('✅ 에디터 초기화 완료:', selectedFileName)
      } catch (error) {
        console.error('❌ 에디터 초기화 실패:', error)
        setError(error.message || '에디터 초기화에 실패했습니다.')
        setStatus('error')
      }
    }

    initializeEditor()

    return () => {
      console.log('🧹 문서 및 에디터 정리 중:', currentDocumentKey)

      // 구독 해제
      unsubscribeFunctions.forEach((unsubscribe) => {
        try {
          unsubscribe()
        } catch (error) {
          console.error('구독 해제 오류:', error)
        }
      })

      // 문서 detach
      if (doc && clientRef.current) {
        clientRef.current.detach(doc).catch((detachError) => {
          console.error('문서 detach 오류:', detachError)
        })
      }

      // 에디터 정리
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
      if (docRef.current && clientRef.current) {
        clientRef.current.detach(docRef.current).catch(console.error)
      }
    }
  }, [])

  // 에러 상태 렌더링
  if (status === 'error') {
    return (
      <div className="h-full flex items-center justify-center flex-col gap-4 p-8 bg-red-50 rounded-lg m-4">
        <div className="text-4xl">❌</div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-red-700 mb-2">연결 오류</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <details className="text-sm text-red-800">
            <summary className="cursor-pointer mb-2">해결 방법</summary>
            <ul className="text-left list-disc list-inside space-y-1">
              <li>URL의 roomId 파라미터 확인</li>
              <li>미팅룸 API 응답 확인</li>
              <li>Yorkie 환경변수 설정 확인</li>
              <li>네트워크 연결 상태 확인</li>
              <li>개발 서버 재시작</li>
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
        <div className="flex bg-gray-50 border-b border-gray-200 px-4 py-2 gap-2 flex-wrap flex-shrink-0">
          {availableFiles.map((fileName) => (
            <button
              key={fileName}
              onClick={() => handleFileSelect(fileName)}
              className={`px-4 py-2 rounded-t-md text-sm font-medium transition-all duration-200 flex items-center gap-2 border-b-2 ${
                selectedFileName === fileName
                  ? 'bg-white text-gray-800 font-semibold border-b-blue-500 shadow-sm'
                  : 'bg-transparent text-gray-600 border-b-transparent hover:bg-blue-50 hover:text-blue-700'
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
          className={`px-4 py-3 border-b flex justify-between items-center flex-shrink-0 ${
            status === 'connected'
              ? 'bg-green-50 border-green-200'
              : loading
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
          }`}
        >
          <div
            className={`text-sm font-medium ${
              status === 'connected'
                ? 'text-green-800'
                : loading
                  ? 'text-yellow-800'
                  : 'text-red-800'
            }`}
          >
            📄 {selectedFileName}
            <span className="ml-2 text-xs font-mono">({sanitizeFileName(selectedFileName)})</span>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
              status === 'connected' ? 'bg-green-500' : loading ? 'bg-yellow-500' : 'bg-red-500'
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
          <div className="h-full flex items-center justify-center text-center text-gray-600 p-8">
            {loading ? (
              <div className="space-y-4">
                <div className="text-3xl">📁</div>
                <div className="text-lg">파일 목록을 불러오는 중...</div>
                <div className="text-sm text-gray-400">
                  미팅룸 API에서 파일 목록을 가져오고 있습니다.
                </div>
              </div>
            ) : availableFiles.length > 0 ? (
              <div className="space-y-4">
                <div className="text-3xl">📂</div>
                <div className="text-lg">편집할 파일을 선택해주세요</div>
                <div className="text-sm text-gray-400">
                  위의 파일 탭을 클릭하여 협업 편집을 시작하세요.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-3xl">📭</div>
                <div className="text-lg">사용 가능한 파일이 없습니다</div>
                <div className="text-sm text-gray-400">미팅룸에 설정된 충돌 파일이 없습니다.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CodeEditor
