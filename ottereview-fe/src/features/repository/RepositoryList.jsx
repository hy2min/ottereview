import { useNavigate } from 'react-router-dom'

import Box from '@/components/Box'
import RepositoryCard from '@/features/repository/RepositoryCard'
import { useRepoStore } from '@/features/repository/stores/repoStore'

const RepositoryList = () => {
  const navigate = useNavigate()
  const repos = useRepoStore((state) => state.repos)

  const handleImport = () => {
    const importUrl = import.meta.env.VITE_GITHUB_IMPORT_URL
    const width = 600
    const height = 700

    window.open(
      importUrl,
      '_blank',
      `width=${width},height=${height},left=${(screen.width - width) / 2},top=${(screen.height - height) / 2},scrollbars=yes,resizable=yes`
    )
  }

  const handleRepoClick = (repoId) => {
    navigate(`/${repoId}`)
  }

  return (
    <Box shadow className="w-full h-[70vh] flex flex-col">
      <div className="flex justify-between mb-2">
        <h2 className="text-xl">레포지토리</h2>
        <button className="border-2 border-black px-4" onClick={handleImport}>
          연결
        </button>
      </div>
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {repos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-2xl text-gray-500">연결된 레포지토리가 없습니다.</p>
          </div>
        ) : (
          repos.map((repo) =>
            repo.id ? (
              <RepositoryCard key={repo.id} repo={repo} onClick={() => handleRepoClick(repo.id)} />
            ) : null
          )
        )}
      </div>
    </Box>
  )
}

export default RepositoryList
