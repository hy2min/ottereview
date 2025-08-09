import { GitCommit } from 'lucide-react'

import Box from '@/components/Box'
import { formatRelativeTime } from '@/lib/utils/useFormatTime'

const CommitList = ({ commits = [] }) => {
  return (
    <div className="space-y-2">
      {commits.map((commit) => (
        <Box key={commit.sha} shadow className="flex items-center px-4 py-3">
          <GitCommit className="min-w-4 min-h-4 text-stone-500 my-auto shrink-0" />
          <div className="flex flex-wrap items-center justify-between gap-x-2 w-full ml-3">
            {/* 텍스트 정보 */}
            <div>
              <p>{commit.commitTitle || commit.message}</p>
              <div className="text-sm text-gray-500 flex flex-wrap space-x-2">
                <span>{commit.authorName}</span>
                <span>{formatRelativeTime(commit.authorDate)}</span>
              </div>
            </div>

            {/* SHA 정보 */}
            <span className="text-sm text-gray-500">{commit.shortSha}</span>
          </div>
        </Box>
      ))}
    </div>
  )
}

export default CommitList
