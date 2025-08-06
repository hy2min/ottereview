import { FolderCode } from 'lucide-react'

import Box from '@/components/Box'

const RepositoryCard = ({ repo, onClick }) => {
  return (
    <Box shadow pixelHover className="m-3" onClick={onClick}>
      <div className="flex space-x-4">
        <FolderCode className="my-auto" />
        <div>
          <strong>{repo.fullName}</strong>
          {/* <p>{repo.description}</p> */}
        </div>
      </div>
    </Box>
  )
}

export default RepositoryCard
