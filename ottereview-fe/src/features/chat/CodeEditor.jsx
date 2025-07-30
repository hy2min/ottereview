import * as monaco from 'monaco-editor'
import { useEffect, useRef } from 'react'
import * as Y from 'yorkie-js-sdk'

const CodeEditor = ({ roomId }) => {
  const editorRef = useRef(null)
  const monacoInstanceRef = useRef(null)
  const yorkieClientRef = useRef(null)
  const yorkieDocRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      // 1. Yorkie 클라이언트 생성 및 활성화
      const client = new Y.client('http://localhost:8080')
      await client.activate()
      yorkieClientRef.current = client

      //   2. 문서 생성 및 초기화
      const doc = new Y.Document(`code-room-${roomId}`)
      doc.update((root) => {
        if (!root.code) root.code = new Y.text()
      })
      await client.attach(doc)
      yorkieDocRef.current = doc

      // 3. Monaco Editor 생성
      const editor = monaco.editor.create(editorRef.current, {
        value: doc.getRoot().code.toString(),
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
      })
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
