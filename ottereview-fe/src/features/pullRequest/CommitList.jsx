// features/pullRequest/CommitList.jsx
import { GitCommit } from 'lucide-react'

import Box from '../../components/Box'

const CommitList = ({ commits = [] }) => {
  return (
    <div className="space-y-2">
      {commits.map((commit) => (
        <Box key={commit.sha} shadow className="flex items-center justify-between px-4 py-3">
          <div className="flex items-start gap-3">
            <GitCommit className="w-4 h-4 mt-1 text-stone-500" />
            <div>
              <p>{commit.commitTitle || commit.message}</p>
              <div className="text-sm text-gray-500 flex gap-2">
                <span>{commit.authorName}</span>
                <span>{formatDate(commit.authorDate)}</span>
              </div>
            </div>
          </div>
          <span className="text-sm text-gray-500">{commit.shortSha}</span>
        </Box>
      ))}
    </div>
  )
}

// 날짜 "2025-08-05T02:59:04" → "2일 전" 형식으로 바꾸는 함수
function formatDate(isoString) {
  const now = new Date()
  const then = new Date(isoString)
  const diff = Math.floor((now - then) / 1000)

  const day = 60 * 60 * 24
  const hour = 60 * 60

  if (diff < hour) return `${Math.floor(diff / 60)}분 전`
  if (diff < day) return `${Math.floor(diff / hour)}시간 전`
  return `${Math.floor(diff / day)}일 전`
}

export default CommitList
