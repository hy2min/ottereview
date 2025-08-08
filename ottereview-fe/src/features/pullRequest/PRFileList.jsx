import { FileText } from 'lucide-react'
import { useState } from 'react'

import Box from '@/components/Box'
import CodeDiff from '@/components/CodeDiff'

const PRFileList = ({ files }) => {
  const [expandedFile, setExpandedFile] = useState(null)
  const toggle = (filename) => setExpandedFile((prev) => (prev === filename ? null : filename))

  return (
    <div className="space-y-2 text-sm">
      {files.map((f) => (
        <div key={f.filename}>
          <Box
            shadow
            className="flex justify-between items-center cursor-pointer p-2 bg-gray-50 flex-wrap"
            onClick={() => toggle(f.filename)}
          >
            <div className="flex space-x-3">
              <FileText className="w-4 h-4 text-stone-600" />
              <span>{f.filename}</span>
            </div>
            <div className="space-x-2">
              <span className="text-green-600">+{f.additions}</span>
              <span className="text-red-600">-{f.deletions}</span>
            </div>
          </Box>
          {expandedFile === f.filename && <CodeDiff patch={f.patch} />}
        </div>
      ))}
    </div>
  )
}

export default PRFileList
