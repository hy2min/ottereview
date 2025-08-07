import { FolderCode } from 'lucide-react'

import Box from '@/components/Box'

const RepositoryCard = ({ repo, onClick }) => {
  const [account, name] = repo.fullName.split('/')

  return (
    <Box shadow pixelHover className="m-3" onClick={onClick}>
      <div className="flex items-center justify-between space-x-4 overflow-hidden">
        <div className="flex items-center space-x-2 min-w-0">
          <FolderCode className="text-stone-700 shrink-0" />
          <strong className="text-stone-900 truncate">{name}</strong>
        </div>

        <strong className="text-sm text-stone-900 shrink-0">{account}</strong>
      </div>
    </Box>
  )
}

export default RepositoryCard
