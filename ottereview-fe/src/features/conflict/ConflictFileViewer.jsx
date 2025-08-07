import React from 'react'

const ConflictFileViewer = ({ conflictFiles, selectedFiles, toggleFile }) => {
  if (!conflictFiles || conflictFiles.length === 0) {
    return <p>충돌된 파일이 없습니다.</p>
  }

  return (
    <div className="space-y-2">
      {conflictFiles.map((file) => (
        <label
          key={file}
          className="flex items-center gap-2 border px-3 py-1 cursor-pointer rounded-md"
        >
          <input
            type="checkbox"
            checked={selectedFiles.includes(file)}
            onChange={() => toggleFile(file)}
          />
          <span>{file}</span>
        </label>
      ))}
    </div>
  )
}

export default ConflictFileViewer
