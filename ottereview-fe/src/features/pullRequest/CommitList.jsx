import { GitCommit } from 'lucide-react'

import Box from '../../components/Box'
import { formatRelativeTime } from '../../lib/utils'

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
                <span>{formatRelativeTime(commit.authorDate)}</span>
              </div>
            </div>
          </div>
          <span className="text-sm text-gray-500">{commit.shortSha}</span>
        </Box>
      ))}
    </div>
  )
}

export default CommitList
