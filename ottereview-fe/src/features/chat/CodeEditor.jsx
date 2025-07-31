import * as Y from '@yorkie-js/sdk'
import * as monaco from 'monaco-editor'
import { useEffect, useRef } from 'react'

const CodeEditor = ({ roomId }) => {
  const editorRef = useRef(null)
  const monacoInstanceRef = useRef(null)
  const yorkieClientRef = useRef(null)
  const yorkieDocRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      try {
        console.log('[Yorkie] Connecting client...')

        // 1. Yorkie 클라이언트 생성 및 활성화
        const client = new Y.Client({
          rpcAddr: import.meta.env.VITE_YORKIE_API_ADDR,
          apiKey: import.meta.env.VITE_YORKIE_API_KEY,
        })
        await client.activate()
        yorkieClientRef.current = client

        console.log('[Yorkie] Client activated')

        // 2. 문서 생성 및 초기화
        const doc = new Y.Document(`code-room-${roomId}`)
        await client.attach(doc)
        console.log('[Yorkie] Document attached:', doc)
        yorkieDocRef.current = doc
        doc.update((root) => {
          if (!root.code) {
            root.code = new Y.Text()
            root.code.insert(0, '//공유 코드를 입력하세요.')
          }
        })

        // 3. Monaco Editor 생성
        const editor = monaco.editor.create(editorRef.current, {
          value: doc.getRoot().code.toString(),
          language: 'javascript',
          theme: 'vs-dark',
          automaticLayout: true,
        })
        console.log('[Monaco] Editor intialized')
        monacoInstanceRef.current = editor

        // 4. Monaco -> Yorkie 동기화
        editor.onDidChangeModelContent(() => {
          const newValue = editor.getValue()
          doc.update((root) => {
            root.code.edit(0, root.code.length, newValue)
          })
        })

        // 5. Yorkie -> Monaco 반영
        doc.getRoot().code.onChanges(() => {
          const newVal = doc.getRoot().code.toString()
          if (editor.getValue() !== newVal) {
            editor.setValue(newVal)
          }
        })
      } catch (error) {
        console.log('[ERROR]', error)
      }
    }

    init()

    return () => {
      if (yorkieClientRef.current && yorkieDocRef.current) {
        yorkieClientRef.current.detach(yorkieDocRef.current)
        yorkieDocRef.current.deactivate()
      }
    }
  }, [roomId])

  return <div ref={editorRef} style={{ height: '500px', border: '1px solid #ccc' }}></div>
}

export default CodeEditor
