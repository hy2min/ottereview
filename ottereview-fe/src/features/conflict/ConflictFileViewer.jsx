import React from 'react'

import Box from '@/components/Box'

const ConflictFileViewer = ({ conflictFiles, selectedFiles, toggleFile }) => {
  if (!conflictFiles || conflictFiles.length === 0) {
    return <p>충돌된 파일이 없습니다.</p>
  }

  return (
    <div className="space-y-2">
      {conflictFiles.map((file) => (
        <Box
          key={file}
          className="flex items-center gap-2 p-3 cursor-pointer hover:theme-bg-tertiary transition-colors"
          as="label"
        >
          <input
            type="checkbox"
            checked={selectedFiles.includes(file)}
            onChange={() => toggleFile(file)}
          />
          <span>{file}</span>
        </Box>
      ))}
    </div>
  )
}

export default ConflictFileViewer
