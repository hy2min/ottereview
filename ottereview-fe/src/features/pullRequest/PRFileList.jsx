import { AnimatePresence, motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import { useState } from 'react'

import Box from '@/components/Box'
import CodeDiff from '@/components/CodeDiff'

const PRFileList = ({
  files,
  onAddComment,
  onRemoveComment,
  fileComments = {},
  existingReviewComments = {},
  descriptions = [],
  prAuthor = {},
  showDiffHunk = false,
  commentMode = 'review',
  onDataRefresh,
  expandedFiles: externalExpandedFiles,
  setExpandedFiles: externalSetExpandedFiles,
}) => {
  const [internalExpandedFiles, setInternalExpandedFiles] = useState([])
  
  // 외부에서 제어되는 경우 외부 state 사용, 아니면 내부 state 사용
  const expandedFiles = externalExpandedFiles !== undefined ? externalExpandedFiles : internalExpandedFiles
  const setExpandedFiles = externalSetExpandedFiles || setInternalExpandedFiles

  const toggle = (filename) => {
    setExpandedFiles((prev) => {
      // 이미 열려있는 파일인지 확인
      if (prev.includes(filename)) {
        // 이미 열려있다면 배열에서 제거
        return prev.filter((f) => f !== filename)
      } else {
        // 닫혀있다면 배열에 추가
        return [...prev, filename]
      }
    })
  }

  return (
    <div className="space-y-2 text-sm">
      {files.map((f) => (
        <Box key={f.filename} shadow className="p-2 bg-gray-50 flex flex-col ">
          {/* 파일 정보가 담긴 클릭 가능한 헤더 */}
          <div
            className="flex justify-between items-center cursor-pointer"
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
          </div>

          {/* CodeDiff 컴포넌트를 부드럽게 슬라이드되도록 애니메이션 적용 */}
          <AnimatePresence>
            {expandedFiles.includes(f.filename) && ( // 배열에 포함되어 있는지 확인
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.1, ease: 'easeInOut' }}
                className="min-w-0 overflow-x-auto overflow-y-hidden"
              >
                <CodeDiff
                  patch={f.patch}
                  filePath={f.filename}
                  onAddComment={(lineIndex, commentData) =>
                    onAddComment(f.filename, lineIndex, commentData)
                  }
                  onRemoveComment={(lineIndex, commentId) =>
                    onRemoveComment?.(f.filename, lineIndex, commentId)
                  }
                  initialSubmittedComments={fileComments[f.filename]?.submittedComments || {}}
                  existingReviewComments={existingReviewComments[f.filename] || {}}
                  descriptions={descriptions}
                  prAuthor={prAuthor}
                  showDiffHunk={showDiffHunk}
                  commentMode={commentMode}
                  onDataRefresh={onDataRefresh}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      ))}
    </div>
  )
}

export default PRFileList
